// Get the server URL based on the current environment
const getServerUrl = () => {
  const hostname = window.location.hostname;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development, always use the json-server host
  if (isDevelopment) {
    return `http://${hostname}:3000`;
  }
  
  // In production, use the configured API URL or fall back to the current hostname
  return process.env.API_URL || `http://${hostname}:3000`;
};

export const API_BASE_URL = getServerUrl();
