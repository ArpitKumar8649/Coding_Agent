/**
 * Time utility functions for formatting timestamps
 */

export const formatDistanceToNow = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const then = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diffMs = now - then;
  
  if (diffMs < 0) return 'Just now';
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 30) {
    return 'Just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    // For older messages, show the actual date
    return new Date(then).toLocaleDateString();
  }
};

export const formatTimestamp = (timestamp, format = 'short') => {
  if (!timestamp) return 'Unknown';
  
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  
  switch (format) {
    case 'short':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'long':
      return date.toLocaleString();
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    default:
      return date.toLocaleString();
  }
};

export const isToday = (timestamp) => {
  if (!timestamp) return false;
  
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

export const isYesterday = (timestamp) => {
  if (!timestamp) return false;
  
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return date.getDate() === yesterday.getDate() &&
         date.getMonth() === yesterday.getMonth() &&
         date.getFullYear() === yesterday.getFullYear();
};

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  if (isToday(timestamp)) {
    return `Today at ${formatTimestamp(timestamp, 'short')}`;
  } else if (isYesterday(timestamp)) {
    return `Yesterday at ${formatTimestamp(timestamp, 'short')}`;
  } else {
    return formatTimestamp(timestamp, 'long');
  }
};