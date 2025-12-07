// Simple localStorage utility for Sync
// Use these helpers to get/set values safely in localStorage

export function getLocalStorage(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const value = window.localStorage.getItem(key);
      return value !== null ? value : '';
    }
    return '';
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return '';
  }
}

// Safely set an item in localStorage
export function setLocalStorage(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
  }
}
