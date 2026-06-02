// Bus d'événements global pour synchroniser tous les hooks
const emitter = new EventTarget()

export function emitRefresh(type) {
  emitter.dispatchEvent(new CustomEvent('refresh', { detail: type }))
}

export function onRefresh(callback) {
  const handler = (e) => callback(e.detail)
  emitter.addEventListener('refresh', handler)
  return () => emitter.removeEventListener('refresh', handler)
}
