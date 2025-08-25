// Task Management
class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentTask = null;
        this.currentFilters = {};
    }
    
    // Render tasks in list view
    renderTasks(tasks) {
        this.tasks = tasks;
        this.applyCurrentFilters();
        this.renderTaskList();
        this.renderKanbanBoard();
    }
    
    renderTaskList() {
        const tableBody = document.getElementById('task-table-body');
        if (!tableBody) return;
        
        if (this.filteredTasks.length === 0) {
            UI.showEmptyState(tableBody, 'No tasks found. Create your first task!', 'Create Task', () => {
                UI.showCreateTaskModal();
            });
            return;
        }
        
        tableBody.innerHTML = this.filteredTasks.map(task => `
            <div class="task-row" onclick="showTaskDetail('${task._id}')" data-task-id="${task._id}">
                <div class="task-cell task-title">
                    <div class="task-title-text">${UI.escapeHtml(task.title)}</div>
                    <div class="task-description-preview">${UI.truncateText(task.description || '', 60)}</div>
                </div>
                <div class="task-cell task-status">
                    <span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span>
                </div>
                <div class="task-cell task-priority">
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                </div>
                <div class="task-cell task-assignee">
                    ${task.assignee ? `
                        <div class="assignee-info">
                            <div class="assignee-avatar">
                                ${task.assignee.username.charAt(0).toUpperCase()}
                            </div>
                            <span>${task.assignee.username}</span>
                        </div>
                    ` : '<span class="text-secondary">Unassigned</span>'}
                </div>
                <div class="task-cell task-created">
                    <span title="${UI.formatDate(task.createdAt)}">
                        ${UI.getTimeAgo(task.createdAt)}
                    </span>
                </div>
                <div class="task-cell task-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); this.showTaskActions('${task._id}')" title="More actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderKanbanBoard() {
        const statuses = ['open', 'in-progress', 'needs-review', 'resolved'];
        
        statuses.forEach(status => {
            const container = document.getElementById(`kanban-${status}`);
            if (!container) return;
            
            const statusTasks = this.filteredTasks.filter(task => task.status === status);
            const countElement = container.parentElement.querySelector('.task-count');
            if (countElement) {
                countElement.textContent = statusTasks.length;
            }
            
            container.innerHTML = statusTasks.map(task => `
                <div class="kanban-task" onclick="showTaskDetail('${task._id}')" data-task-id="${task._id}">
                    <div class="kanban-task-title">${UI.escapeHtml(task.title)}</div>
                    <div class="kanban-task-meta">
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span class="task-id">#${task._id.slice(-6)}</span>
                    </div>
                    ${task.assignee ? `
                        <div class="kanban-task-assignee">
                            <div class="assignee-avatar small">
                                ${task.assignee.username.charAt(0).toUpperCase()}
                            </div>
                            <span>${task.assignee.username}</span>
                        </div>
                    ` : ''}
                    ${task.attachments && task.attachments.length > 0 ? `
                        <div class="kanban-task-attachments">
                            <i class="fas fa-paperclip"></i>
                            <span>${task.attachments.length}</span>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        });
    }
    
    // Apply filters
    applyFilters(filters) {
        this.currentFilters = filters;
        this.applyCurrentFilters();
        this.renderTaskList();
        this.renderKanbanBoard();
    }
    
    applyCurrentFilters() {
        this.filteredTasks = this.tasks.filter(task => {
            if (this.currentFilters.status && task.status !== this.currentFilters.status) {
                return false;
            }
            if (this.currentFilters.priority && task.priority !== this.currentFilters.priority) {
                return false;
            }
            if (this.currentFilters.assignee && task.assignee?._id !== this.currentFilters.assignee) {
                return false;
            }
            return true;
        });
    }
    
    // Show task detail modal
    async showTaskDetail(taskId) {
        try {
            UI.showLoading('task-modal', 'Loading task details...');
            UI.showModal('task-modal');
            
            const response = await API.getTask(taskId);
            this.currentTask = response.task;
            this.renderTaskDetail();
            
        } catch (error) {
            console.error('Error loading task:', error);
            UI.showToast('Error loading task details', 'error');
            UI.hideModal('task-modal');
        }
    }
    
    renderTaskDetail() {
        if (!this.currentTask) return;
        
        const task = this.currentTask;
        
        // Update modal title
        document.getElementById('task-modal-title').textContent = `Task #${task._id.slice(-6)}`;
        
        // Update task header
        document.getElementById('task-detail-title').textContent = task.title;
        document.getElementById('task-detail-status').textContent = task.status.replace('-', ' ');
        document.getElementById('task-detail-status').className = `status-badge ${task.status}`;
        document.getElementById('task-detail-priority').textContent = task.priority;
        document.getElementById('task-detail-priority').className = `priority-badge ${task.priority}`;
        
        // Update description
        document.getElementById('task-detail-description').textContent = task.description || 'No description provided.';
        
        // Update attachments
        this.renderTaskAttachments();
        
        // Update task info sidebar
        this.renderTaskInfo();
        
        // Update timeline
        this.renderTaskTimeline();
        
        // Update comments
        this.renderTaskComments();
        
        // Setup form handlers
        this.setupTaskDetailHandlers();
    }
    
    renderTaskAttachments() {
        const container = document.getElementById('task-detail-attachments');
        if (!container) return;
        
        if (!this.currentTask.attachments || this.currentTask.attachments.length === 0) {
            container.innerHTML = '<p class="text-secondary">No attachments yet.</p>';
            return;
        }
        
        container.innerHTML = this.currentTask.attachments.map(file => {
            const isImage = file.mimeType.startsWith('image/');
            const isVideo = file.mimeType.startsWith('video/');
            
            return `
                <div class="attachment-item" data-file-id="${file._id}">
                    ${isImage ? `
                        <img src="${file.url}" alt="${file.originalName}" 
                             onclick="showAnnotationModal('${file.url}', '${file._id}')">
                    ` : isVideo ? `
                        <video src="${file.url}" controls></video>
                    ` : `
                        <div class="file-icon">
                            <i class="fas fa-file"></i>
                        </div>
                    `}
                    <div class="attachment-info">
                        <div class="attachment-name">${UI.truncateText(file.originalName, 20)}</div>
                        <div class="attachment-size">${UI.formatFileSize(file.size)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderTaskInfo() {
        // Load assignee options
        this.loadTaskAssigneeOptions();
        
        // Set current values
        const assigneeSelect = document.getElementById('task-assignee-select');
        const statusSelect = document.getElementById('task-status-select');
        const prioritySelect = document.getElementById('task-priority-select');
        
        if (assigneeSelect) {
            assigneeSelect.value = this.currentTask.assignee?._id || '';
        }
        if (statusSelect) {
            statusSelect.value = this.currentTask.status;
        }
        if (prioritySelect) {
            prioritySelect.value = this.currentTask.priority;
        }
    }
    
    async loadTaskAssigneeOptions() {
        try {
            const response = await API.getAvailableUsers(this.currentTask.project._id);
            const select = document.getElementById('task-assignee-select');
            
            select.innerHTML = '<option value="">Unassigned</option>';
            response.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id;
                option.textContent = `${user.username} (${user.role})`;
                if (this.currentTask.assignee && user._id === this.currentTask.assignee._id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    renderTaskTimeline() {
        const container = document.getElementById('task-timeline-list');
        if (!container || !this.currentTask.timeline) return;
        
        container.innerHTML = this.currentTask.timeline.map(entry => `
            <div class="timeline-item">
                <div class="timeline-content">
                    <strong>${entry.user?.username || 'System'}</strong> ${this.getTimelineActionText(entry)}
                    <div class="timeline-meta">${UI.getTimeAgo(entry.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }
    
    getTimelineActionText(entry) {
        switch (entry.action) {
            case 'created':
                return 'created this task';
            case 'assigned':
                return 'was assigned to this task';
            case 'status_changed':
                return `changed status from "${entry.oldValue}" to "${entry.newValue}"`;
            case 'priority_changed':
                return `changed priority from "${entry.oldValue}" to "${entry.newValue}"`;
            case 'commented':
                return 'added a comment';
            case 'resolved':
                return 'marked this task as resolved';
            case 'reopened':
                return 'reopened this task';
            default:
                return entry.action;
        }
    }
    
    renderTaskComments() {
        const container = document.getElementById('task-comments-list');
        if (!container) return;
        
        if (!this.currentTask.comments || this.currentTask.comments.length === 0) {
            container.innerHTML = '<p class="text-secondary">No comments yet. Be the first to comment!</p>';
            return;
        }
        
        container.innerHTML = this.currentTask.comments.map(comment => `
            <div class="comment-item">
                <div class="comment-avatar">
                    ${comment.author.username.charAt(0).toUpperCase()}
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author.username}</span>
                        <span class="comment-time">${UI.getTimeAgo(comment.createdAt)}</span>
                    </div>
                    <div class="comment-text">${UI.escapeHtml(comment.content)}</div>
                    ${comment.isResolution ? '<div class="comment-resolution">✓ This comment marks the task as resolved</div>' : ''}
                </div>
            </div>
        `).join('');
    }
    
    setupTaskDetailHandlers() {
        // Assignee change
        const assigneeSelect = document.getElementById('task-assignee-select');
        if (assigneeSelect) {
            assigneeSelect.onchange = () => this.updateTaskField('assignee', assigneeSelect.value);
        }
        
        // Status change
        const statusSelect = document.getElementById('task-status-select');
        if (statusSelect) {
            statusSelect.onchange = () => this.updateTaskField('status', statusSelect.value);
        }
        
        // Priority change
        const prioritySelect = document.getElementById('task-priority-select');
        if (prioritySelect) {
            prioritySelect.onchange = () => this.updateTaskField('priority', prioritySelect.value);
        }
        
        // File upload
        const fileInput = document.getElementById('task-file-input');
        if (fileInput) {
            fileInput.onchange = (e) => this.handleTaskFileUpload(e.target.files);
        }
    }
    
    async updateTaskField(field, value) {
        try {
            const updateData = { [field]: value };
            await API.updateTask(this.currentTask._id, updateData);
            
            // Update local task object
            this.currentTask[field] = value;
            
            UI.showToast('Task updated successfully', 'success');
            
            // Refresh task list if visible
            if (app.currentPage === 'tasks') {
                app.loadTasks();
            }
            
        } catch (error) {
            console.error('Error updating task:', error);
            UI.showToast('Error updating task', 'error');
        }
    }
    
    async handleTaskFileUpload(files) {
        if (!files.length) return;
        
        try {
            UI.showToast('Uploading files...', 'info');
            
            for (const file of files) {
                await API.uploadFile(file, this.currentTask.project._id, this.currentTask._id);
            }
            
            UI.showToast('Files uploaded successfully', 'success');
            
            // Refresh task details
            this.showTaskDetail(this.currentTask._id);
            
        } catch (error) {
            console.error('Error uploading files:', error);
            UI.showToast('Error uploading files', 'error');
        }
    }
    
    async addComment() {
        const textarea = document.getElementById('new-comment');
        const content = textarea.value.trim();
        
        if (!content) {
            UI.showToast('Please enter a comment', 'warning');
            return;
        }
        
        try {
            await API.addComment(this.currentTask._id, { content });
            
            textarea.value = '';
            UI.showToast('Comment added successfully', 'success');
            
            // Refresh task details
            this.showTaskDetail(this.currentTask._id);
            
        } catch (error) {
            console.error('Error adding comment:', error);
            UI.showToast('Error adding comment', 'error');
        }
    }
    
    closeTaskModal() {
        UI.hideModal('task-modal');
        this.currentTask = null;
    }
    
    // Task actions
    async deleteTask(taskId) {
        const confirmed = await UI.showConfirm(
            'Delete Task',
            'Are you sure you want to delete this task? This action cannot be undone.',
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        try {
            await API.deleteTask(taskId);
            UI.showToast('Task deleted successfully', 'success');
            
            // Close modal if this task is open
            if (this.currentTask && this.currentTask._id === taskId) {
                this.closeTaskModal();
            }
            
            // Refresh task list
            if (app.currentPage === 'tasks') {
                app.loadTasks();
            }
            
        } catch (error) {
            console.error('Error deleting task:', error);
            UI.showToast('Error deleting task', 'error');
        }
    }
    
    showTaskActions(taskId) {
        // Implement context menu for task actions
        console.log('Show task actions for:', taskId);
    }
}

// Additional CSS for task-specific styling
const taskCSS = `
.task-description-preview {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
}

.assignee-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.assignee-avatar {
    width: 24px;
    height: 24px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: 600;
}

.assignee-avatar.small {
    width: 20px;
    height: 20px;
    font-size: 8px;
}

.btn-icon {
    background: none;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: var(--border-radius);
    color: var(--text-secondary);
    transition: all 0.2s;
}

.btn-icon:hover {
    background: var(--background-color);
    color: var(--text-primary);
}

.kanban-task-assignee {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 12px;
}

.kanban-task-attachments {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-secondary);
}

.attachment-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.2s;
}

.attachment-item:hover .attachment-info {
    opacity: 1;
}

.attachment-name {
    font-weight: 500;
}

.attachment-size {
    opacity: 0.8;
}

.comment-resolution {
    margin-top: 8px;
    padding: 8px;
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
    border-radius: var(--border-radius);
    font-size: 12px;
    font-weight: 500;
}

.text-secondary {
    color: var(--text-secondary);
}

.text-center {
    text-align: center;
}

.p-4 {
    padding: 24px;
}
`;

// Inject task-specific CSS
const taskStyleElement = document.createElement('style');
taskStyleElement.textContent = taskCSS;
document.head.appendChild(taskStyleElement);

// Create global TaskManager instance
const TaskManager = new TaskManager();