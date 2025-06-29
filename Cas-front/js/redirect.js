// Redirect logic externalized from index.html

document.addEventListener('DOMContentLoaded', () => {
  // Wait a short moment to ensure authManager has initialised
  const tryRedirect = () => {
    if (!window.authManager) {
      return setTimeout(tryRedirect, 50);
    }
    const redirectTo = window.authManager.isAuthenticated() ? 'dashboard.html' : 'login.html';
    window.location.href = redirectTo;
  };
  tryRedirect();
}); 