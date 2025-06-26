// ===== LOGIN PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated
  if (authManager.isAuthenticated()) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect') || 'dashboard.html';
    window.location.href = redirect;
    return;
  }

  // Get form elements
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const loginBtn = document.getElementById('loginBtn');
  const togglePasswordBtn = document.getElementById('togglePassword');

  // Store original button text
  if (loginBtn) {
    loginBtn.dataset.originalText = loginBtn.innerHTML;
  }

  // ===== PASSWORD TOGGLE FUNCTIONALITY =====
  
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈'; // Monkey covering eyes emoji
      } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️'; // Eye emoji
      }
    });
  }

  // ===== FORM VALIDATION =====
  
  function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    clearFieldErrors();
    
    // Validate email
    const email = emailInput.value.trim();
    if (!email) {
      setFieldError('email', 'Email is required');
      isValid = false;
    } else if (!authManager.validateEmail(email)) {
      setFieldError('email', 'Please enter a valid email address');
      isValid = false;
    }
    
    // Validate password
    const password = passwordInput.value;
    if (!password) {
      setFieldError('password', 'Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setFieldError('password', 'Password must be at least 6 characters');
      isValid = false;
    }
    
    return isValid;
  }

  // ===== FORM SUBMISSION =====
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('Login form submitted');
    
    // Validate form
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    // Get form data
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;
    
    console.log('Attempting login with:', { email, rememberMe });
    
    // Set loading state
    setFormLoading(true);
    
    try {
      // Attempt login
      const result = await authManager.login(email, password, rememberMe);
      
      console.log('Login result:', result);
      
      if (result.success) {
        showSuccess('Login successful! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get('redirect') || 'dashboard.html';
          window.location.href = redirect;
        }, 1500);
        
      } else {
        showError(result.error || 'Login failed');
        
        // Handle specific error cases
        if (result.error && result.error.toLowerCase().includes('email')) {
          setFieldError('email', 'Invalid email address');
        } else if (result.error && result.error.toLowerCase().includes('password')) {
          setFieldError('password', 'Invalid password');
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      showError('Connection error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  });

  // ===== DEMO ACCOUNT FUNCTIONALITY =====
  
  // Add click handlers for demo accounts
  const demoAccounts = document.querySelectorAll('.demo-account');
  demoAccounts.forEach(account => {
    account.addEventListener('click', (e) => {
      e.preventDefault();
      
      const text = account.textContent;
      console.log('Demo account clicked:', text);
      
      // Extract email and password from demo account text
      let email = '', password = '';
      
      if (text.includes('admin@cas.ro')) {
        email = 'admin@cas.ro';
        password = 'admin123';
      } else if (text.includes('manager@cas.ro')) {
        email = 'manager@cas.ro';
        password = 'manager123';
      } else if (text.includes('employee@cas.ro')) {
        email = 'employee@cas.ro';
        password = 'employee123';
      }
      
      if (email && password) {
        emailInput.value = email;
        passwordInput.value = password;
        
        // Add visual feedback
        account.style.backgroundColor = '#e8f5e8';
        account.style.borderColor = '#27ae60';
        
        setTimeout(() => {
          account.style.backgroundColor = '';
          account.style.borderColor = '';
        }, 1000);
        
        console.log('Demo credentials filled:', { email, password });
      }
    });
  });

  // ===== UTILITY FUNCTIONS =====
  
  function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    clearFieldError(fieldId);
    
    // Add error class
    field.classList.add('error');
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.id = `${fieldId}-error`;
    
    field.parentNode.insertBefore(errorElement, field.nextSibling);
  }
  
  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('error');
    
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.remove();
    }
  }
  
  function clearFieldErrors() {
    clearFieldError('email');
    clearFieldError('password');
  }
  
  function setFormLoading(loading = true) {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    if (loading) {
      loginBtn.disabled = true;
      btnText.style.opacity = '0';
      btnLoading.classList.add('visible');
    } else {
      loginBtn.disabled = false;
      btnText.style.opacity = '1';
      btnLoading.classList.remove('visible');
    }
  }
  
  function showSuccess(message) {
    showAlert(message, 'success');
  }
  
  function showError(message) {
    showAlert(message, 'error');
  }
  
  function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.getElementById('alertMessage');
    
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    container.classList.add('visible');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      container.classList.remove('visible');
    }, 5000);
  }

  // ===== AUTO-FOCUS =====
  
  // Focus on email input when page loads
  if (emailInput) {
    emailInput.focus();
  }

  // ===== KEYBOARD SHORTCUTS =====
  
  document.addEventListener('keydown', (e) => {
    // Enter key submits form
    if (e.key === 'Enter' && (e.target === emailInput || e.target === passwordInput)) {
      e.preventDefault();
      loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape key clears form
    if (e.key === 'Escape') {
      emailInput.value = '';
      passwordInput.value = '';
      if (rememberMeCheckbox) rememberMeCheckbox.checked = false;
      clearFieldErrors();
    }
  });

  console.log('Login page initialized');
}); 