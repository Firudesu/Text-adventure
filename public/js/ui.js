// UI Helper Functions and Components
class UIManager {
    constructor() {
        this.toastContainer = document.getElementById('toast-container');
        this.activeModals = new Set();
    }
    
    // Toast Notifications
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                this.removeToast(toast);
            }
        }, duration);
        
        return toast;
    }
    
    getToastIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>',
            error: '<i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>',
            warning: '<i class="fas fa-exclamation-triangle" style="color: var(--warning-color);"></i>',
            info: '<i class="fas fa-info-circle" style="color: var(--primary-color);"></i>'
        };
        return icons[type] || icons.info;
    }
    
    removeToast(toast) {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }
    
    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.activeModals.add(modalId);
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            this.activeModals.delete(modalId);
            
            if (this.activeModals.size === 0) {
                document.body.style.overflow = '';
            }
        }
    }
    
    hideAllModals() {
        this.activeModals.forEach(modalId => {
            this.hideModal(modalId);
        });
    }
    
    // Create Task Modal
    showCreateTaskModal() {
        this.showModal('create-task-modal');
        this.setupCreateTaskForm();
    }
    
    hideCreateTaskModal() {
        this.hideModal('create-task-modal');
        this.resetCreateTaskForm();
    }
    
    setupCreateTaskForm() {
        const form = document.getElementById('create-task-form');
        
        // Remove existing listener
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateTaskSubmit(e);
        });
        
        // Load assignee options
        this.loadAssigneeOptions();
    }
    
    async loadAssigneeOptions() {
        if (!app.currentProject) return;
        
        try {
            const response = await API.getAvailableUsers(app.currentProject._id);
            const select = document.getElementById('new-task-assignee');
            
            // Clear existing options except "Unassigned"
            select.innerHTML = '<option value="">Unassigned</option>';
            
            response.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id;
                option.textContent = `${user.username} (${user.role})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    async handleCreateTaskSubmit(event) {
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        // Add current project
        if (!app.currentProject) {
            this.showToast('Please select a project first', 'error');
            return;
        }
        
        data.project = app.currentProject._id;
        
        // Process tags
        if (data.tags) {
            data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        try {
            const response = await API.createTask(data);
            this.showToast('Task created successfully', 'success');
            this.hideCreateTaskModal();
            
            // Refresh tasks if on tasks page
            if (app.currentPage === 'tasks') {
                app.loadTasks();
            }
            
            // Refresh dashboard if on dashboard
            if (app.currentPage === 'dashboard') {
                app.loadDashboard();
            }
            
        } catch (error) {
            console.error('Error creating task:', error);
            this.showToast(error.message || 'Error creating task', 'error');
        }
    }
    
    resetCreateTaskForm() {
        const form = document.getElementById('create-task-form');
        if (form) {
            form.reset();
        }
    }
    
    // Loading States
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner small"></div>
                    <span>${text}</span>
                </div>
            `;
        }
    }
    
    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            const loadingState = element.querySelector('.loading-state');
            if (loadingState) {
                loadingState.remove();
            }
        }
    }
    
    // Empty States
    showEmptyState(element, message, actionText = null, actionCallback = null) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            let actionButton = '';
            if (actionText && actionCallback) {
                const actionId = 'action-' + Math.random().toString(36).substr(2, 9);
                actionButton = `<button id="${actionId}" class="btn btn-primary">${actionText}</button>`;
                
                setTimeout(() => {
                    const button = document.getElementById(actionId);
                    if (button) {
                        button.addEventListener('click', actionCallback);
                    }
                }, 0);
            }
            
            element.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <h3>Nothing here yet</h3>
                    <p>${message}</p>
                    ${actionButton}
                </div>
            `;
        }
    }
    
    // Confirm Dialog
    async showConfirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline cancel-btn">${cancelText}</button>
                        <button class="btn btn-danger confirm-btn">${confirmText}</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            
            const cleanup = () => {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
            };
            
            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }
    
    // Form Helpers
    getFormData(formElement) {
        const formData = new FormData(formElement);
        return Object.fromEntries(formData.entries());
    }
    
    setFormData(formElement, data) {
        Object.keys(data).forEach(key => {
            const input = formElement.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = data[key];
                } else {
                    input.value = data[key] || '';
                }
            }
        });
    }
    
    // Format Helpers
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Date(date).toLocaleDateString('en-US', {
            ...defaultOptions,
            ...options
        });
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Truncate text
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

// Add CSS for loading state and empty state
const additionalCSS = `
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--text-secondary);
}

.loading-spinner.small {
    width: 24px;
    height: 24px;
    border-width: 2px;
    margin-bottom: 12px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--text-secondary);
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 20px;
    opacity: 0.5;
}

.empty-state h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.empty-state p {
    margin-bottom: 20px;
    max-width: 400px;
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.toast {
    position: relative;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 16px;
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 320px;
    animation: slideIn 0.3s ease-out;
}

.toast-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--text-secondary);
    border-radius: 4px;
    transition: all 0.2s;
}

.toast-close:hover {
    background: var(--background-color);
    color: var(--text-primary);
}
`;

// Inject additional CSS
const styleElement = document.createElement('style');
styleElement.textContent = additionalCSS;
document.head.appendChild(styleElement);

// Create global UI instance
const UI = new UIManager();