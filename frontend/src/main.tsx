import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // Import cái này

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* Bao bọc App bằng BrowserRouter tại đây */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)