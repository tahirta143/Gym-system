import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// Request interceptor to automatically attach standard DRF Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Session expired / invalid -> Clear storage and redirect to login
        if (!error.config.url.includes('login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else if (error.response.status === 403) {
        // Access Forbidden -> Redirect to Access Denied page without logging out
        if (!error.config.url.includes('login')) {
          window.location.href = '/access-denied';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
