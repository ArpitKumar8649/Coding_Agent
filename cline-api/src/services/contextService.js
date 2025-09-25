const { v4: uuidv4 } = require('uuid');

class ContextService {
  constructor(cacheService) {
    this.cache = cacheService;
    this.contexts = new Map(); // In-memory backup
    this.sessions = new Map(); // Active sessions
  }

  /**
   * Create new project context
   */
  async createProject(userId, projectData = {}) {
    const projectId = uuidv4();
    
    const context = {
      id: projectId,
      userId,
      name: projectData.name || `Project ${projectId.substring(0, 8)}`,
      description: projectData.description || '',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      
      // Project structure
      components: {},
      files: {},
      dependencies: new Set(['react']),
      
      // Styling and preferences  
      styles: {
        framework: projectData.stylingFramework || 'tailwind',
        theme: projectData.theme || 'modern',
        responsive: projectData.responsive !== false
      },
      
      // User preferences
      preferences: {
        llmProvider: projectData.preferredProvider || 'anthropic',
        model: projectData.preferredModel || 'claude-3-5-sonnet-20241022',
        codeStyle: projectData.codeStyle || 'modern',
        typescript: projectData.typescript || false
      },
      
      // Conversation history
      conversations: [],
      
      // Statistics
      stats: {
        totalRequests: 0,
        successfulGenerations: 0,
        editsSessions: 0,
        lastActivity: new Date().toISOString()
      }
    };

    await this.saveContext(projectId, context);
    
    console.log(`📂 Created new project context: ${projectId}`);
    return context;
  }

  /**
   * Get project context
   */
  async getProject(projectId) {
    try {
      // Try cache first
      const cacheKey = `context:${projectId}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log(`📂 Context loaded from cache: ${projectId}`);
        return this.deserializeContext(cached);
      }
      
      // Try memory backup
      const memContext = this.contexts.get(projectId);
      if (memContext) {
        console.log(`📂 Context loaded from memory: ${projectId}`);
        return this.deserializeContext(memContext);
      }
      
      console.log(`❌ Context not found: ${projectId}, available contexts: ${this.contexts.size}`);
      return null;
    } catch (error) {
      console.error('Error getting project context:', error);
      return null;
    }
  }

  /**
   * Update project context
   */
  async updateProject(projectId, updates) {
    const context = await this.getProject(projectId);
    if (!context) {
      throw new Error(`Project context not found: ${projectId}`);
    }

    // Merge updates
    const updatedContext = {
      ...context,
      ...updates,
      updated: new Date().toISOString(),
      stats: {
        ...context.stats,
        ...updates.stats
      }
    };

    await this.saveContext(projectId, updatedContext);
    return updatedContext;
  }

  /**
   * Add conversation entry to project
   */
  async addConversation(projectId, entry) {
    const context = await this.getProject(projectId);
    if (!context) {
      throw new Error(`Project context not found: ${projectId}`);
    }

    const conversationEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: entry.type || 'generate',
      userRequest: entry.userRequest,
      response: {
        success: entry.response?.success || false,
        filesGenerated: entry.response?.files?.length || 0,
        provider: entry.response?.metadata?.provider,
        model: entry.response?.metadata?.model,
        tokensUsed: entry.response?.metadata?.tokensUsed || 0,
        processingTime: entry.response?.metadata?.processingTime || 0
      },
      metadata: entry.metadata || {}
    };

    context.conversations.push(conversationEntry);
    
    // Keep only last 50 conversations to manage memory
    if (context.conversations.length > 50) {
      context.conversations = context.conversations.slice(-50);
    }

    // Update stats
    context.stats.totalRequests++;
    context.stats.lastActivity = conversationEntry.timestamp;
    
    if (conversationEntry.response.success) {
      context.stats.successfulGenerations++;
    }

    await this.saveContext(projectId, context);
    return conversationEntry;
  }

  /**
   * Add component to project context
   */
  async addComponent(projectId, componentData) {
    const context = await this.getProject(projectId);
    if (!context) {
      throw new Error(`Project context not found: ${projectId}`);
    }

    const component = {
      name: componentData.name,
      path: componentData.path,
      type: componentData.type || 'component',
      description: componentData.description || '',
      dependencies: componentData.dependencies || [],
      props: componentData.props || [],
      exports: componentData.exports || [componentData.name],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      content: componentData.content || ''
    };

    context.components[componentData.name] = component;

    // Update project dependencies
    if (componentData.dependencies) {
      componentData.dependencies.forEach(dep => {
        context.dependencies.add(dep);
      });
    }

    await this.saveContext(projectId, context);
    return component;
  }

  /**
   * Build context-aware prompt
   */
  buildContextPrompt(projectId, userRequest, context) {
    if (!context) {
      return userRequest;
    }

    const contextParts = [];
    
    // Add project overview
    contextParts.push(`Project: ${context.name}`);
    if (context.description) {
      contextParts.push(`Description: ${context.description}`);
    }

    // Add existing components
    const componentNames = Object.keys(context.components);
    if (componentNames.length > 0) {
      contextParts.push('\nExisting Components:');
      componentNames.forEach(name => {
        const comp = context.components[name];
        contextParts.push(`- ${name} (${comp.path}): ${comp.description}`);
      });
    }

    // Add styling context
    contextParts.push(`\nStyling Framework: ${context.styles.framework}`);
    contextParts.push(`Code Style: ${context.preferences.codeStyle}`);
    if (context.preferences.typescript) {
      contextParts.push('Using TypeScript');
    }

    // Add dependencies
    const deps = Array.from(context.dependencies);
    if (deps.length > 0) {
      contextParts.push(`\nProject Dependencies: ${deps.join(', ')}`);
    }

    // Add recent context from conversations
    const recentConversations = context.conversations.slice(-3);
    if (recentConversations.length > 0) {
      contextParts.push('\nRecent Context:');
      recentConversations.forEach(conv => {
        contextParts.push(`- ${conv.type}: ${conv.userRequest.substring(0, 100)}...`);
      });
    }

    // Build final prompt
    const contextPrompt = `
PROJECT CONTEXT:
${contextParts.join('\n')}

CURRENT REQUEST: ${userRequest}

GUIDELINES:
1. Ensure consistency with existing components and patterns
2. Use the established styling framework (${context.styles.framework})
3. Follow the project's code style and conventions
4. Import and reference existing components when appropriate
5. Maintain compatibility with existing dependencies
`;

    return contextPrompt;
  }

  /**
   * Create edit session
   */
  async createEditSession(projectId, fileData) {
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      projectId,
      filePath: fileData.filePath,
      originalContent: fileData.content,
      currentContent: fileData.content,
      history: [], // Ensure history is always initialized as array
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    
    // Update project stats
    const context = await this.getProject(projectId);
    if (context) {
      context.stats.editsSessions++;
      await this.saveContext(projectId, context);
    }

    console.log(`✏️  Created edit session: ${sessionId}`);
    return session;
  }

  /**
   * Update edit session with new content
   */
  async updateEditSession(sessionId, editData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Edit session not found: ${sessionId}`);
    }

    const historyEntry = {
      timestamp: new Date().toISOString(),
      instruction: editData.instruction,
      previousContent: session.currentContent,
      newContent: editData.newContent,
      diff: editData.diff,
      provider: editData.provider,
      model: editData.model,
      success: editData.success || false
    };

    session.history.push(historyEntry);
    
    if (editData.success) {
      session.currentContent = editData.newContent;
    }
    
    session.lastModified = new Date().toISOString();

    return session;
  }

  /**
   * Get edit session
   */
  getEditSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Close edit session
   */
  async closeEditSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'closed';
      session.closed = new Date().toISOString();
      
      // Optionally persist session history to project context
      const context = await this.getProject(session.projectId);
      if (context) {
        if (!context.editHistory) {
          context.editHistory = [];
        }
        
        context.editHistory.push({
          sessionId,
          filePath: session.filePath,
          editsCount: session.history.length,
          duration: new Date() - new Date(session.created),
          closed: session.closed
        });

        await this.saveContext(session.projectId, context);
      }
      
      // Remove from active sessions after delay
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, 60000); // Keep for 1 minute for any pending operations
    }

    return session;
  }

  /**
   * Save context to cache and memory
   */
  async saveContext(projectId, context) {
    try {
      const serialized = this.serializeContext(context);
      
      // Save to cache with 24 hour TTL
      const cacheKey = `context:${projectId}`;
      const cacheResult = await this.cache.set(cacheKey, serialized, 86400);
      console.log(`💾 Context saved to cache: ${projectId}, success: ${cacheResult}`);
      
      // Save to memory backup
      this.contexts.set(projectId, serialized);
      console.log(`💾 Context saved to memory: ${projectId}, total contexts: ${this.contexts.size}`);
      
      return true;
    } catch (error) {
      console.error('Error saving context:', error);
      return false;
    }
  }

  /**
   * Serialize context for storage
   */
  serializeContext(context) {
    return {
      ...context,
      dependencies: Array.from(context.dependencies) // Convert Set to Array
    };
  }

  /**
   * Deserialize context from storage
   */
  deserializeContext(serialized) {
    return {
      ...serialized,
      dependencies: new Set(serialized.dependencies) // Convert Array back to Set
    };
  }

  /**
   * Get context stats
   */
  getStats() {
    return {
      activeProjects: this.contexts.size,
      activeSessions: this.sessions.size,
      memoryUsage: {
        contexts: this.contexts.size,
        sessions: this.sessions.size
      }
    };
  }

  /**
   * Cleanup old contexts and sessions
   */
  cleanup() {
    const now = new Date();
    let cleaned = 0;

    // Clean old sessions (older than 1 hour)
    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - new Date(session.created);
      if (sessionAge > 3600000) { // 1 hour in ms
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old sessions`);
    }
  }
}

module.exports = ContextService;