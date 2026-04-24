import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import App from './app.tsx'
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#302e2c',
          color: '#e8e6e3',
          border: '1px solid #4a4744',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.875rem',
        },
        success: { iconTheme: { primary: '#81b64c', secondary: '#302e2c' } },
        error:   { iconTheme: { primary: '#cc3333', secondary: '#302e2c' } },
      }}
    />
  </StrictMode>,
)
