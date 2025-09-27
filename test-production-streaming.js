/**
 * Test Production API Streaming
 */

const WebSocket = require('ws');

async function testProductionStreaming() {
  console.log('🧪 Testing Production API Streaming');
  console.log('🌐 API URL: https://cline-api-zegw.onrender.com');
  
  const WS_URL = 'wss://cline-api-zegw.onrender.com/ws';
  const API_KEY = 'development-key';
  
  console.log('🔌 Connecting to WebSocket:', WS_URL);
  
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected to production API');
    
    // Send authentication
    ws.send(JSON.stringify({
      type: 'authenticate',
      apiKey: API_KEY,
      userId: 'test-user-prod'
    }));
    console.log('🔐 Sent authentication');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message type:', message.type);
      
      if (message.type === 'connection_established') {
        console.log('🔗 Connection established');
        console.log('⚡ Features available:', message.features);
      }
      
      if (message.type === 'authenticated') {
        console.log('🔐 Authentication successful:', message.success);
        if (message.features) {
          console.log('🚀 Advanced features:', message.features);
        }
        
        // Test streaming with a simple message
        console.log('🌊 Starting streaming test...');
        ws.send(JSON.stringify({
          type: 'create_project',
          description: 'Create a simple calculator using HTML and CSS'
        }));
      }
      
      if (message.type === 'project_created') {
        console.log('🎯 Project created:', message.projectId);
      }
      
      if (message.type === 'project_progress') {
        console.log('📈 Project progress received');
        if (message.content) {
          console.log('💬 Response content length:', message.content.length);
          console.log('📝 Response preview:', message.content.substring(0, 100) + '...');
        }
      }
      
      if (message.type === 'project_completed') {
        console.log('✅ Project completed successfully!');
        ws.close();
        process.exit(0);
      }
      
      if (message.type === 'error') {
        console.error('❌ Error received:', message.message || message.error);
      }
      
    } catch (error) {
      console.error('❌ Parse error:', error);
      console.log('Raw message:', data.toString());
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    process.exit(1);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed: ${code} - ${reason || 'No reason'}`);
    if (code !== 1000) {
      process.exit(1);
    }
  });
  
  // Timeout after 30 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout - closing connection');
    ws.close();
    process.exit(0);
  }, 30000);
}

testProductionStreaming();