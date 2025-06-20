// ===== REGISTRATION PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated
  if (authManager.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Get form elements
  const registerForm = document.getElementById('registerForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const roleSelect = document.getElementById('role');
  const agreeTermsCheckbox = document.getElementById('agreeTerms');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

  // Store original button text
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.dataset.originalText = submitBtn.innerHTML;
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

  if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const eyeIcon = toggleConfirmPasswordBtn.querySelector('.eye-icon');
      
      if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        eyeIcon.textContent = '🙈'; // Monkey covering eyes emoji
      } else {
        confirmPasswordInput.type = 'password';
        eyeIcon.textContent = '👁️'; // Eye emoji
      }
    });
  }

  // ===== FORM VALIDATION =====
  
  function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    clearAllFieldErrors();
    
    // Validate first name
    const firstName = firstNameInput.value.trim();
    if (!firstName) {
      setFieldError('firstName', 'First name is required');
      isValid = false;
    } else if (firstName.length < 2) {
      setFieldError('firstName', 'First name must be at least 2 characters');
      isValid = false;
    }
    
    // Validate last name
    const lastName = lastNameInput.value.trim();
    if (!lastName) {
      setFieldError('lastName', 'Last name is required');
      isValid = false;
    } else if (lastName.length < 2) {
      setFieldError('lastName', 'Last name must be at least 2 characters');
      isValid = false;
    }
    
    // Validate email
    const email = emailInput.value.trim();
    if (!email) {
      setFieldError('email', 'Email is required');
      isValid = false;
    } else if (!authManager.validateEmail(email)) {
      setFieldError('email', 'Please enter a valid email address');
      isValid = false;
    }
    
    // Validate phone (optional but if provided, must be valid)
    const phone = phoneInput.value.trim();
    if (phone && phone.length < 10) {
      setFieldError('phone', 'Please enter a valid phone number');
      isValid = false;
    }
    
    // Validate password
    const password = passwordInput.value;
    if (!password) {
      setFieldError('password', 'Password is required');
      isValid = false;
    } else if (!authManager.validatePassword(password)) {
      setFieldError('password', 'Password must be at least 6 characters');
      isValid = false;
    }
    
    // Validate confirm password
    const confirmPassword = confirmPasswordInput.value;
    if (!confirmPassword) {
      setFieldError('confirmPassword', 'Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      isValid = false;
    }
    
    // Validate role
    const role = roleSelect.value;
    if (!role) {
      setFieldError('role', 'Please select a role');
      isValid = false;
    }
    
    // Validate terms agreement
    if (!agreeTermsCheckbox.checked) {
      setFieldError('agreeTerms', 'You must agree to the Terms and Conditions');
      isValid = false;
    }
    
    return isValid;
  }

  // ===== FORM SUBMISSION =====
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('Registration form submitted');
    
    // Validate form
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    // Get form data with default location
    const userData = {
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim() || null,
      password: passwordInput.value,
      role: roleSelect.value,
      locationId: 1 // Default location ID
    };
    
    console.log('Attempting registration with:', userData);
    
    // Set loading state
    setFormLoading(true);
    
    try {
      // Attempt registration
      const result = await authManager.register(userData);
      
      console.log('Registration result:', result);
      
      if (result.success) {
        showSuccess(result.message || 'Registration successful! You can now login.');
        
        // Redirect to login page after delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        
      } else {
        showError(result.error || 'Registration failed');
        
        // Handle specific error cases
        if (result.error && result.error.toLowerCase().includes('email')) {
          setFieldError('email', result.error);
        }
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      showError('Connection error. Please try again.');
    } finally {
      setFormLoading(false);
    }
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
  
  function clearAllFieldErrors() {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'role', 'agreeTerms'];
    fields.forEach(fieldId => clearFieldError(fieldId));
  }
  
  function setFormLoading(loading = true) {
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const inputs = registerForm.querySelectorAll('input, select');
    
    if (loading) {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Creating Account...';
      }
      inputs.forEach(input => input.disabled = true);
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'Create Account';
      }
      inputs.forEach(input => input.disabled = false);
    }
  }
  
  function showSuccess(message) {
    showAlert(message, 'success');
  }
  
  function showError(message) {
    showAlert(message, 'error');
  }
  
  function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <span>${message}</span>
      <button type="button" class="alert-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(alert);
    
    // Auto remove
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 5000);
    
    // Manual close
    const closeBtn = alert.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      });
    }
  }

  // ===== INITIALIZATION =====
  
  // Focus on first name input
  if (firstNameInput) {
    firstNameInput.focus();
  }

  console.log('Registration page initialized');
}); 