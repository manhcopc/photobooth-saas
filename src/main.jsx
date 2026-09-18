import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Override fetch to bypass Ngrok browser warning for all API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  let url = '';
  if (typeof resource === 'string' || resource instanceof URL) {
    url = resource.toString();
  } else if (resource instanceof Request) {
    url = resource.url;
  }

  if (url.includes('ngrok')) {
    config = config || {};
    const headers = new Headers(config.headers || (resource instanceof Request ? resource.headers : {}));
    headers.set('ngrok-skip-browser-warning', 'true');
    
    if (resource instanceof Request) {
      resource = new Request(resource, { headers });
    } else {
      config.headers = headers;
    }
    return originalFetch(resource, config);
  }
  
  return originalFetch(...args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
