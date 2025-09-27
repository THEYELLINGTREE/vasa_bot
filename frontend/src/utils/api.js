import axios from 'axios';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true
});

// Configure default axios instance for backward compatibility
axios.defaults.baseURL = 'http://localhost:3001';
axios.defaults.withCredentials = true;

export default api;