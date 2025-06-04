// Get the current hostname (will be localhost in development, IP address when accessing externally)
const hostname = window.location.hostname;

// Use the hostname to construct the API URL
// This way it will use localhost when running locally, and the IP when accessing externally
export const API_BASE_URL = `http://${hostname}:3000`;
