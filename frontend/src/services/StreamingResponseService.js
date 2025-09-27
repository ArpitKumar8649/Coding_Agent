/**
 * Streaming Response Service
 * Handles real-time streaming AI responses character by character
 */

class StreamingResponseService {
  constructor() {
    this.activeStreams = new Map();
    this.listeners = new Map();
  }

  // Start a new streaming response
  startStream(streamId, onChunk, onComplete, onError) {
    const stream = {
      id: streamId,
      content: '',
      isActive: true,
      startTime: Date.now(),
      onChunk,
      onComplete,
      onError
    };

    this.activeStreams.set(streamId, stream);
    return stream;
  }

  // Add chunk to stream
  addChunk(streamId, chunk) {
    const stream = this.activeStreams.get(streamId);
    if (!stream || !stream.isActive) {
      return false;
    }

    stream.content += chunk;
    
    // Call chunk handler
    if (stream.onChunk) {
      stream.onChunk(chunk, stream.content);
    }

    // Emit chunk event
    this.emit('chunk', {
      streamId,
      chunk,
      content: stream.content
    });

    return true;
  }

  // Complete a stream
  completeStream(streamId, finalContent = null) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return false;
    }

    stream.isActive = false;
    const content = finalContent || stream.content;
    
    // Call completion handler
    if (stream.onComplete) {
      stream.onComplete(content);
    }

    // Emit completion event
    this.emit('complete', {
      streamId,
      content,
      duration: Date.now() - stream.startTime
    });

    // Clean up
    this.activeStreams.delete(streamId);
    return true;
  }

  // Error handling for streams
  errorStream(streamId, error) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return false;
    }

    stream.isActive = false;
    
    // Call error handler
    if (stream.onError) {
      stream.onError(error);
    }

    // Emit error event
    this.emit('error', {
      streamId,
      error,
      content: stream.content
    });

    // Clean up
    this.activeStreams.delete(streamId);
    return true;
  }

  // Simulate streaming response (for HTTP fallback)
  simulateStreaming(content, streamId, options = {}) {
    const {
      chunkSize = 3,
      delay = 50,
      onChunk,
      onComplete,
      onError
    } = options;

    return new Promise((resolve, reject) => {
      const stream = this.startStream(streamId, onChunk, onComplete, onError);
      let currentIndex = 0;

      const sendNextChunk = () => {
        if (currentIndex >= content.length) {
          this.completeStream(streamId, content);
          resolve(content);
          return;
        }

        const chunk = content.slice(currentIndex, currentIndex + chunkSize);
        currentIndex += chunkSize;

        this.addChunk(streamId, chunk);

        // Schedule next chunk
        setTimeout(sendNextChunk, delay);
      };

      // Start streaming
      setTimeout(sendNextChunk, delay);
    });
  }

  // Get active streams
  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }

  // Check if stream is active
  isStreamActive(streamId) {
    const stream = this.activeStreams.get(streamId);
    return stream && stream.isActive;
  }

  // Cancel a stream
  cancelStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.isActive = false;
      this.activeStreams.delete(streamId);
      
      this.emit('cancelled', { streamId });
      return true;
    }
    return false;
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in streaming event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup all streams
  cleanup() {
    for (const [streamId] of this.activeStreams) {
      this.cancelStream(streamId);
    }
    this.listeners.clear();
  }
}

export default StreamingResponseService;