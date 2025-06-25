// Initialize auth manager and handle redirect
document.addEventListener('DOMContentLoaded', () => {
  const authManager = new AuthManager();
  
  // Small delay to allow auth manager to initialize
  setTimeout(() => {
    if (authManager.isAuthenticated()) {
      // User is logged in, redirect to dashboard
      window.location.href = 'dashboard.html';
    } else {
      // User is not logged in, redirect to login
      window.location.href = 'login.html';
    }
  }, 500);
}); 