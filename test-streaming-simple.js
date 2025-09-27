/**
 * Simple Test for Optimized Streaming Implementation
 */

const WebSocket = require('ws');

async function testStreaming() {
  console.log('🧪 Testing Optimized Streaming Implementation');
  
  const WS_URL = 'ws://localhost:3002/ws';
  const API_KEY = 'development-key';
  
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
    
    // Send authentication
    ws.send(JSON.stringify({
      type: 'authenticate',
      apiKey: API_KEY,
      userId: 'test-user'
    }));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message.type);
      
      if (message.type === 'connection_established') {
        console.log('🔗 Connection established with features:', message.features);
      }
      
      if (message.type === 'authenticated') {
        console.log('🔐 Authentication successful');
        console.log('⚡ Features:', message.features);
        
        // Test streaming
        console.log('🌊 Starting streaming test...');
        ws.send(JSON.stringify({
          type: 'start_stream',
          streamId: 'test-stream-001',
          requestType: 'chat_message',
          request: {
            message: 'Hello, create a simple calculator',
            mode: 'ACT'
          }
        }));
      }
      
      if (message.type === 'stream_started') {
        console.log('🎯 Stream started:', message.streamId);
      }
      
      if (message.type === 'stream_update') {
        if (message.data && message.data.content) {
          process.stdout.write(message.data.content);
        }
      }
      
      if (message.type === 'stream_complete') {
        console.log('\n✅ Stream completed!');
        ws.close();
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Parse error:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });
}

testStreaming();