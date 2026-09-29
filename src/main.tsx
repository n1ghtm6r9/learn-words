import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startAccessGuard } from '@/cloud/startAccessGuard'
import { startDuplicateMerging } from '@/cloud/startDuplicateMerging'
import { migrateLegacyDatabases } from '@/db/legacy/migrateLegacyDatabases'
import { followKeyboard } from '@/lib/followKeyboard'
import { requestPersistentStorage } from '@/lib/requestPersistentStorage'
import { followTelegramColorScheme } from '@/telegram/followTelegramColorScheme'
import { useTelegramStore } from '@/telegram/useTelegramStore'
import { loadTelegramWebApp } from '@/telegram/loadTelegramWebApp'
import { readTelegramLaunch } from '@/telegram/readTelegramLaunch'
import { startTelegramMiniApp } from '@/telegram/startTelegramMiniApp'

void requestPersistentStorage()

void Promise.all([loadTelegramWebApp(), migrateLegacyDatabases()]).then(([telegram]) => {
  startAccessGuard()
  startDuplicateMerging()
  if (telegram) {
    followTelegramColorScheme(telegram)
    useTelegramStore.setState({ webApp: telegram, launch: readTelegramLaunch() })
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  followKeyboard(telegram)
  if (telegram) startTelegramMiniApp(telegram)
})
