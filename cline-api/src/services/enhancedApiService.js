const { generateCode, editCode, getDiff } = require('./codeService');
const CacheService = require('./cacheService');
const ContextService = require('./contextService');

class EnhancedApiService {
  constructor(streamingService = null) {
    this.cache = new CacheService();
    this.context = new ContextService(this.cache);
    this.streaming = streamingService;
    
    // Cleanup old data periodically
    this.startCleanupInterval();
    
    console.log('🚀 Enhanced API service initialized');
  }

  /**
   * Enhanced code generation with caching and context
   */
  async generateCodeEnhanced(request) {
    const { prompt, options = {}, projectId, userId, streamId } = request;
    
    try {
      // Check cache first (if cacheable)
      if (this.cache.isCacheable({ prompt, options, type: 'generate' })) {
        const cacheKey = this.cache.generateKey('generate', { prompt, options });
        const cached = await this.cache.get(cacheKey);
        
        if (cached) {
          console.log(`🎯 Cache hit for generation request`);
          
          // Update project context if projectId provided
          if (projectId) {
            await this.updateProjectWithResult(projectId, userId, {
              type: 'generate',
              userRequest: prompt,
              response: cached,
              fromCache: true
            });
          }
          
          return cached;
        }
      }

      // Get project context if available
      let contextualPrompt = prompt;
      let projectContext = null;
      
      if (projectId) {
        projectContext = await this.context.getProject(projectId);
        if (projectContext) {
          contextualPrompt = this.context.buildContextPrompt(projectId, prompt, projectContext);
          console.log(`📂 Using project context for generation`);
        }
      }

      // Send streaming updates if streaming enabled
      if (streamId && this.streaming) {
        this.streaming.sendStreamUpdate(streamId, {
          type: 'status',
          message: 'Processing request with context...',
          stage: 'context_processing'
        });
      }

      // Generate code with enhanced prompt
      const result = await generateCode(contextualPrompt, options);

      // Cache successful results
      if (result && this.cache.isCacheable({ prompt, options, type: 'generate' })) {
        const cacheKey = this.cache.generateKey('generate', { prompt, options });
        await this.cache.set(cacheKey, result, 3600); // 1 hour TTL
      }

      // Update project context
      if (projectId && result) {
        await this.updateProjectWithResult(projectId, userId, {
          type: 'generate',
          userRequest: prompt,
          response: result
        });

        // Add generated components to project context
        if (result.files) {
          for (const file of result.files) {
            await this.addFileToProject(projectId, file);
          }
        }
      }

      // Send streaming completion if enabled
      if (streamId && this.streaming) {
        this.streaming.completeStream(streamId, result);
      }

      return result;

    } catch (error) {
      console.error('Enhanced generation error:', error);
      
      // Send streaming error if enabled
      if (streamId && this.streaming) {
        this.streaming.errorStream(streamId, error);
      }
      
      throw error;
    }
  }

  /**
   * Enhanced code editing with session management
   */
  async editCodeEnhanced(request) {
    const { 
      filePath, 
      content, 
      instructions, 
      options = {}, 
      projectId, 
      sessionId, 
      previewOnly = false,
      streamId 
    } = request;

    try {
      // Get or create edit session
      let session = null;
      if (sessionId) {
        session = this.context.getEditSession(sessionId);
        if (!session) {
          throw new Error(`Edit session not found: ${sessionId}`);
        }
      } else if (projectId) {
        session = await this.context.createEditSession(projectId, {
          filePath,
          content
        });
      }

      // Use session content if available
      const currentContent = session ? session.currentContent : content;

      // Build contextual edit prompt
      let contextualInstructions = instructions;
      if (projectId) {
        const projectContext = await this.context.getProject(projectId);
        if (projectContext) {
          contextualInstructions = `
Project Context: ${projectContext.name}
Existing Components: ${Object.keys(projectContext.components).join(', ')}
Styling Framework: ${projectContext.styles.framework}

Edit Instructions: ${instructions}

Please ensure the edited code maintains consistency with the existing project structure and styling.
`;
        }
      }

      // Send streaming updates
      if (streamId && this.streaming) {
        this.streaming.sendStreamUpdate(streamId, {
          type: 'status',
          message: 'Editing code with context...',
          stage: 'edit_processing',
          session: session?.id
        });
      }

      // Perform edit
      const result = await editCode(filePath, currentContent, contextualInstructions, options);

      // If preview only, return without updating session
      if (previewOnly) {
        return {
          ...result,
          isPreview: true,
          sessionId: session?.id
        };
      }

      // Update edit session if exists
      if (session && result.files?.[0]) {
        await this.context.updateEditSession(session.id, {
          instruction: instructions,
          newContent: result.files[0].content,
          diff: result.files[0].diff,
          provider: result.provider,
          model: result.model,
          success: true
        });

        result.sessionId = session.id;
        result.editHistory = session.history.length;
      }

      // Update project context
      if (projectId) {
        await this.updateProjectWithResult(projectId, null, {
          type: 'edit',
          userRequest: instructions,
          response: result,
          filePath
        });
      }

      // Send streaming completion
      if (streamId && this.streaming) {
        this.streaming.completeStream(streamId, result);
      }

      return result;

    } catch (error) {
      console.error('Enhanced edit error:', error);
      
      if (streamId && this.streaming) {
        this.streaming.errorStream(streamId, error);
      }
      
      throw error;
    }
  }

  /**
   * Enhanced diff generation
   */
  async getDiffEnhanced(request) {
    const { originalContent, newContent, filePath, projectId } = request;

    try {
      const result = await getDiff(originalContent, newContent, filePath);

      // Log diff in project context if available
      if (projectId) {
        const projectContext = await this.context.getProject(projectId);
        if (projectContext) {
          await this.context.addConversation(projectId, {
            type: 'diff',
            userRequest: `Generate diff for ${filePath}`,
            response: { success: true, ...result },
            metadata: { filePath }
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Enhanced diff error:', error);
      throw error;
    }
  }

  /**
   * Project management methods
   */
  async createProject(userId, projectData) {
    return await this.context.createProject(userId, projectData);
  }

  async getProject(projectId) {
    return await this.context.getProject(projectId);
  }

  async updateProject(projectId, updates) {
    return await this.context.updateProject(projectId, updates);
  }

  async createEditSession(projectId, fileData) {
    return await this.context.createEditSession(projectId, fileData);
  }

  async getEditSession(sessionId) {
    return this.context.getEditSession(sessionId);
  }

  async closeEditSession(sessionId) {
    return await this.context.closeEditSession(sessionId);
  }

  /**
   * Helper methods
   */
  async updateProjectWithResult(projectId, userId, data) {
    try {
      await this.context.addConversation(projectId, {
        type: data.type,
        userRequest: data.userRequest,
        response: data.response,
        metadata: data.metadata || {}
      });

      // Update project stats
      const updates = {
        stats: {
          lastActivity: new Date().toISOString()
        }
      };

      if (data.response.success) {
        updates.stats.successfulGenerations = 1;
      }

      await this.context.updateProject(projectId, updates);

    } catch (error) {
      console.error('Error updating project context:', error);
    }
  }

  async addFileToProject(projectId, fileData) {
    try {
      // Extract component information from file
      const componentName = this.extractComponentName(fileData.path);
      const dependencies = this.extractDependencies(fileData.content);
      
      if (componentName) {
        await this.context.addComponent(projectId, {
          name: componentName,
          path: fileData.path,
          content: fileData.content,
          dependencies: dependencies,
          description: `Generated component: ${componentName}`
        });
      }

    } catch (error) {
      console.error('Error adding file to project:', error);
    }
  }

  extractComponentName(filePath) {
    if (!filePath) return null;
    
    const fileName = filePath.split('/').pop().split('.')[0];
    
    // Convert to PascalCase for component names
    return fileName.charAt(0).toUpperCase() + fileName.slice(1);
  }

  extractDependencies(content) {
    if (!content) return [];
    
    const dependencies = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('/')) {
        dependencies.push(dep);
      }
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Service health and stats
   */
  getHealthStatus() {
    return {
      service: 'healthy',
      timestamp: new Date().toISOString(),
      cache: this.cache.getStats(),
      context: this.context.getStats(),
      streaming: this.streaming ? this.streaming.getStats() : null
    };
  }

  async clearCache() {
    return await this.cache.clear();
  }

  /**
   * Batch processing
   */
  async processBatch(requests) {
    const results = [];
    const concurrency = 3; // Process 3 requests at a time
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          let result;
          
          switch (request.type) {
            case 'generate':
              result = await this.generateCodeEnhanced(request);
              break;
            case 'edit':
              result = await this.editCodeEnhanced(request);
              break;
            case 'diff':
              result = await this.getDiffEnhanced(request);
              break;
            default:
              throw new Error(`Unknown request type: ${request.type}`);
          }
          
          return { success: true, index: i + index, result };
          
        } catch (error) {
          return { success: false, index: i + index, error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || { success: false, error: 'Promise rejected' }));
    }
    
    return results;
  }

  /**
   * Cleanup methods
   */
  startCleanupInterval() {
    // Run cleanup every 30 minutes
    setInterval(() => {
      this.context.cleanup();
      if (this.streaming) {
        this.streaming.cleanup();
      }
    }, 30 * 60 * 1000);
  }
}

module.exports = EnhancedApiService;