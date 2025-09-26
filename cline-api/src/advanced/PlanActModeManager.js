/**
 * PlanActModeManager - Implements Plan vs Act mode system from real Cline
 * Extracted from Cline's mode switching and planning capabilities
 * Provides sophisticated planning phase before implementation
 */

const SystemPromptEngine = require('./SystemPromptEngine');

class PlanActModeManager {
    constructor(aiHandler) {
        this.aiHandler = aiHandler;
        this.systemPromptEngine = new SystemPromptEngine();
        this.currentMode = 'PLAN'; // Start in PLAN mode by default
        this.planningHistory = [];
        this.currentPlan = null;
        this.planApproved = false;
    }

    // Get current mode
    getCurrentMode() {
        return this.currentMode;
    }

    // Switch to PLAN mode
    switchToPlanMode() {
        this.currentMode = 'PLAN';
        this.planApproved = false;
        console.log('🔄 Switched to PLAN MODE - Ready for planning and discussion');
        return {
            mode: 'PLAN',
            message: 'Switched to PLAN MODE. I\'ll help you plan the task before implementation.',
            capabilities: [
                'Gather requirements and clarify ambiguities',
                'Analyze project structure and dependencies',
                'Create detailed implementation plans',
                'Discuss architecture and approach',
                'Generate visual diagrams (Mermaid)',
                'Refine plans based on feedback'
            ]
        };
    }

    // Switch to ACT mode
    switchToActMode() {
        if (this.currentMode === 'PLAN' && !this.planApproved) {
            return {
                error: 'Cannot switch to ACT MODE without an approved plan. Please finalize the plan first.',
                currentMode: 'PLAN'
            };
        }
        
        this.currentMode = 'ACT';
        console.log('🚀 Switched to ACT MODE - Ready for implementation');
        return {
            mode: 'ACT',
            message: 'Switched to ACT MODE. I\'ll now implement the approved plan.',
            plan: this.currentPlan,
            capabilities: [
                'Execute commands and create files',
                'Implement the planned solution step by step',
                'Use all available tools for development',
                'Provide real-time progress updates',
                'Handle errors and iterate on solutions'
            ]
        };
    }

    // Generate mode-appropriate system prompt
    generateModePrompt(projectContext = {}) {
        const basePrompt = this.systemPromptEngine.generateContextAwarePrompt(projectContext);
        
        if (this.currentMode === 'PLAN') {
            return this.enhancePromptForPlanMode(basePrompt);
        } else {
            return this.enhancePromptForActMode(basePrompt);
        }
    }

    // Enhance prompt for PLAN mode
    enhancePromptForPlanMode(basePrompt) {
        const planModeEnhancement = `
====

CURRENT MODE: PLAN MODE

In PLAN MODE, your goal is to collaborate with the user to create a comprehensive plan before implementation.

PLAN MODE CAPABILITIES:
- Use plan_mode_respond tool to communicate with the user
- Gather requirements and ask clarifying questions
- Analyze existing project structure and codebase
- Create detailed implementation strategies
- Generate visual diagrams using Mermaid syntax
- Discuss architecture, patterns, and best practices
- Refine plans based on user feedback
- Break down complex tasks into manageable steps

PLAN MODE WORKFLOW:
1. **Requirement Gathering**: Ask clarifying questions to understand the full scope
2. **Analysis**: Examine existing code, structure, and dependencies
3. **Architecture Planning**: Design the solution approach and patterns
4. **Implementation Strategy**: Create detailed step-by-step plan
5. **User Review**: Present plan and gather feedback
6. **Plan Refinement**: Iterate based on feedback
7. **Plan Approval**: Get final approval before switching to ACT MODE

MERMAID DIAGRAMS:
Use Mermaid code blocks to visualize:
- Project structure and components
- Data flow and relationships
- Implementation timeline
- Architecture diagrams
- User flows and interactions

Example:
\`\`\`mermaid
graph TD
    A[Plan Phase] --> B[Analyze Requirements]
    B --> C[Design Architecture]
    C --> D[Create Implementation Plan]
    D --> E[User Review]
    E --> F{Approved?}
    F -->|Yes| G[Switch to ACT MODE]
    F -->|No| H[Refine Plan]
    H --> E
\`\`\`

IMPORTANT PLAN MODE RULES:
- ONLY use the plan_mode_respond tool for communication
- Do NOT use implementation tools (write_to_file, execute_command, etc.)
- Focus on planning, not implementation
- Ask thoughtful questions to gather complete requirements
- Present clear, detailed plans with visual aids
- Wait for explicit approval before suggesting mode switch

`;
        return basePrompt + planModeEnhancement;
    }

    // Enhance prompt for ACT mode
    enhancePromptForActMode(basePrompt) {
        const actModeEnhancement = `
====

CURRENT MODE: ACT MODE

In ACT MODE, you implement the approved plan using all available tools.

ACT MODE CAPABILITIES:
- Execute all implementation tools (write_to_file, execute_command, etc.)
- Create files and directories according to the plan
- Run commands and manage development processes
- Handle errors and adapt implementation as needed
- Provide progress updates during implementation
- Test and validate implemented features

ACT MODE WORKFLOW:
1. **Follow the Plan**: Implement according to the approved plan
2. **Step-by-Step Execution**: Complete each planned step methodically
3. **Error Handling**: Address issues and adapt as necessary
4. **Progress Updates**: Keep user informed of progress
5. **Testing & Validation**: Verify implementation works correctly
6. **Completion**: Use attempt_completion when task is finished

CURRENT APPROVED PLAN:
${this.currentPlan ? JSON.stringify(this.currentPlan, null, 2) : 'No plan currently approved'}

ACT MODE RULES:
- Do NOT use plan_mode_respond tool (not available in ACT MODE)
- Use implementation tools to execute the plan
- Follow the step-by-step approach outlined in the plan
- Wait for user confirmation after each tool use
- Adapt to unexpected issues while staying true to the plan's goals
- Provide clear progress updates and explanations

`;
        return basePrompt + actModeEnhancement;
    }

    // Process planning request
    async processPlanningRequest(userMessage, projectContext = {}) {
        if (this.currentMode !== 'PLAN') {
            throw new Error('Planning requests can only be processed in PLAN mode');
        }

        const planPrompt = this.generateModePrompt(projectContext);
        
        // Add specific planning instructions
        const planningRequest = `${planPrompt}

USER REQUEST: ${userMessage}

Please analyze this request and respond using the plan_mode_respond tool. Consider:
1. What additional information might be needed?
2. What are the technical requirements and constraints?
3. What would be the best architecture and approach?
4. What are the implementation steps?
5. Are there any potential challenges or considerations?

Provide a thoughtful response that helps plan the implementation approach.`;

        try {
            const response = await this.aiHandler.generateResponse(planningRequest);
            
            // Store planning interaction
            this.planningHistory.push({
                userMessage,
                response: response.content,
                timestamp: new Date().toISOString()
            });

            return {
                mode: 'PLAN',
                response: response.content,
                planningHistory: this.planningHistory.length
            };
        } catch (error) {
            console.error('Error processing planning request:', error);
            throw error;
        }
    }

    // Create detailed implementation plan
    async createImplementationPlan(requirements, projectContext = {}) {
        const planPrompt = `You are in PLAN MODE. Create a comprehensive implementation plan based on these requirements:

REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

Create a detailed plan that includes:

1. **Project Analysis**
   - Current state assessment
   - Required technologies and dependencies
   - Architecture decisions

2. **Implementation Steps**
   - Detailed step-by-step approach
   - File structure and organization
   - Key components and their relationships

3. **Timeline and Dependencies**
   - Order of implementation
   - Dependencies between components
   - Estimated effort for each step

4. **Technical Considerations**
   - Performance considerations
   - Security aspects
   - Testing strategy

5. **Risk Assessment**
   - Potential challenges
   - Mitigation strategies
   - Alternative approaches

Please respond using the plan_mode_respond tool with a comprehensive plan including Mermaid diagrams where helpful.`;

        const response = await this.aiHandler.generateResponse(planPrompt);
        
        const plan = {
            id: Date.now().toString(),
            requirements,
            projectContext,
            planContent: response.content,
            created: new Date().toISOString(),
            approved: false,
            steps: this.extractStepsFromPlan(response.content)
        };

        this.currentPlan = plan;
        return plan;
    }

    // Extract implementation steps from plan content
    extractStepsFromPlan(planContent) {
        const steps = [];
        const lines = planContent.split('\n');
        
        let currentStep = null;
        let stepCounter = 1;

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Look for numbered steps or action items
            if (trimmed.match(/^\d+\./) || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                if (currentStep) {
                    steps.push(currentStep);
                }
                
                currentStep = {
                    id: stepCounter++,
                    title: trimmed.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''),
                    description: '',
                    estimated_time: 1000,
                    dependencies: [],
                    status: 'pending'
                };
            } else if (currentStep && trimmed) {
                currentStep.description += trimmed + ' ';
            }
        }
        
        if (currentStep) {
            steps.push(currentStep);
        }
        
        return steps;
    }

    // Approve current plan
    approvePlan() {
        if (!this.currentPlan) {
            throw new Error('No plan to approve');
        }
        
        this.currentPlan.approved = true;
        this.planApproved = true;
        
        console.log('✅ Plan approved - Ready to switch to ACT MODE');
        return {
            success: true,
            message: 'Plan approved successfully. You can now switch to ACT MODE to begin implementation.',
            plan: this.currentPlan
        };
    }

    // Reject current plan with feedback
    rejectPlan(feedback) {
        if (!this.currentPlan) {
            throw new Error('No plan to reject');
        }
        
        this.planningHistory.push({
            action: 'plan_rejected',
            feedback,
            timestamp: new Date().toISOString()
        });
        
        console.log('❌ Plan rejected - Returning to planning phase');
        return {
            success: true,
            message: 'Plan rejected. Please provide an updated plan based on the feedback.',
            feedback,
            requiresRevision: true
        };
    }

    // Get planning summary
    getPlanningState() {
        return {
            currentMode: this.currentMode,
            hasActivePlan: !!this.currentPlan,
            planApproved: this.planApproved,
            planningInteractions: this.planningHistory.length,
            currentPlan: this.currentPlan ? {
                id: this.currentPlan.id,
                created: this.currentPlan.created,
                approved: this.currentPlan.approved,
                stepsCount: this.currentPlan.steps ? this.currentPlan.steps.length : 0
            } : null
        };
    }

    // Reset planning state
    resetPlanning() {
        this.currentMode = 'PLAN';
        this.currentPlan = null;
        this.planApproved = false;
        this.planningHistory = [];
        
        return {
            success: true,
            message: 'Planning state reset. Ready for new planning session.',
            mode: 'PLAN'
        };
    }
}

module.exports = PlanActModeManager;