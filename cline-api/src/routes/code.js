const express = require('express');
const { generateCode, editCode, getDiff } = require('../services/codeService');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// POST /api/generate - Generate new code from requirements
router.post('/generate', validateRequest('generate'), async (req, res, next) => {
  try {
    const { prompt, options = {} } = req.body;
    
    console.log(`📝 Generate request: ${prompt.substring(0, 100)}...`);
    
    const result = await generateCode(prompt, options);
    
    res.json({
      success: true,
      logs: result.logs,
      files: result.files,
      result: result.result,
      metadata: {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/edit - Edit existing code
router.post('/edit', validateRequest('edit'), async (req, res, next) => {
  try {
    const { filePath, content, instructions, options = {} } = req.body;
    
    console.log(`✏️  Edit request for: ${filePath}`);
    
    const result = await editCode(filePath, content, instructions, options);
    
    res.json({
      success: true,
      logs: result.logs,
      files: result.files,
      result: result.result,
      metadata: {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/diff - Generate diff between code versions
router.post('/diff', validateRequest('diff'), async (req, res, next) => {
  try {
    const { originalContent, newContent, filePath } = req.body;
    
    console.log(`🔍 Diff request for: ${filePath || 'unnamed file'}`);
    
    const result = await getDiff(originalContent, newContent, filePath);
    
    res.json({
      success: true,
      logs: [`Generated diff for ${filePath || 'file'}`],
      files: [{
        path: filePath || 'file.txt',
        diff: result.diff,
        changes: result.changes
      }],
      result: `Diff generated: ${result.changes.additions} additions, ${result.changes.deletions} deletions`,
      metadata: {
        processingTime: result.processingTime
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;