import React, { useState, useEffect } from 'react';
import ChatInterface from './components/chat/ChatInterface';
import './App.css';

// Mock data for demonstration
const mockMessages = [
  {
    id: 1,
    type: 'user',
    content: 'Create a React component for a todo list with add, delete, and toggle functionality',
    timestamp: Date.now() - 60000,
  },
  {
    id: 2,
    type: 'assistant',
    content: `I'll create a comprehensive todo list component for you. Let me break this down into the main component and helper functions.

**TodoList.jsx**

\`\`\`jsx
import React, { useState } from 'react';

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false
      }]);
      setInputValue('');
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div className="todo-container">
      <h2>Todo List</h2>
      <div className="todo-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
\`\`\`

The component includes:
- **State management** for todos and input
- **Add functionality** with Enter key support
- **Delete functionality** for removing todos
- **Toggle functionality** for marking complete/incomplete
- **Clean, reusable structure**

Would you like me to add any additional features like edit functionality, local storage persistence, or filtering options?`,
    timestamp: Date.now() - 30000,
    mode: 'ACT'
  },
  {
    id: 3,
    type: 'tool_execution',
    toolName: 'write_to_file',
    parameters: {
      path: '/src/components/TodoList.jsx',
      content: 'import React, { useState } from \'react\';\n\nconst TodoList = () => {\n  // Component implementation...\n};'
    },
    result: {
      success: true,
      path: '/src/components/TodoList.jsx',
      size: 1024,
      lines: 45
    },
    status: 'completed',
    timestamp: Date.now() - 25000,
  },
  {
    id: 4,
    type: 'system',
    content: 'File created successfully: TodoList.jsx',
    timestamp: Date.now() - 20000,
    variant: 'success'
  }
];

function App() {
  const [messages, setMessages] = useState(mockMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState('ACT');
  const [agentStatus, setAgentStatus] = useState('idle');

  const handleSendMessage = (message) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setAgentStatus('thinking');
    setIsStreaming(true);

    // Simulate agent response
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I understand you want me to: "${message}". Let me help you with that!

This is a **demonstration** of the chat interface with:
- **Syntax highlighting** for code blocks
- **Real-time streaming** simulation
- **Tool execution** indicators
- **Dark theme** styling

\`\`\`javascript
// Example code with syntax highlighting
const handleResponse = (message) => {
  console.log('Processing:', message);
  return { success: true };
};
\`\`\`

The interface supports Plan and Act modes, streaming responses, and beautiful formatting!`,
        timestamp: Date.now(),
        mode: currentMode
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(false);
      setAgentStatus('idle');
    }, 2000);
  };

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    
    // Add system message for mode change
    const systemMessage = {
      id: Date.now(),
      type: 'system',
      content: `Switched to ${mode} mode`,
      timestamp: Date.now(),
      variant: 'mode'
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  return (
    <div className="App">
      <div className="h-screen bg-gray-900">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          currentMode={currentMode}
          onModeChange={handleModeChange}
          agentStatus={agentStatus}
        />
      </div>
    </div>
  );
}

export default App;