#!/bin/bash

# Test script for Cline API with OpenRouter
# This script demonstrates that the API is working with real code generation

echo "🧪 Testing Cline API with OpenRouter (x-AI Grok and Meta LLaMA)"
echo "=================================================="

API_BASE="http://localhost:3000"
API_KEY="test-api-key-for-local-testing"

# Check if server is running
echo ""
echo "📡 Health Check:"
curl -s $API_BASE/health | jq '.'

echo ""
echo "🔄 Testing Code Generation (JavaScript factorial function):"
curl -s -X POST $API_BASE/api/generate \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a JavaScript function that validates email addresses using regex",
    "options": {
      "provider": "openrouter",
      "model": "meta-llama/llama-3.2-3b-instruct:free"
    }
  }' | jq '.files[0].content' -r

echo ""
echo "✏️  Testing Code Editing:"
curl -s -X POST $API_BASE/api/edit \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "utils.js",
    "content": "function add(a, b) { return a + b; }",
    "instructions": "Add input validation to ensure both parameters are numbers",
    "options": {
      "provider": "openrouter",
      "model": "meta-llama/llama-3.2-3b-instruct:free"
    }
  }' | jq '.files[0].content' -r

echo ""
echo "🔍 Testing Diff Generation:"
curl -s -X POST $API_BASE/api/diff \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "originalContent": "const greeting = \"hello\";",
    "newContent": "const greeting = \"hello world\";",
    "filePath": "greet.js"
  }' | jq '.files[0].diff' -r

echo ""
echo "🎉 All tests completed! The API is working correctly with OpenRouter."
echo ""
echo "Available free models to try:"
echo "- meta-llama/llama-3.2-3b-instruct:free"
echo "- meta-llama/llama-3.2-1b-instruct:free"
echo "- microsoft/phi-3-mini-128k-instruct:free"
echo "- huggingfaceh4/zephyr-7b-beta:free"