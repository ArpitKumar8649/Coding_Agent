# Deployment Guide

## Quick Deploy to Render

### 1. One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### 2. Manual Deploy

1. **Fork this repository** to your GitHub account

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your forked repository
   - Choose the `cline-api` directory if it's not at root

4. **Configure Service**
   - **Name**: `cline-api` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Build Command**: (leave empty - uses Dockerfile)
   - **Start Command**: (leave empty - uses Dockerfile CMD)

5. **Set Environment Variables**
   
   **Required:**
   ```
   API_KEY = [Generate secure random string - Render can auto-generate this]
   ANTHROPIC_API_KEY = [Your Anthropic API key from console.anthropic.com]
   ```
   
   **Optional (but recommended):**
   ```
   OPENAI_API_KEY = [Your OpenAI API key]
   GOOGLE_API_KEY = [Your Google AI API key]
   DEFAULT_LLM_PROVIDER = anthropic
   DEFAULT_MODEL = claude-3-5-sonnet-20241022
   NODE_ENV = production
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - First deploy takes ~5-10 minutes

## Alternative Deployments

### Docker (Any Platform)

1. **Build and run locally:**
   ```bash
   docker build -t cline-api .
   docker run -p 3000:3000 --env-file .env cline-api
   ```

2. **Push to registry:**
   ```bash
   docker tag cline-api your-registry/cline-api:latest
   docker push your-registry/cline-api:latest
   ```

### Railway

1. Fork this repository
2. Go to [railway.app](https://railway.app)
3. "New Project" → "Deploy from GitHub repo"
4. Select your fork
5. Set environment variables:
   ```
   API_KEY = [generate secure string]
   ANTHROPIC_API_KEY = [your key]
   ```
6. Deploy automatically handles the rest

### Heroku

1. **Install Heroku CLI**
2. **Create app:**
   ```bash
   heroku create your-cline-api
   ```
3. **Set environment variables:**
   ```bash
   heroku config:set API_KEY=$(openssl rand -hex 32)
   heroku config:set ANTHROPIC_API_KEY=your-key-here
   ```
4. **Deploy:**
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. "Create App" → "GitHub"
3. Select repository and branch
4. Configure:
   - **Resource Type**: Web Service
   - **Source Directory**: `/` (or `/cline-api` if nested)
   - **Build Command**: (leave empty)
   - **Run Command**: `npm start`
5. Add environment variables
6. Deploy

### AWS Elastic Container Service (ECS)

1. **Build and push to ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   docker build -t cline-api .
   docker tag cline-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/cline-api:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/cline-api:latest
   ```

2. **Create ECS service using AWS Console or CLI**

### Google Cloud Run

1. **Build and deploy:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/cline-api
   gcloud run deploy --image gcr.io/PROJECT-ID/cline-api --platform managed
   ```

## Environment Variables

### Required
- `API_KEY`: Your API authentication key
- At least one LLM API key:
  - `ANTHROPIC_API_KEY`: Claude API key
  - `OPENAI_API_KEY`: GPT API key  
  - `GOOGLE_API_KEY`: Gemini API key

### Optional
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development)
- `DEFAULT_LLM_PROVIDER`: Which LLM to use by default
- `DEFAULT_MODEL`: Default model for the provider
- `RATE_LIMIT_WINDOW`: Rate limit window in minutes
- `RATE_LIMIT_MAX`: Max requests per window
- `LOG_LEVEL`: Logging level (info/debug/warn/error)

## Post-Deployment Testing

After deployment, test your API:

1. **Health Check:**
   ```bash
   curl https://your-app-url.com/health
   ```

2. **Generate Code:**
   ```bash
   curl -X POST https://your-app-url.com/api/generate \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Create a hello world function"}'
   ```

## Monitoring

### Render
- Built-in logs and metrics
- Custom health checks at `/health`
- Automatic restarts on failure

### Custom Monitoring
Add monitoring tools:
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: LogDNA, Papertrail
- **Metrics**: New Relic, DataDog
- **Error tracking**: Sentry

## Scaling

### Vertical Scaling
- Increase memory/CPU in platform settings
- Monitor usage and adjust as needed

### Horizontal Scaling  
- Enable auto-scaling if supported
- Consider load balancer for multiple instances
- Use Redis for shared rate limiting

## Security Checklist

- [ ] Strong API key generated and secured
- [ ] LLM API keys stored as environment variables (not in code)
- [ ] HTTPS enabled (handled by platforms)
- [ ] Rate limiting configured
- [ ] CORS properly configured for your domain
- [ ] Monitor for unusual usage patterns

## Troubleshooting

### Common Issues

1. **Build failures:**
   - Check Dockerfile syntax
   - Ensure all files are committed
   - Verify Node.js version compatibility

2. **Runtime errors:**
   - Check environment variables are set
   - Verify LLM API keys are valid
   - Check logs for specific error messages

3. **API errors:**
   - Verify API key format and headers
   - Check rate limits
   - Confirm LLM provider availability

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
```

### Support

- Check service status pages for your platform
- Review deployment logs
- Test locally first: `npm start`
- Use health endpoint: `/health`