# 🚀 Cline API Setup Guide

This guide will help you set up your own Cline API service from the official Cline repository.

## Step 1: Fork the Repository

Since you're working with the official Cline repo, you'll need to create your own fork for the API service:

### Option A: Create a New Repository (Recommended)

1. **Create a new GitHub repository:**
   ```bash
   # Go to GitHub.com and create a new repository called "cline-api"
   # Don't initialize with README, .gitignore, or license
   ```

2. **Copy the API service files:**
   ```bash
   # From your current location (/app/cline-api/)
   cd /app/cline-api
   
   # Initialize new git repo
   git init
   git add .
   git commit -m "Initial Cline API service"
   
   # Add your new repository as remote
   git remote add origin https://github.com/YOUR_USERNAME/cline-api.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Fork and Add to Existing Cline Fork

1. **Fork the official Cline repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cline.git
   cd cline
   ```
3. **Add the API service:**
   ```bash
   # Copy the cline-api directory into your cloned fork
   cp -r /app/cline-api ./
   git add cline-api/
   git commit -m "Add Cline API service"
   git push origin main
   ```

## Step 2: Local Development Setup

1. **Navigate to your API directory:**
   ```bash
   cd cline-api  # or cd cline/cline-api if using Option B
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   nano .env  # or use your preferred editor
   ```

4. **Configure your .env file:**
   ```env
   # Required
   PORT=3000
   API_KEY=your-secure-api-key-here
   
   # At least one LLM provider (get from their respective consoles)
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   
   # Optional
   DEFAULT_LLM_PROVIDER=anthropic
   DEFAULT_MODEL=claude-3-5-sonnet-20241022
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Test the API:**
   ```bash
   curl http://localhost:3000/health
   ```

## Step 3: Testing

Run the test suite to ensure everything works:

```bash
# Start server in background
npm start &

# Run tests
npm test

# Stop background server
pkill -f "node src/server.js"
```

## Step 4: Docker Setup (Optional)

1. **Build Docker image:**
   ```bash
   docker build -t cline-api .
   ```

2. **Run with Docker:**
   ```bash
   docker run -p 3000:3000 --env-file .env cline-api
   ```

3. **Or use Docker Compose:**
   ```bash
   docker-compose up
   ```

## Step 5: Deploy to Render

1. **Push to GitHub** (if not already done)

2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch

3. **Configure deployment:**
   - **Name:** `cline-api`
   - **Environment:** Docker
   - **Dockerfile Path:** `./Dockerfile` (or `./cline-api/Dockerfile` if using Option B)
   - **Build Command:** (leave empty)
   - **Start Command:** (leave empty)

4. **Set environment variables in Render:**
   ```
   API_KEY = [Click "Generate" for random secure key]
   ANTHROPIC_API_KEY = sk-ant-your-key-here
   OPENAI_API_KEY = sk-your-key-here
   DEFAULT_LLM_PROVIDER = anthropic
   NODE_ENV = production
   ```

5. **Deploy:** Click "Create Web Service"

## Step 6: Test Deployment

After deployment, test your live API:

```bash
# Replace YOUR_RENDER_URL with your actual Render URL
curl https://your-app-name.onrender.com/health

# Test code generation
curl -X POST https://your-app-name.onrender.com/api/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple hello world function in JavaScript"
  }'
```

## Step 7: Integration

Now you can integrate the API into your website:

```javascript
// Example integration
const clineAPI = {
  baseUrl: 'https://your-app-name.onrender.com',
  apiKey: 'your-api-key',

  async generateCode(prompt) {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    return response.json();
  }
};

// Usage
const result = await clineAPI.generateCode('Create a React component');
console.log(result.files[0].content);
```

## API Endpoints Summary

- **Health:** `GET /health`
- **Generate Code:** `POST /api/generate`
- **Edit Code:** `POST /api/edit`  
- **Create Diff:** `POST /api/diff`

## Getting API Keys

### Anthropic Claude (Recommended)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and add payment method
3. Go to "API Keys" and create new key
4. Copy the key starting with `sk-ant-`

### OpenAI GPT
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add payment method  
3. Go to "API keys" and create new key
4. Copy the key starting with `sk-`

## Troubleshooting

### Common Issues

1. **Server won't start:**
   - Check if port 3000 is available: `lsof -i :3000`
   - Try different port: `PORT=3001 npm start`

2. **API key errors:**
   - Ensure API key is set in environment
   - Check key format (should start with `Bearer `)
   - Verify LLM provider keys are valid

3. **LLM errors:**
   - Check your API key balance/credits
   - Verify model names are correct
   - Try different provider if one fails

4. **Render deployment issues:**
   - Check build logs for errors
   - Ensure environment variables are set
   - Verify Dockerfile is in correct location

### Support

- 📖 Full documentation in `README.md`
- 🔧 Deployment guide in `DEPLOYMENT.md`
- 💻 Integration examples in `examples/`
- 🧪 Run tests with `npm test`

## Security Notes

- Keep API keys secure (never commit to code)
- Use strong API key for authentication
- Enable HTTPS in production (handled by Render)
- Monitor usage and costs regularly
- Consider rate limiting for public APIs

## What's Next?

1. **Monitor usage:** Check Render logs and LLM provider usage
2. **Scale up:** Upgrade Render plan if needed
3. **Add features:** Extend the API with custom functionality
4. **Integration:** Connect to your website/application
5. **Monitoring:** Set up uptime monitoring and alerts

Happy coding! 🎉