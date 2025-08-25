// Authentication Management
class AuthManager {
    constructor() {
        this.isLoginMode = true;
        this.setupAuthForm();
    }
    
    setupAuthForm() {
        const form = document.getElementById('auth-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }
    
    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.updateAuthModal();
    }
    
    updateAuthModal() {
        const title = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit');
        const switchText = document.getElementById('auth-switch-text');
        const switchLink = document.getElementById('auth-switch-link');
        const usernameGroup = document.getElementById('username-group');
        const roleGroup = document.getElementById('role-group');
        
        if (this.isLoginMode) {
            title.textContent = 'Sign In';
            submitBtn.textContent = 'Sign In';
            switchText.textContent = "Don't have an account?";
            switchLink.textContent = 'Sign Up';
            usernameGroup.style.display = 'none';
            roleGroup.style.display = 'none';
            
            // Clear required attributes for hidden fields
            document.getElementById('username').removeAttribute('required');
        } else {
            title.textContent = 'Sign Up';
            submitBtn.textContent = 'Sign Up';
            switchText.textContent = 'Already have an account?';
            switchLink.textContent = 'Sign In';
            usernameGroup.style.display = 'block';
            roleGroup.style.display = 'block';
            
            // Add required attributes for visible fields
            document.getElementById('username').setAttribute('required', 'required');
        }
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        const submitBtn = document.getElementById('auth-submit');
        const originalText = submitBtn.textContent;
        
        try {
            // Show loading state
            submitBtn.textContent = this.isLoginMode ? 'Signing In...' : 'Signing Up...';
            submitBtn.disabled = true;
            
            let response;
            if (this.isLoginMode) {
                response = await API.login(data.email, data.password);
            } else {
                response = await API.register({
                    username: data.username,
                    email: data.email,
                    password: data.password,
                    role: data.role
                });
            }
            
            // Success
            UI.showToast(response.message || 'Authentication successful', 'success');
            app.setCurrentUser(response.user);
            app.setupApplication();
            
        } catch (error) {
            console.error('Authentication error:', error);
            UI.showToast(error.message || 'Authentication failed', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    logout() {
        localStorage.removeItem('authToken');
        app.currentUser = null;
        app.showAuthModal();
        
        if (app.socket) {
            app.socket.disconnect();
        }
        
        UI.showToast('Logged out successfully', 'info');
    }
    
    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Validate password strength
    isValidPassword(password) {
        return password.length >= 6;
    }
    
    // Validate username
    isValidUsername(username) {
        return username && username.length >= 3 && username.length <= 30;
    }
    
    // Form validation
    validateForm(data) {
        const errors = [];
        
        if (!this.isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!this.isValidPassword(data.password)) {
            errors.push('Password must be at least 6 characters long');
        }
        
        if (!this.isLoginMode) {
            if (!this.isValidUsername(data.username)) {
                errors.push('Username must be between 3 and 30 characters');
            }
            
            if (!data.role) {
                errors.push('Please select a role');
            }
        }
        
        return errors;
    }
    
    // Show validation errors
    showValidationErrors(errors) {
        errors.forEach(error => {
            UI.showToast(error, 'error');
        });
    }
    
    // Auto-fill demo credentials (for testing)
    fillDemoCredentials() {
        document.getElementById('email').value = 'demo@gamedev.com';
        document.getElementById('password').value = 'demo123';
        
        if (!this.isLoginMode) {
            document.getElementById('username').value = 'demouser';
            document.getElementById('role').value = 'reviewer';
        }
    }
}

// Create global Auth instance
const Auth = new AuthManager();