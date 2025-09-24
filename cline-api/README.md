# Cline API Service 🤖

A REST API service based on Cline's core functionality for AI-powered code generation, editing, and diffing.

## Features

- **Code Generation**: Generate complete files from natural language requirements
- **Code Editing**: Edit existing code with AI-powered instructions
- **Diff Generation**: Create and analyze differences between code versions
- **Multi-LLM Support**: Works with OpenRouter (multiple models), Anthropic Claude, OpenAI GPT
- **RESTful API**: Clean JSON responses with structured logging
- **Docker Ready**: Containerized for easy deployment
- **Rate Limiting**: Built-in protection against abuse
- **Authentication**: API key-based security

## Quick Start

### Local Development

1. **Clone and setup:**
```bash
git clone <your-fork-url>
cd cline-api
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start the server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

4. **Test the API:**
```bash
curl http://localhost:3000/health
```

### Docker Deployment

1. **Build the image:**
```bash
docker build -t cline-api .
```

2. **Run the container:**
```bash
docker run -p 3000:3000 --env-file .env cline-api
```

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 123.456
}
```

### Generate Code
```http
POST /api/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "Create a React component for a user profile card with name, email, and avatar",
  "options": {
    "language": "javascript",
    "style": "modern",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

**Response:**
```json
{
  "success": true,
  "logs": [
    "[uuid] Starting code generation...",
    "[uuid] Using anthropic provider",
    "[uuid] LLM response received",
    "[uuid] Parsed 2 files from response"
  ],
  "files": [
    {
      "path": "components/UserProfile.jsx",
      "content": "import React from 'react';\n\nconst UserProfile = ({ name, email, avatar }) => {\n  return (\n    <div className=\"user-profile\">...",
      "diff": "@@ -0,0 +1,20 @@\n+import React from 'react';\n+..."
    }
  ],
  "result": "Successfully generated 2 file(s)",
  "metadata": {
    "model": "claude-3-5-sonnet-20241022",
    "provider": "anthropic",
    "tokensUsed": 1234,
    "processingTime": 2500
  }
}
```

### Edit Code
```http
POST /api/edit
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "filePath": "src/utils/helpers.js",
  "content": "export const formatDate = (date) => {\n  return date.toISOString();\n};",
  "instructions": "Add error handling and support for different date formats",
  "options": {
    "provider": "openai"
  }
}
```

**Response:**
```json
{
  "success": true,
  "logs": [
    "[uuid] Starting code editing...",
    "[uuid] Using openai provider",
    "[uuid] Code edited successfully"
  ],
  "files": [
    {
      "path": "src/utils/helpers.js",
      "content": "export const formatDate = (date) => {\n  try {\n    if (!date) return null;\n    if (typeof date === 'string') date = new Date(date);\n    return date.toISOString();\n  } catch (error) {\n    console.error('Invalid date:', error);\n    return null;\n  }\n};",
      "diff": "@@ -1,3 +1,9 @@\n export const formatDate = (date) => {\n-  return date.toISOString();\n+  try {\n+    if (!date) return null;\n+    if (typeof date === 'string') date = new Date(date);\n+    return date.toISOString();\n+  } catch (error) {\n+    console.error('Invalid date:', error);\n+    return null;\n+  }\n };",
      "changes": {
        "additions": 7,
        "deletions": 1,
        "modifications": 1,
        "total": 8
      }
    }
  ],
  "result": "Successfully edited src/utils/helpers.js",
  "metadata": {
    "model": "gpt-4",
    "provider": "openai",
    "tokensUsed": 856,
    "processingTime": 1800
  }
}
```

### Generate Diff
```http
POST /api/diff
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "originalContent": "console.log('hello');",
  "newContent": "console.log('hello world');",
  "filePath": "index.js"
}
```

**Response:**
```json
{
  "success": true,
  "logs": ["Generated diff for index.js"],
  "files": [
    {
      "path": "index.js",
      "diff": "@@ -1 +1 @@\n-console.log('hello');\n+console.log('hello world');",
      "changes": {
        "additions": 1,
        "deletions": 1,
        "modifications": 1,
        "total": 2
      }
    }
  ],
  "result": "Diff generated: 1 additions, 1 deletions",
  "metadata": {
    "processingTime": 15
  }
}
```

## Configuration

### Environment Variables

Create a `.env` file (use `.env.example` as template):

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# API Authentication
API_KEY=your-secure-api-key-here

# LLM Provider Configuration (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AI...

# Default Settings
DEFAULT_LLM_PROVIDER=anthropic
DEFAULT_MODEL=claude-3-5-sonnet-20241022

# Rate Limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window

# Logging
LOG_LEVEL=info
```

### LLM Provider Setup

#### Anthropic Claude
1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Set `ANTHROPIC_API_KEY` in your `.env`
3. Available models: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`

#### OpenAI GPT
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Set `OPENAI_API_KEY` in your `.env`
3. Available models: `gpt-4`, `gpt-3.5-turbo`

#### Google Gemini
1. Get API key from [Google AI Studio](https://makersuite.google.com/)
2. Set `GOOGLE_API_KEY` in your `.env`
3. Available models: `gemini-pro`, `gemini-pro-vision`

## Deployment on Render

1. **Fork this repository** to your GitHub account

2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository

3. **Configure the service:**
   ```yaml
   # render.yaml (optional)
   services:
     - type: web
       name: cline-api
       env: docker
       dockerfilePath: ./Dockerfile
       envVars:
         - key: PORT
           value: 3000
         - key: API_KEY
           generateValue: true
         - key: ANTHROPIC_API_KEY
           sync: false  # Set manually in Render dashboard
   ```

4. **Set environment variables** in Render dashboard:
   - `API_KEY`: Generate a secure random string
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
   - `GOOGLE_API_KEY`: Your Google API key (optional)
   - `DEFAULT_LLM_PROVIDER`: `anthropic`

5. **Deploy:** Render will automatically build and deploy your service

## Testing

### Run Tests
```bash
# Make sure server is running first
npm start

# In another terminal
npm test
```

### Manual Testing with curl

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Generate Code:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple Node.js HTTP server",
    "options": {
      "language": "javascript"
    }
  }'
```

**Edit Code:**
```bash
curl -X POST http://localhost:3000/api/edit \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "function hello() { console.log(\"hi\"); }",
    "instructions": "Add error handling and JSDoc comments",
    "filePath": "utils.js"
  }'
```

**Generate Diff:**
```bash
curl -X POST http://localhost:3000/api/diff \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "originalContent": "const x = 1;",
    "newContent": "const x = 2;",
    "filePath": "config.js"
  }'
```

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class ClineAPI {
  constructor(baseURL, apiKey) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateCode(prompt, options = {}) {
    const response = await this.client.post('/api/generate', {
      prompt,
      options
    });
    return response.data;
  }

  async editCode(filePath, content, instructions, options = {}) {
    const response = await this.client.post('/api/edit', {
      filePath,
      content,
      instructions,
      options
    });
    return response.data;
  }

  async getDiff(originalContent, newContent, filePath) {
    const response = await this.client.post('/api/diff', {
      originalContent,
      newContent,
      filePath
    });
    return response.data;
  }
}

// Usage
const cline = new ClineAPI('http://localhost:3000', 'your-api-key');
const result = await cline.generateCode('Create a React button component');
```

### Python
```python
import requests

class ClineAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def generate_code(self, prompt, options=None):
        response = requests.post(
            f'{self.base_url}/api/generate',
            json={'prompt': prompt, 'options': options or {}},
            headers=self.headers
        )
        return response.json()

# Usage
cline = ClineAPI('http://localhost:3000', 'your-api-key')
result = cline.generate_code('Create a Python class for user management')
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "fields": ["prompt is required and must be a string"],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Common Error Codes:**
- `400`: Validation Error - Invalid request parameters
- `401`: Authentication Error - Missing or invalid API key
- `429`: Rate Limit Exceeded - Too many requests
- `500`: Internal Server Error - Server-side issues
- `502`: LLM Error - Issues with AI provider

## Rate Limiting

Default rate limits:
- 100 requests per 15 minutes per IP
- Configurable via environment variables
- Returns `429` status code when exceeded
- Includes `X-RateLimit-*` headers in responses

## Security

- API key authentication required for all endpoints (except `/health`)
- CORS protection
- Helmet.js security headers
- Rate limiting
- Input validation and sanitization
- No sensitive data logged

## Development

### Project Structure
```
cline-api/
├── src/
│   ├── middleware/     # Auth, validation, rate limiting
│   ├── routes/         # API route handlers
│   ├── services/       # Core business logic
│   ├── utils/          # Helper functions
│   └── server.js       # Main server file
├── test/               # Test files
├── Dockerfile          # Container configuration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

### Adding New Features

1. **New endpoint:** Add route in `src/routes/`
2. **New service:** Add logic in `src/services/`
3. **New validation:** Update `src/middleware/validation.js`
4. **Tests:** Add tests in `test/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run tests: `npm test`
6. Submit a pull request

## License

Apache 2.0 © 2025 Cline Bot Inc.

## Support

- 📖 Documentation: This README
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions