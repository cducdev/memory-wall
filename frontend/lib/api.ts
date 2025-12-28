import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin APIs
export const adminAPI = {
  login: async (password: string) => {
    const response = await api.post('/api/admin/login', { password });
    return response.data;
  },
  
  createReceiver: async (name: string) => {
    const response = await api.post('/api/admin/receiver', { name });
    return response.data;
  },
  
  getReceivers: async () => {
    const response = await api.get('/api/admin/receivers');
    return response.data;
  },
  
  createMemory: async (data: {
    receiver_id: string;
    content: string;
    emoji?: string;
    image_url?: string;
  }) => {
    const response = await api.post('/api/admin/memory', data);
    return response.data;
  },
  
  getMessages: async () => {
    const response = await api.get('/api/admin/messages');
    return response.data;
  },
  
  verifyMessage: async (messageId: string, name: string) => {
    const response = await api.post(`/api/admin/verify-message/${messageId}`, { name });
    return response.data;
  },
};

// Public APIs
export const publicAPI = {
  getMemory: async (token: string) => {
    const response = await api.get(`/api/public/to/${token}`);
    return response.data;
  },
  
  sendMessage: async (formData: FormData) => {
    const response = await api.post('/api/message', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;


