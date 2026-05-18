export function getAuth() {
  try { return JSON.parse(localStorage.getItem('forecast365_auth') || 'null') } catch { return null }
}
export function setAuth(d) { localStorage.setItem('forecast365_auth', JSON.stringify(d)) }
export function clearAuth() { localStorage.removeItem('forecast365_auth') }
