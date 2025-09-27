/**
 * Test Production API with Agent Endpoints
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');

async function testProductionAPI() {
  console.log('🧪 Testing Production API with Agent Endpoints');
  console.log('🌐 API URL: https://cline-api-zegw.onrender.com');
  
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing API health...');
    const healthResponse = await fetch('https://cline-api-zegw.onrender.com/health');
    const health = await healthResponse.json();
    console.log('✅ API Status:', health.status);
    console.log('📊 Version:', health.version);
    
    // Test 2: Agent Health
    console.log('\n2️⃣ Testing agent health...');
    try {
      const agentResponse = await fetch('https://cline-api-zegw.onrender.com/api/agent/health');
      if (agentResponse.ok) {
        const agent = await agentResponse.json();
        console.log('✅ Agent Status:', agent.status);
      } else {
        console.log('⚠️ Agent endpoint requires authentication');
      }
    } catch (error) {
      console.log('⚠️ Agent endpoint not accessible:', error.message);
    }
    
    // Test 3: WebSocket Connection
    console.log('\n3️⃣ Testing WebSocket connection...');
    const WS_URL = 'wss://cline-api-zegw.onrender.com/ws';
    
    const ws = new WebSocket(WS_URL);
    
    return new Promise((resolve, reject) => {
      let connected = false;
      let messageReceived = false;
      
      ws.on('open', () => {
        console.log('✅ WebSocket connected');
        connected = true;
        
        // Try to send a project creation request
        console.log('📤 Sending project creation request...');
        ws.send(JSON.stringify({
          type: 'create_project',
          description: 'Create a simple calculator using HTML and CSS',
          preferences: {
            framework: 'HTML/CSS/JS',
            styling: 'Modern CSS'
          }
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received:', message.type);
          messageReceived = true;
          
          if (message.type === 'project_created') {
            console.log('🎯 Project created successfully!');
            console.log('📋 Project ID:', message.projectId);
          }
          
          if (message.type === 'project_progress') {
            console.log('📈 Progress update received');
            if (message.content) {
              console.log('💬 Content length:', message.content.length);
              console.log('📝 Preview:', message.content.substring(0, 150) + '...');
            }
            if (message.toolsUsed && message.toolsUsed.length > 0) {
              console.log('🛠️ Tools used:', message.toolsUsed.join(', '));
            }
          }
          
          if (message.type === 'agent_thinking') {
            console.log('🤔 Agent is thinking...');
          }
          
          if (message.type === 'tool_execution') {
            console.log('⚙️ Tool execution:', message.toolName || message.tool);
          }
          
          if (message.type === 'project_completed') {
            console.log('✅ Project completed successfully!');
            console.log('🎉 Streaming test passed - responses are working!');
            setTimeout(() => resolve(true), 1000);
          }
          
          if (message.type === 'error') {
            console.error('❌ Error:', message.message || message.error);
          }
          
        } catch (error) {
          console.error('❌ Failed to parse message:', error);
          console.log('Raw message:', data.toString().substring(0, 200));
        }
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        reject(error);
      });
      
      ws.on('close', (code, reason) => {
        console.log(`🔌 Connection closed: ${code} - ${reason || 'No reason'}`);
        if (messageReceived) {
          resolve(true);
        } else {
          reject(new Error('No messages received'));
        }
      });
      
      // Timeout after 45 seconds
      setTimeout(() => {
        if (!connected) {
          reject(new Error('Connection timeout'));
        } else if (!messageReceived) {
          console.log('⏰ Timeout - no response received');
          ws.close();
          resolve(false);
        }
      }, 45000);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testProductionAPI()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Production API streaming test completed!');
      console.log('✅ WebSocket connection working');
      console.log('✅ Streaming responses received');
      console.log('✅ Ready for UI testing');
    } else {
      console.log('\n⚠️ Some issues detected with streaming');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });