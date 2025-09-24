const validationRules = {
  generate: (body) => {
    const errors = [];
    
    if (!body.prompt || typeof body.prompt !== 'string') {
      errors.push('prompt is required and must be a string');
    }
    
    if (body.prompt && body.prompt.length < 10) {
      errors.push('prompt must be at least 10 characters long');
    }
    
    if (body.prompt && body.prompt.length > 10000) {
      errors.push('prompt must be less than 10,000 characters');
    }
    
    if (body.options && typeof body.options !== 'object') {
      errors.push('options must be an object');
    }
    
    if (body.options?.provider && !['anthropic', 'openai', 'google'].includes(body.options.provider)) {
      errors.push('provider must be one of: anthropic, openai, google');
    }
    
    return errors;
  },
  
  edit: (body) => {
    const errors = [];
    
    if (!body.content || typeof body.content !== 'string') {
      errors.push('content is required and must be a string');
    }
    
    if (!body.instructions || typeof body.instructions !== 'string') {
      errors.push('instructions is required and must be a string');
    }
    
    if (body.instructions && body.instructions.length < 5) {
      errors.push('instructions must be at least 5 characters long');
    }
    
    if (body.filePath && typeof body.filePath !== 'string') {
      errors.push('filePath must be a string');
    }
    
    if (body.options && typeof body.options !== 'object') {
      errors.push('options must be an object');
    }
    
    return errors;
  },
  
  diff: (body) => {
    const errors = [];
    
    if (!body.originalContent || typeof body.originalContent !== 'string') {
      errors.push('originalContent is required and must be a string');
    }
    
    if (!body.newContent || typeof body.newContent !== 'string') {
      errors.push('newContent is required and must be a string');
    }
    
    if (body.filePath && typeof body.filePath !== 'string') {
      errors.push('filePath must be a string');
    }
    
    return errors;
  }
};

const validateRequest = (type) => {
  return (req, res, next) => {
    const validator = validationRules[type];
    
    if (!validator) {
      return res.status(500).json({
        error: 'Validation Error',
        message: `Unknown validation type: ${type}`
      });
    }
    
    const errors = validator(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        fields: errors
      });
    }
    
    next();
  };
};

module.exports = { validateRequest };