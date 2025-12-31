import { StrictMode } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/serviceWorkerUtils'

// Enregistrer le service worker pour le mode PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().then(registration => {
      if (registration) {
        console.log('[PWA] Application prête pour le mode hors ligne');
      }
    }).catch(error => {
      console.error('[PWA] Erreur d\'enregistrement:', error);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
