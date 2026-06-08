import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './hooks/useCurrentUser.jsx'
import { FeaturesProvider } from './hooks/FeaturesProvider.jsx'
import { RealtimeProvider } from './contexts/RealtimeContext.jsx'
import { startAppUpdateChecks } from './lib/appUpdate.js'
import './index.css'
import App from './App.jsx'

startAppUpdateChecks()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <FeaturesProvider>
          <RealtimeProvider>
            <App />
          </RealtimeProvider>
        </FeaturesProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
)
