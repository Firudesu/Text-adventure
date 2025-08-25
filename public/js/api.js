// API Client for Game Review System
class APIClient {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('authToken');
    }
    
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }
    
    // Authentication
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('authToken', response.token);
        }
        
        return response;
    }
    
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('authToken', response.token);
        }
        
        return response;
    }
    
    async verifyToken() {
        return await this.request('/auth/verify');
    }
    
    async getProfile() {
        return await this.request('/auth/profile');
    }
    
    async updateProfile(userData) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
    
    async changePassword(currentPassword, newPassword) {
        return await this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }
    
    // Tasks
    async getTasks(projectId, filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/tasks/project/${projectId}${queryParams ? '?' + queryParams : ''}`;
        return await this.request(endpoint);
    }
    
    async getTask(taskId) {
        return await this.request(`/tasks/${taskId}`);
    }
    
    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }
    
    async updateTask(taskId, taskData) {
        return await this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }
    
    async deleteTask(taskId) {
        return await this.request(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }
    
    async addComment(taskId, commentData) {
        return await this.request(`/tasks/${taskId}/comments`, {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }
    
    async getTaskStats(projectId) {
        return await this.request(`/tasks/project/${projectId}/stats`);
    }
    
    // File Upload
    async uploadFile(file, projectId, taskId = null) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        if (taskId) {
            formData.append('taskId', taskId);
        }
        
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(`${this.baseURL}/upload/file`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        
        return await response.json();
    }
    
    async uploadFiles(files, projectId, taskId = null) {
        const formData = new FormData();
        
        for (const file of files) {
            formData.append('files', file);
        }
        
        formData.append('projectId', projectId);
        if (taskId) {
            formData.append('taskId', taskId);
        }
        
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(`${this.baseURL}/upload/files`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        
        return await response.json();
    }
    
    async getFiles(projectId, filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/upload/project/${projectId}${queryParams ? '?' + queryParams : ''}`;
        return await this.request(endpoint);
    }
    
    async getFile(fileId) {
        return await this.request(`/upload/file/${fileId}`);
    }
    
    async deleteFile(fileId) {
        return await this.request(`/upload/file/${fileId}`, {
            method: 'DELETE'
        });
    }
    
    async addAnnotation(fileId, annotationData) {
        return await this.request(`/upload/file/${fileId}/annotations`, {
            method: 'POST',
            body: JSON.stringify(annotationData)
        });
    }
    
    // Users
    async getUsers(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/users${queryParams ? '?' + queryParams : ''}`;
        return await this.request(endpoint);
    }
    
    async getAvailableUsers(projectId, search = '') {
        const queryParams = new URLSearchParams({ search }).toString();
        const endpoint = `/users/project/${projectId}/available${queryParams ? '?' + queryParams : ''}`;
        return await this.request(endpoint);
    }
    
    async getUser(userId) {
        return await this.request(`/users/${userId}`);
    }
    
    async updateUser(userId, userData) {
        return await this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
    
    async getUserStats() {
        return await this.request('/users/stats/overview');
    }
    
    // Projects (placeholder - will be implemented when project routes are added)
    async getProjects(filters = {}) {
        // Mock implementation for now
        return {
            projects: [
                {
                    _id: 'mock-project-1',
                    name: 'Sample Game Project',
                    description: 'A sample project for testing',
                    status: 'active',
                    owner: this.currentUser,
                    team: []
                }
            ],
            pagination: { page: 1, pages: 1, total: 1, limit: 20 }
        };
    }
    
    async getProject(projectId) {
        // Mock implementation
        return {
            project: {
                _id: projectId,
                name: 'Sample Game Project',
                description: 'A sample project for testing',
                status: 'active',
                owner: this.currentUser,
                team: []
            }
        };
    }
    
    async createProject(projectData) {
        // Mock implementation
        const project = {
            _id: 'new-project-' + Date.now(),
            ...projectData,
            owner: this.currentUser,
            team: [],
            createdAt: new Date().toISOString()
        };
        
        return { message: 'Project created successfully', project };
    }
}

// Create global API instance
const API = new APIClient();