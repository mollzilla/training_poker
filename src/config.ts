// Get the server URL based on the current environment and network configuration
const getServerUrl = () => {
  const hostname = window.location.hostname;
  const isDevelopment = import.meta.env.DEV;
  
  // For development and local network access
  if (isDevelopment) {
    // When accessing locally via localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    // When accessing via network IP
    return `http://${hostname}:3000`;
  }
  
  // For production
  return import.meta.env.VITE_API_URL || `http://${hostname}:3000`;
};

export const API_BASE_URL = getServerUrl();
