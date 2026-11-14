import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext' // Assuming you have this
import { registerSW } from 'virtual:pwa-register' // ✅ IMPORTED PWA REGISTER

// ✅ Register the Service Worker for offline support
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
)