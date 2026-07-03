export const debugFetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  console.log(`[API REQUEST] ${method} ${url}`, options.body ? '(has body)' : '');
  
  const startTime = performance.now();
  try {
    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);
    
    if (response.ok) {
      console.log(`[API SUCCESS] ${method} ${url} - Status: ${response.status} (${duration}ms)`);
    } else {
      console.error(`[API ERROR] ${method} ${url} - Status: ${response.status} (${duration}ms)`);
    }
    
    return response;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    console.error(`[API NETWORK FAILURE] ${method} ${url} (${duration}ms):`, error.message);
    throw error;
  }
};
