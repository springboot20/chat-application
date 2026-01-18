// Format: MAJOR.MINOR.PATCH
import packageJson from '../../package.json';

// ✅ Automatically use version from package.json
const APP_VERSION = packageJson.version;

export const checkAndClearStorage = () => {
  if (!import.meta.env.PROD) return;

  try {
    const storedVersion = localStorage.getItem('app-version');

    if (storedVersion !== APP_VERSION) {
      console.log(`🔄 Version update: ${storedVersion || 'unknown'} → ${APP_VERSION}`);
      localStorage.clear();
      localStorage.setItem('app-version', APP_VERSION);
      sessionStorage.setItem('version-reload-done', 'true');
      window.location.reload();
    }
  } catch (error) {
    console.error('❌ Version check failed:', error);
  }
};

export const getAppVersion = () => APP_VERSION;
