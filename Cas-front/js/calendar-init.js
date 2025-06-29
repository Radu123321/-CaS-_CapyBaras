// Calendar initialisation separated from HTML

document.addEventListener('DOMContentLoaded', () => {
  const waitForAuth = () => {
    if (!window.authManager) {
      return setTimeout(waitForAuth, 50);
    }
    if (window.authManager.requireAuth()) {
      window.calendar = new Calendar();
    }
  };
  waitForAuth();
}); 