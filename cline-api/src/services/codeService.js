const { getLLMProvider } = require('./llmService');
const { createDiff } = require('../utils/diff');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate new code based on requirements
 */
const generateCode = async (prompt, options = {}) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  const logs = [`[${requestId}] Starting code generation...`];
  
  try {
    // Get LLM provider
    const llmProvider = getLLMProvider(options.provider);
    logs.push(`[${requestId}] Using ${llmProvider.name} provider`);
    
    // Enhance prompt for code generation
    const enhancedPrompt = buildGenerationPrompt(prompt, options);
    logs.push(`[${requestId}] Enhanced prompt prepared`);
    
    // Generate code using LLM
    logs.push(`[${requestId}] Calling LLM API...`);
    const llmResponse = await llmProvider.generateCode(enhancedPrompt, options);
    logs.push(`[${requestId}] LLM response received`);
    
    // Parse the response to extract files
    const files = parseCodeFromResponse(llmResponse.content);
    logs.push(`[${requestId}] Parsed ${files.length} files from response`);
    
    const processingTime = Date.now() - startTime;
    
    return {
      logs,
      files,
      result: `Successfully generated ${files.length} file(s)`,
      model: llmResponse.model,
      provider: llmProvider.name,
      tokensUsed: llmResponse.tokensUsed,
      processingTime
    };
    
  } catch (error) {
    logs.push(`[${requestId}] Error: ${error.message}`);
    throw error;
  }
};

/**
 * Edit existing code based on instructions
 */
const editCode = async (filePath, content, instructions, options = {}) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  const logs = [`[${requestId}] Starting code editing...`];
  
  try {
    // Get LLM provider
    const llmProvider = getLLMProvider(options.provider);
    logs.push(`[${requestId}] Using ${llmProvider.name} provider`);
    
    // Build edit prompt
    const editPrompt = buildEditPrompt(filePath, content, instructions, options);
    logs.push(`[${requestId}] Edit prompt prepared for ${filePath || 'file'}`);
    
    // Get edited code from LLM
    logs.push(`[${requestId}] Calling LLM API...`);
    const llmResponse = await llmProvider.editCode(editPrompt, options);
    logs.push(`[${requestId}] LLM response received`);
    
    // Parse the edited content
    const editedContent = parseEditedContent(llmResponse.content, content);
    logs.push(`[${requestId}] Code edited successfully`);
    
    // Generate diff
    const diff = createDiff(content, editedContent, filePath);
    logs.push(`[${requestId}] Diff generated`);
    
    const files = [{
      path: filePath || 'edited-file.txt',
      content: editedContent,
      diff: diff.patch,
      changes: diff.stats
    }];
    
    const processingTime = Date.now() - startTime;
    
    return {
      logs,
      files,
      result: `Successfully edited ${filePath || 'file'}`,
      model: llmResponse.model,
      provider: llmProvider.name,
      tokensUsed: llmResponse.tokensUsed,
      processingTime
    };
    
  } catch (error) {
    logs.push(`[${requestId}] Error: ${error.message}`);
    throw error;
  }
};

/**
 * Generate diff between two versions
 */
const getDiff = async (originalContent, newContent, filePath) => {
  const startTime = Date.now();
  
  try {
    const diff = createDiff(originalContent, newContent, filePath);
    const processingTime = Date.now() - startTime;
    
    return {
      diff: diff.patch,
      changes: diff.stats,
      processingTime
    };
    
  } catch (error) {
    throw error;
  }
};

/**
 * Build enhanced prompt for code generation
 */
const buildGenerationPrompt = (prompt, options) => {
  let enhancedPrompt = `You are an expert software developer. Generate clean, well-structured code based on the following requirements:

REQUIREMENTS:
${prompt}

INSTRUCTIONS:
1. Generate complete, functional code
2. Include appropriate comments and documentation
3. Follow best practices for the target language/framework
4. Structure the response with clear file separations
5. Include file paths and names in your response

`;

  if (options.language) {
    enhancedPrompt += `TARGET LANGUAGE/FRAMEWORK: ${options.language}\n`;
  }
  
  if (options.style) {
    enhancedPrompt += `CODE STYLE: ${options.style}\n`;
  }
  
  enhancedPrompt += `
FORMAT YOUR RESPONSE AS:
\`\`\`filepath: path/to/file.ext
[file content here]
\`\`\`

Generate multiple files if needed, each in its own code block with the filepath specified.`;

  return enhancedPrompt;
};

/**
 * Build prompt for code editing
 */
const buildEditPrompt = (filePath, content, instructions, options) => {
  let editPrompt = `You are an expert software developer. Edit the following code according to the given instructions:

FILE: ${filePath || 'code file'}

CURRENT CODE:
\`\`\`
${content}
\`\`\`

EDIT INSTRUCTIONS:
${instructions}

REQUIREMENTS:
1. Make only the necessary changes requested
2. Preserve existing functionality unless explicitly asked to change it
3. Follow the same code style and conventions
4. Include appropriate comments for new/modified sections
5. Return the complete modified file content

Return the complete edited code without any explanations or markdown formatting.`;

  return editPrompt;
};

/**
 * Parse code files from LLM response
 */
const parseCodeFromResponse = (response) => {
  const files = [];
  
  // Look for code blocks with filepath
  const codeBlockRegex = /```(?:filepath:\s*(.+?)\n)?([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const filePath = match[1] || `generated-file-${files.length + 1}.txt`;
    const content = match[2].trim();
    
    if (content) {
      files.push({
        path: filePath.trim(),
        content: content,
        diff: `@@ -0,0 +1,${content.split('\n').length} @@\n+${content.split('\n').join('\n+')}`
      });
    }
  }
  
  // If no structured code blocks found, treat entire response as single file
  if (files.length === 0 && response.trim()) {
    files.push({
      path: 'generated-code.txt',
      content: response.trim(),
      diff: `@@ -0,0 +1,${response.trim().split('\n').length} @@\n+${response.trim().split('\n').join('\n+')}`
    });
  }
  
  return files;
};

/**
 * Parse edited content from LLM response
 */
const parseEditedContent = (response, originalContent) => {
  // Remove any markdown formatting and explanations
  let editedContent = response.trim();
  
  // If response contains code blocks, extract the code
  const codeBlockMatch = editedContent.match(/```[\s\S]*?\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    editedContent = codeBlockMatch[1].trim();
  }
  
  // If the response looks like it's just explaining changes, return original
  if (editedContent.length < originalContent.length * 0.5 && 
      !editedContent.includes('{') && 
      !editedContent.includes('function') && 
      !editedContent.includes('class')) {
    console.warn('LLM response appears to be explanatory rather than code, returning original');
    return originalContent;
  }
  
  return editedContent;
};

module.exports = {
  generateCode,
  editCode,
  getDiff
};