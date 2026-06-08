const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION
const CHECK_INTERVAL_MS = 60_000

let checkInProgress = false
let reloadInProgress = false

function removeVersionFromUrl() {
  const url = new URL(window.location.href)

  if (url.searchParams.get('__app_version') !== CURRENT_VERSION) return

  url.searchParams.delete('__app_version')
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  )
}

async function checkForUpdate() {
  if (checkInProgress || reloadInProgress || !navigator.onLine) return

  checkInProgress = true

  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
    })

    if (!response.ok) return

    const data = await response.json()
    const remoteVersion = String(data.version || '')

    if (!remoteVersion || remoteVersion === CURRENT_VERSION) return

    reloadInProgress = true

    const url = new URL(window.location.href)
    url.searchParams.set('__app_version', remoteVersion)
    window.location.replace(url.toString())
  } catch {
    // A failed check must never prevent the app from starting.
  } finally {
    checkInProgress = false
  }
}

export function startAppUpdateChecks() {
  removeVersionFromUrl()

  window.setTimeout(checkForUpdate, 2_000)
  window.setInterval(checkForUpdate, CHECK_INTERVAL_MS)
  window.addEventListener('focus', checkForUpdate)
  window.addEventListener('online', checkForUpdate)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
}
