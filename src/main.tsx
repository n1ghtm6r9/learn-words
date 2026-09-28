import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startAccessGuard } from '@/cloud/startAccessGuard'
import { startDuplicateMerging } from '@/cloud/startDuplicateMerging'
import { migrateLegacyDatabases } from '@/db/legacy/migrateLegacyDatabases'
import { requestPersistentStorage } from '@/lib/requestPersistentStorage'

void requestPersistentStorage()

void migrateLegacyDatabases().then(() => {
  startAccessGuard()
  startDuplicateMerging()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
