/**
 * Advanced Streaming Engine - Real-time updates with immediate error correction
 */

class StreamingEngine {
    constructor() {
        this.activeStreams = new Map();
        this.bufferManager = new BufferManager();
        this.diffEngine = new DiffEngine();
        this.errorDetector = new RealTimeErrorDetector();
    }

    createStream(sessionId, fileSpec, context) {
        const stream = new AdvancedCodeStream(sessionId, fileSpec, context, this);
        this.activeStreams.set(sessionId + ':' + fileSpec.path, stream);
        return stream;
    }

    getStream(sessionId, filePath) {
        return this.activeStreams.get(sessionId + ':' + filePath);
    }

    closeStream(sessionId, filePath) {
        const streamKey = sessionId + ':' + filePath;
        const stream = this.activeStreams.get(streamKey);
        if (stream) {
            stream.close();
            this.activeStreams.delete(streamKey);
        }
    }
}

class AdvancedCodeStream {
    constructor(sessionId, fileSpec, context, engine) {
        this.sessionId = sessionId;
        this.fileSpec = fileSpec;
        this.context = context;
        this.engine = engine;
        
        this.buffer = '';
        this.lastValidContent = '';
        this.errorHistory = [];
        this.correctionAttempts = 0;
        this.maxCorrectionAttempts = 3;
        
        this.state = {
            phase: 'initializing',
            quality: 0,
            errors: [],
            isStreaming: false,
            canAutoCorrect: true
        };
        
        this.listeners = new Map();
    }

    async start(socket) {
        this.socket = socket;
        this.state.phase = 'generating';
        this.state.isStreaming = true;
        
        try {
            // Initialize content generation with real-time streaming
            await this.initializeGeneration();
        } catch (error) {
            this.handleError(error);
        }
    }

    async initializeGeneration() {
        // Create enhanced prompt with streaming instructions
        const prompt = this.buildStreamingPrompt();
        
        // Start LLM streaming
        const llmStream = await this.createLLMStream(prompt);
        
        // Process chunks with real-time validation
        for await (const chunk of llmStream) {
            if (!this.state.isStreaming) break;
            
            await this.processChunk(chunk);
        }
        
        // Finalize stream
        await this.finalizeContent();
    }

    async processChunk(chunk) {
        try {
            // Add chunk to buffer
            this.buffer += chunk.content;
            
            // Real-time error detection
            const errors = await this.detectRealTimeErrors(this.buffer);
            
            if (errors.length > 0 && this.shouldAutoCorrect(errors)) {
                // Immediate error correction
                const correctedChunk = await this.correctChunkInRealTime(chunk, errors);
                this.buffer = this.buffer.slice(0, -chunk.content.length) + correctedChunk;
                
                // Emit correction notification
                this.emit('auto-correction', {
                    originalChunk: chunk.content,
                    correctedChunk: correctedChunk,
                    errors: errors.map(e => e.message)
                });
            }
            
            // Stream to client with validation status
            this.emit('content-chunk', {
                content: chunk.content,
                buffer: this.buffer,
                errors: errors,
                quality: await this.assessChunkQuality(this.buffer),
                timestamp: Date.now()
            });
            
            // Validate at logical breakpoints
            if (this.isValidationPoint(chunk.content)) {
                await this.performIntermediateValidation();
            }
            
        } catch (error) {
            await this.handleChunkError(error, chunk);
        }
    }

    async detectRealTimeErrors(content) {
        const errors = [];
        
        // Syntax errors
        const syntaxErrors = await this.engine.errorDetector.detectSyntax(content, this.fileSpec);
        errors.push(...syntaxErrors);
        
        // Import/export errors
        const importErrors = await this.engine.errorDetector.detectImportIssues(content, this.context);
        errors.push(...importErrors);
        
        // Pattern violations
        const patternErrors = await this.engine.errorDetector.detectPatternViolations(content, this.context);
        errors.push(...patternErrors);
        
        // Type errors (if TypeScript)
        if (this.isTypeScriptFile()) {
            const typeErrors = await this.engine.errorDetector.detectTypeErrors(content);
            errors.push(...typeErrors);
        }
        
        return errors.filter(e => e.severity !== 'info');
    }

    async correctChunkInRealTime(chunk, errors) {
        this.correctionAttempts++;
        
        if (this.correctionAttempts > this.maxCorrectionAttempts) {
            this.state.canAutoCorrect = false;
            return chunk.content;
        }
        
        // Apply real-time corrections
        const corrector = new RealTimeCorrector();
        const corrected = await corrector.correct(chunk.content, errors, {
            context: this.context,
            fileSpec: this.fileSpec,
            previousContent: this.buffer.slice(0, -chunk.content.length)
        });
        
        return corrected;
    }

    async performIntermediateValidation() {
        const validationResult = await this.validateCurrentContent();
        
        this.emit('intermediate-validation', {
            content: this.buffer,
            validation: validationResult,
            quality: await this.assessCurrentQuality(),
            canContinue: validationResult.canContinue
        });
        
        if (!validationResult.canContinue) {
            // Request user intervention
            await this.requestUserIntervention(validationResult);
        }
    }

    async requestUserIntervention(validationResult) {
        this.state.phase = 'awaiting-intervention';
        
        this.emit('intervention-required', {
            type: 'validation-failed',
            errors: validationResult.errors,
            suggestions: validationResult.suggestions,
            options: [
                'retry-with-fixes',
                'continue-anyway', 
                'manual-correction',
                'restart-generation'
            ]
        });
        
        // Wait for user decision
        const decision = await this.waitForUserDecision();
        await this.handleUserDecision(decision);
    }

    async waitForUserDecision() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ action: 'continue-anyway', timeout: true });
            }, 60000); // 1 minute timeout
            
            this.once('user-decision', (decision) => {
                clearTimeout(timeout);
                resolve(decision);
            });
        });
    }

    async handleUserDecision(decision) {
        switch (decision.action) {
            case 'retry-with-fixes':
                await this.retryWithFixes(decision.feedback);
                break;
            case 'continue-anyway':
                this.state.phase = 'generating';
                break;
            case 'manual-correction':
                await this.enterManualCorrectionMode();
                break;
            case 'restart-generation':
                await this.restartGeneration();
                break;
        }
    }

    async finalizeContent() {
        this.state.phase = 'finalizing';
        
        // Final validation
        const finalValidation = await this.performFinalValidation();
        
        // Quality assessment
        const quality = await this.assessFinalQuality();
        
        // Emit completion
        this.emit('generation-complete', {
            content: this.buffer,
            validation: finalValidation,
            quality: quality,
            errors: this.errorHistory,
            corrections: this.correctionAttempts
        });
        
        this.state.isStreaming = false;
        this.state.phase = 'complete';
    }

    // Event system for real-time communication
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        // Emit to WebSocket
        if (this.socket) {
            this.socket.emit(`stream-${event}`, {
                sessionId: this.sessionId,
                file: this.fileSpec.path,
                ...data
            });
        }
        
        // Emit to internal listeners
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }

    // Helper methods
    buildStreamingPrompt() {
        return `Generate ${this.fileSpec.path} with real-time streaming validation.

STREAMING REQUIREMENTS:
- Generate content incrementally
- Each chunk should be syntactically valid at logical breakpoints
- Use consistent indentation and formatting
- Avoid syntax errors that break parsing

QUALITY LEVEL: ${this.context.qualityLevel}
FILE TYPE: ${this.fileSpec.type}
FRAMEWORK: ${this.context.framework}

Generate content now:`;
    }

    async createLLMStream(prompt) {
        const llmService = require('./LLMService');
        
        return llmService.createStream({
            prompt,
            model: 'x-ai/grok-4-fast:free',
            temperature: 0.1,
            maxTokens: 3000,
            stream: true
        });
    }

    isValidationPoint(content) {
        // Check for logical validation points
        return content.includes('}\n') || 
               content.includes(';\n') || 
               content.includes('*/') ||
               content.includes('</') ||
               (content.includes('\n') && content.trim().endsWith('}'));
    }

    shouldAutoCorrect(errors) {
        return this.state.canAutoCorrect && 
               errors.length <= 3 && 
               errors.every(e => e.severity !== 'critical');
    }

    async assessChunkQuality(content) {
        // Quick quality assessment for streaming
        let score = 5; // Base score
        
        if (content.includes('useState') || content.includes('useEffect')) score += 1;
        if (content.includes('className')) score += 1;
        if (content.includes('aria-')) score += 1;
        if (content.match(/\/\*\*.*\*\//s)) score += 1; // JSDoc comments
        if (content.includes('try {') || content.includes('catch')) score += 1;
        
        return Math.min(score, 10);
    }

    async assessCurrentQuality() {
        // More comprehensive quality assessment
        const assessor = new QualityAssessor();
        return await assessor.assess(this.buffer, {
            fileType: this.fileSpec.type,
            context: this.context,
            isPartial: true
        });
    }

    async assessFinalQuality() {
        const assessor = new QualityAssessor();
        return await assessor.assess(this.buffer, {
            fileType: this.fileSpec.type,
            context: this.context,
            isPartial: false
        });
    }

    async validateCurrentContent() {
        const validator = new ContentValidator();
        return await validator.validate(this.buffer, {
            fileType: this.fileSpec.type,
            context: this.context,
            isPartial: true
        });
    }

    async performFinalValidation() {
        const validator = new ContentValidator();
        return await validator.validate(this.buffer, {
            fileType: this.fileSpec.type,
            context: this.context,
            isPartial: false
        });
    }

    isTypeScriptFile() {
        return this.fileSpec.path.endsWith('.ts') || this.fileSpec.path.endsWith('.tsx');
    }

    close() {
        this.state.isStreaming = false;
        this.listeners.clear();
    }

    handleError(error) {
        this.errorHistory.push({
            error: error.message,
            timestamp: Date.now(),
            buffer: this.buffer.substring(-100) // Last 100 chars for context
        });
        
        this.emit('stream-error', {
            error: error.message,
            canRecover: true,
            suggestions: ['retry', 'fallback', 'manual-intervention']
        });
    }
}

// Supporting classes
class BufferManager {
    constructor() {
        this.buffers = new Map();
    }
    
    // Buffer management implementation
}

class DiffEngine {
    constructor() {
        // Real-time diff calculation
    }
    
    calculateDiff(before, after) {
        // Implementation for diff calculation
        return {
            additions: [],
            deletions: [],
            modifications: []
        };
    }
}

class RealTimeErrorDetector {
    async detectSyntax(content, fileSpec) {
        // Syntax error detection implementation
        return [];
    }
    
    async detectImportIssues(content, context) {
        // Import/export validation
        return [];
    }
    
    async detectPatternViolations(content, context) {
        // Code pattern validation
        return [];
    }
    
    async detectTypeErrors(content) {
        // TypeScript error detection
        return [];
    }
}

class RealTimeCorrector {
    async correct(content, errors, options) {
        // Real-time error correction
        return content;
    }
}

module.exports = StreamingEngine;