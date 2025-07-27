// Simple localStorage utility for Sync
// Use these helpers to get/set values safely in localStorage

export function getLocalStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
