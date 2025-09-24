/**
 * Integration Examples for Cline API
 * 
 * These examples show how to integrate Cline API into various applications
 */

// Example 1: Basic Node.js Integration
class ClineAPIClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    return response.json();
  }

  async generateCode(prompt, options = {}) {
    return this.makeRequest('/api/generate', 'POST', { prompt, options });
  }

  async editCode(filePath, content, instructions, options = {}) {
    return this.makeRequest('/api/edit', 'POST', {
      filePath, content, instructions, options
    });
  }

  async getDiff(originalContent, newContent, filePath) {
    return this.makeRequest('/api/diff', 'POST', {
      originalContent, newContent, filePath
    });
  }

  async healthCheck() {
    return this.makeRequest('/health');
  }
}

// Example 2: Express.js Middleware Integration
function createClineMiddleware(clineApiUrl, clineApiKey) {
  const client = new ClineAPIClient(clineApiUrl, clineApiKey);

  return {
    // Middleware to add Cline client to requests
    addClineClient: (req, res, next) => {
      req.cline = client;
      next();
    },

    // Route handler for code generation
    generateCode: async (req, res) => {
      try {
        const { prompt, options } = req.body;
        const result = await client.generateCode(prompt, options);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    // Route handler for code editing
    editCode: async (req, res) => {
      try {
        const { filePath, content, instructions, options } = req.body;
        const result = await client.editCode(filePath, content, instructions, options);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  };
}

// Example 3: React Hook for Frontend Integration
const useClineAPI = (apiUrl, apiKey) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const client = React.useMemo(
    () => new ClineAPIClient(apiUrl, apiKey),
    [apiUrl, apiKey]
  );

  const generateCode = React.useCallback(async (prompt, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.generateCode(prompt, options);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [client]);

  const editCode = React.useCallback(async (filePath, content, instructions, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.editCode(filePath, content, instructions, options);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [client]);

  return { generateCode, editCode, loading, error };
};

// Example 4: Vue.js Composition API
const useCline = (apiUrl, apiKey) => {
  const loading = Vue.ref(false);
  const error = Vue.ref(null);
  
  const client = new ClineAPIClient(apiUrl, apiKey);

  const generateCode = async (prompt, options = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await client.generateCode(prompt, options);
      loading.value = false;
      return result;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
      throw err;
    }
  };

  return { generateCode, loading, error };
};

// Example 5: Python Integration (using requests)
const pythonExample = `
import requests
import json

class ClineAPI:
    def __init__(self, api_url, api_key):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def generate_code(self, prompt, options=None):
        url = f'{self.api_url}/api/generate'
        data = {'prompt': prompt, 'options': options or {}}
        
        response = requests.post(url, json=data, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def edit_code(self, file_path, content, instructions, options=None):
        url = f'{self.api_url}/api/edit'
        data = {
            'filePath': file_path,
            'content': content,
            'instructions': instructions,
            'options': options or {}
        }
        
        response = requests.post(url, json=data, headers=self.headers)
        response.raise_for_status()
        
        return response.json()

# Usage
cline = ClineAPI('https://your-api.com', 'your-api-key')
result = cline.generate_code('Create a Flask hello world app')
print(result['files'][0]['content'])
`;

// Example 6: CLI Tool Integration
const createCLITool = () => {
  const readline = require('readline');
  const fs = require('fs');

  class ClineCLI {
    constructor(apiUrl, apiKey) {
      this.client = new ClineAPIClient(apiUrl, apiKey);
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }

    async generateCommand() {
      const prompt = await this.question('Enter your code generation prompt: ');
      
      console.log('Generating code...');
      
      try {
        const result = await this.client.generateCode(prompt);
        
        console.log(`\n✅ Generated ${result.files.length} file(s):`);
        
        for (const file of result.files) {
          console.log(`\n📁 ${file.path}:`);
          console.log(file.content);
          
          // Option to save file
          const save = await this.question(`Save ${file.path} to disk? (y/n): `);
          if (save.toLowerCase() === 'y') {
            fs.writeFileSync(file.path, file.content);
            console.log(`💾 Saved ${file.path}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
      }
    }

    async editCommand() {
      const filePath = await this.question('Enter file path to edit: ');
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const instructions = await this.question('Enter editing instructions: ');

      console.log('Editing code...');

      try {
        const result = await this.client.editCode(filePath, content, instructions);
        
        console.log(`\n✅ Edited ${filePath}:`);
        console.log(result.files[0].diff);
        
        const apply = await this.question('Apply changes? (y/n): ');
        if (apply.toLowerCase() === 'y') {
          fs.writeFileSync(filePath, result.files[0].content);
          console.log(`💾 Applied changes to ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
      }
    }

    question(prompt) {
      return new Promise((resolve) => {
        this.rl.question(prompt, resolve);
      });
    }

    close() {
      this.rl.close();
    }
  }

  return ClineCLI;
};

// Example 7: Batch Processing
class ClineBatchProcessor {
  constructor(apiUrl, apiKey) {
    this.client = new ClineAPIClient(apiUrl, apiKey);
    this.results = [];
  }

  async processPrompts(prompts, options = {}) {
    console.log(`Processing ${prompts.length} prompts...`);
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      
      try {
        console.log(`[${i + 1}/${prompts.length}] Processing: ${prompt.substring(0, 50)}...`);
        
        const result = await this.client.generateCode(prompt, options);
        this.results.push({ prompt, result, success: true });
        
        // Add delay to respect rate limits
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
        this.results.push({ prompt, error: error.message, success: false });
      }
    }

    return this.results;
  }

  exportResults(filename = 'cline-results.json') {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📊 Results exported to ${filename}`);
  }
}

// Usage Examples
if (require.main === module) {
  // Example usage
  const client = new ClineAPIClient(
    process.env.CLINE_API_URL || 'http://localhost:3000',
    process.env.CLINE_API_KEY || 'your-api-key'
  );

  // Test the API
  client.healthCheck()
    .then(() => console.log('✅ API is healthy'))
    .catch(err => console.error('❌ API health check failed:', err.message));
}

module.exports = {
  ClineAPIClient,
  createClineMiddleware,
  useClineAPI,
  createCLITool,
  ClineBatchProcessor
};
`;

console.log(pythonExample);