import axios from 'axios';


const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', new URLSearchParams({ username, password })),
  register: (email, password) => 
    api.post('/auth/register', { email, password }),
};

export const chatAPI = {
  // Streaming method using fetch
  sendMessageStream: async (query, threadId, onChunk, onComplete, onError) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Bearer prefix like your axios interceptor does
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ 
          query, 
          thread_id: threadId 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete?.();
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      onError?.(error);
      throw error;
    }
  },

  // Keep your existing methods
  sendMessage: (query, threadId) => 
    api.post('/chat/', { query, thread_id: threadId }),
  getHistory: () => 
    api.get('/chat/history'),
  getThread: (threadId) => 
    api.get(`/chat/${threadId}`),
};

export const fileAPI = {
  upload: (files, onProgress) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/files/upload/', formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    });
  },

  getFileChunks: (fileId) => {
    return api.get(`/files/${fileId}/chunks`)  
  },

  getUserFiles: async () => {
    const response = await api.get('/files/')
    return response
  },
  
  getFileMetadata: async (filename) => {
    const response = await api.get(`/files/${encodeURIComponent(filename)}/metadata`)
    return response
  },
  
  getTaskStatus: async (taskId) => {
    const response = await api.get(`/files/task/${taskId}`)
    return response
  },
};
