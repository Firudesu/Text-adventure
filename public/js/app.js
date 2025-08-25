// Main Application Logic
class GameReviewApp {
    constructor() {
        this.currentUser = null;
        this.currentProject = null;
        this.socket = null;
        this.currentPage = 'dashboard';
        
        this.init();
    }
    
    async init() {
        // Show loading screen
        this.showLoading(true);
        
        // Check if user is already authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const user = await API.verifyToken();
                this.setCurrentUser(user.user);
                this.setupApplication();
            } catch (error) {
                console.error('Token verification failed:', error);
                localStorage.removeItem('authToken');
                this.showAuthModal();
            }
        } else {
            this.showAuthModal();
        }
        
        this.showLoading(false);
    }
    
    showLoading(show) {
        const loadingScreen = document.getElementById('loading-screen');
        if (show) {
            loadingScreen.classList.remove('hidden');
        } else {
            loadingScreen.classList.add('hidden');
        }
    }
    
    showAuthModal() {
        document.getElementById('auth-modal').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
    
    hideAuthModal() {
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }
    
    setCurrentUser(user) {
        this.currentUser = user;
        document.getElementById('current-username').textContent = user.username;
        document.getElementById('current-role').textContent = user.role;
    }
    
    setupApplication() {
        this.hideAuthModal();
        this.initializeSocketConnection();
        this.loadDashboard();
        this.setupEventListeners();
        this.setupNavigation();
    }
    
    initializeSocketConnection() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.currentProject) {
                this.socket.emit('join-project', this.currentProject._id);
            }
        });
        
        this.socket.on('task-updated', (data) => {
            this.handleTaskUpdate(data);
        });
        
        this.socket.on('new-comment', (data) => {
            this.handleNewComment(data);
        });
        
        this.socket.on('file-uploaded', (data) => {
            this.handleFileUpload(data);
        });
    }
    
    setupEventListeners() {
        // Global search
        document.getElementById('global-search').addEventListener('input', (e) => {
            this.performGlobalSearch(e.target.value);
        });
        
        // Task filters
        const filters = ['status-filter', 'priority-filter', 'assignee-filter'];
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyTaskFilters();
                });
            }
        });
        
        // View toggles
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTaskView(e.target.dataset.view);
            });
        });
        
        // File upload
        const fileInput = document.getElementById('task-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
            });
        }
    }
    
    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page || e.target.closest('.nav-link').dataset.page;
                this.navigateToPage(page);
            });
        });
    }
    
    navigateToPage(page) {
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // Update page title
        const pageTitles = {
            dashboard: 'Dashboard',
            projects: 'Projects',
            tasks: 'Tasks',
            media: 'Media Gallery',
            team: 'Team Management'
        };
        document.getElementById('page-title').textContent = pageTitles[page] || 'Page';
        
        // Show/hide pages
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');
        
        this.currentPage = page;
        
        // Load page-specific data
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'tasks':
                this.loadTasks();
                break;
            case 'projects':
                this.loadProjects();
                break;
            case 'media':
                this.loadMedia();
                break;
            case 'team':
                this.loadTeam();
                break;
        }
    }
    
    async loadDashboard() {
        try {
            // Load dashboard stats
            // For now, we'll use mock data since we need a project first
            this.updateDashboardStats({
                total: 0,
                pending: 0,
                completed: 0,
                critical: 0
            });
            
            // Load recent tasks
            document.getElementById('recent-tasks-list').innerHTML = 
                '<p class="text-center text-secondary">No recent tasks. Create a project first!</p>';
            
            // Load active projects
            document.getElementById('active-projects-list').innerHTML = 
                '<p class="text-center text-secondary">No active projects. Create your first project!</p>';
                
        } catch (error) {
            console.error('Error loading dashboard:', error);
            UI.showToast('Error loading dashboard', 'error');
        }
    }
    
    updateDashboardStats(stats) {
        document.getElementById('total-tasks').textContent = stats.total || 0;
        document.getElementById('pending-tasks').textContent = stats.pending || 0;
        document.getElementById('completed-tasks').textContent = stats.completed || 0;
        document.getElementById('critical-tasks').textContent = stats.critical || 0;
    }
    
    async loadTasks() {
        if (!this.currentProject) {
            document.getElementById('task-table-body').innerHTML = 
                '<div class="text-center p-4">Please select a project first</div>';
            return;
        }
        
        try {
            const response = await API.getTasks(this.currentProject._id);
            TaskManager.renderTasks(response.tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            UI.showToast('Error loading tasks', 'error');
        }
    }
    
    loadProjects() {
        // Placeholder for projects page
        console.log('Loading projects...');
    }
    
    loadMedia() {
        // Placeholder for media page
        console.log('Loading media...');
    }
    
    loadTeam() {
        // Placeholder for team page
        console.log('Loading team...');
    }
    
    switchTaskView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        document.querySelectorAll('.task-view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        
        if (view === 'list') {
            document.getElementById('task-list-view').classList.add('active');
        } else if (view === 'kanban') {
            document.getElementById('kanban-view').classList.add('active');
        }
    }
    
    applyTaskFilters() {
        const filters = {
            status: document.getElementById('status-filter').value,
            priority: document.getElementById('priority-filter').value,
            assignee: document.getElementById('assignee-filter').value
        };
        
        TaskManager.applyFilters(filters);
    }
    
    performGlobalSearch(query) {
        if (query.length < 2) return;
        
        // Implement global search logic
        console.log('Searching for:', query);
    }
    
    handleTaskUpdate(data) {
        console.log('Task updated:', data);
        UI.showToast(`Task updated by ${data.updatedBy}`, 'info');
        
        if (this.currentPage === 'tasks') {
            this.loadTasks();
        }
        
        if (this.currentPage === 'dashboard') {
            this.loadDashboard();
        }
    }
    
    handleNewComment(data) {
        console.log('New comment:', data);
        UI.showToast(`New comment by ${data.author}`, 'info');
    }
    
    handleFileUpload(data) {
        console.log('File uploaded:', data);
        UI.showToast('File uploaded successfully', 'success');
    }
    
    async handleFileSelection(files) {
        if (!files.length) return;
        
        try {
            UI.showToast('Uploading files...', 'info');
            
            for (const file of files) {
                await API.uploadFile(file, this.currentProject._id);
            }
            
            UI.showToast('Files uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading files:', error);
            UI.showToast('Error uploading files', 'error');
        }
    }
}

// Global functions
function logout() {
    localStorage.removeItem('authToken');
    location.reload();
}

function showCreateTaskModal() {
    UI.showCreateTaskModal();
}

function closeCreateTaskModal() {
    UI.hideCreateTaskModal();
}

function showTaskDetail(taskId) {
    TaskManager.showTaskDetail(taskId);
}

function closeTaskModal() {
    TaskManager.closeTaskModal();
}

function closeAuthModal() {
    // Only allow closing if authenticated
    if (app.currentUser) {
        app.hideAuthModal();
    }
}

function toggleAuthMode() {
    Auth.toggleMode();
}

function showAnnotationModal(imageUrl, fileId) {
    AnnotationEditor.open(imageUrl, fileId);
}

function closeAnnotationModal() {
    AnnotationEditor.close();
}

function clearAnnotations() {
    AnnotationEditor.clearAll();
}

function saveAnnotations() {
    AnnotationEditor.save();
}

function addComment() {
    TaskManager.addComment();
}

// Initialize app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GameReviewApp();
});