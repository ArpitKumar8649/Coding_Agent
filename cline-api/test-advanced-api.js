/**
 * Advanced Cline API Test Script
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_KEY = '38a4fe1bddaa7d54a6e97b1da38343807a113da35601df4a3cfae3392f8aeed8';

// Create axios client with authentication
const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
    }
});

async function testAdvancedAPI() {
    console.log('🧪 Testing Advanced Cline API...\n');

    try {
        // 1. Health Check
        console.log('1. Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log(`✅ Health: ${healthResponse.data.status}`);
        console.log(`   Features: ${healthResponse.data.capabilities.length} capabilities loaded\n`);

        // 2. Create Session
        console.log('2. Creating Advanced Session...');
        const sessionResponse = await client.post('/api/sessions', {
            startMode: 'PLAN',
            qualityLevel: 'advanced',
            enableGit: true
        });
        
        const sessionId = sessionResponse.data.sessionId;
        console.log(`✅ Session created: ${sessionId}`);
        console.log(`   Mode: ${sessionResponse.data.mode}`);
        console.log(`   Workspace: ${sessionResponse.data.workspace}\n`);

        // 3. Get Session Status
        console.log('3. Getting Session Status...');
        const statusResponse = await client.get(`/api/sessions/${sessionId}`);
        console.log(`✅ Session Status: ${statusResponse.data.sessionId}`);
        console.log(`   Phase: ${statusResponse.data.phase || 'active'}\n`);

        // 4. Send Planning Message
        console.log('4. Sending Planning Message...');
        const planMessage = {
            message: "I want to create a modern React todo application with beautiful UI, drag-and-drop functionality, and local storage persistence. The app should have a clean, minimalist design with smooth animations.",
            options: {
                requirements: {
                    features: ['todo-management', 'drag-drop', 'persistence', 'responsive-design'],
                    technologies: ['React', 'Tailwind CSS', 'Local Storage'],
                    complexity: 'medium'
                }
            }
        };
        
        const planResponse = await client.post(`/api/sessions/${sessionId}/messages`, planMessage);
        console.log(`✅ Planning Response Generated`);
        console.log(`   Response Preview: ${planResponse.data.content.substring(0, 200)}...`);
        
        if (planResponse.data.context) {
            console.log(`   Project Type: ${planResponse.data.context.projectType}`);
            console.log(`   Framework: ${planResponse.data.context.framework}`);
            console.log(`   Technologies: ${planResponse.data.context.technologies.join(', ')}\n`);
        }

        // 5. Switch to ACT Mode
        console.log('5. Switching to ACT Mode...');
        const switchResponse = await client.post(`/api/sessions/${sessionId}/mode`, {
            mode: 'ACT'
        });
        console.log(`✅ Mode switched: ${switchResponse.data.currentMode}\n`);

        // 6. Send Implementation Message
        console.log('6. Sending Implementation Message...');
        const actMessage = {
            message: "Create the main App.js component with a beautiful, modern todo interface including add todo functionality and todo list display.",
            options: {}
        };
        
        const actResponse = await client.post(`/api/sessions/${sessionId}/messages`, actMessage);
        console.log(`✅ Implementation Response Generated`);
        console.log(`   Tool Used: ${actResponse.data.toolUsed || 'None'}`);
        console.log(`   Response Preview: ${actResponse.data.content.substring(0, 200)}...\n`);

        // 7. Get Capabilities
        console.log('7. Getting Advanced Capabilities...');
        const capabilitiesResponse = await client.get('/api/capabilities');
        console.log(`✅ Capabilities Retrieved`);
        console.log(`   System Prompts: ${capabilitiesResponse.data.advancedCapabilities.systemPrompts.features.length} features`);
        console.log(`   Plan Mode Features: ${capabilitiesResponse.data.advancedCapabilities.planActModes.planMode.length}`);
        console.log(`   Act Mode Features: ${capabilitiesResponse.data.advancedCapabilities.planActModes.actMode.length}\n`);

        // 8. Quality Test
        console.log('8. Testing Quality Generation...');
        const qualityResponse = await client.post('/api/test/quality', {
            description: 'React button component with hover effects',
            quality: 'advanced'
        });
        console.log(`✅ Quality Test Completed`);
        console.log(`   Quality Level: ${qualityResponse.data.qualityLevel}`);
        console.log(`   Session: ${qualityResponse.data.session}\n`);

        console.log('🎉 All tests passed! Advanced Cline API is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Make sure you have the correct API key set in the test script');
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the server is running: node src/start-advanced-server.js');
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    testAdvancedAPI();
}

module.exports = { testAdvancedAPI };