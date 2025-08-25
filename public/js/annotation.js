// Image Annotation Editor
class AnnotationEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.annotations = [];
        this.currentAnnotation = null;
        this.selectedAnnotation = null;
        this.fileId = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.setupTools();
    }
    
    setupTools() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.target.dataset.tool || e.target.closest('.tool-btn').dataset.tool);
            });
        });
        
        // Color picker
        const colorPicker = document.getElementById('annotation-color');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.currentColor = e.target.value;
            });
        }
        
        // Stroke width
        const strokeWidth = document.getElementById('stroke-width');
        if (strokeWidth) {
            strokeWidth.addEventListener('input', (e) => {
                this.currentStrokeWidth = parseInt(e.target.value);
            });
        }
        
        // Initialize default values
        this.currentColor = '#ff0000';
        this.currentStrokeWidth = 2;
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor
        if (this.canvas) {
            switch (tool) {
                case 'select':
                    this.canvas.style.cursor = 'default';
                    break;
                case 'text':
                    this.canvas.style.cursor = 'text';
                    break;
                default:
                    this.canvas.style.cursor = 'crosshair';
                    break;
            }
        }
    }
    
    open(imageUrl, fileId) {
        this.fileId = fileId;
        
        // Show modal
        UI.showModal('annotation-modal');
        
        // Load image
        this.loadImage(imageUrl);
        
        // Load existing annotations
        this.loadAnnotations();
    }
    
    async loadImage(imageUrl) {
        const img = document.getElementById('annotation-image');
        const canvas = document.getElementById('annotation-canvas');
        
        if (!img || !canvas) return;
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Load image
        return new Promise((resolve) => {
            img.onload = () => {
                this.image = img;
                this.setupCanvas();
                this.redraw();
                resolve();
            };
            img.src = imageUrl;
        });
    }
    
    setupCanvas() {
        if (!this.image || !this.canvas) return;
        
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate scale to fit image in container
        const scaleX = containerWidth / this.image.naturalWidth;
        const scaleY = containerHeight / this.image.naturalHeight;
        this.scale = Math.min(scaleX, scaleY, 1); // Don't scale up
        
        // Set canvas size
        this.canvas.width = this.image.naturalWidth * this.scale;
        this.canvas.height = this.image.naturalHeight * this.scale;
        
        // Center the canvas
        this.canvas.style.left = `${(containerWidth - this.canvas.width) / 2}px`;
        this.canvas.style.top = `${(containerHeight - this.canvas.height) / 2}px`;
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (!this.canvas) return;
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.scale,
            y: (e.clientY - rect.top) / this.scale
        };
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;
        this.isDrawing = true;
        
        if (this.currentTool === 'select') {
            this.selectAnnotationAt(pos.x, pos.y);
        } else if (this.currentTool === 'freehand') {
            this.startFreehandDrawing(pos.x, pos.y);
        } else if (this.currentTool !== 'text') {
            this.startAnnotation(pos.x, pos.y);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        if (this.currentTool === 'freehand' && this.currentAnnotation) {
            this.addFreehandPoint(pos.x, pos.y);
            this.redraw();
        } else if (this.currentAnnotation) {
            this.updateCurrentAnnotation(pos.x, pos.y);
            this.redraw();
        }
    }
    
    handleMouseUp(e) {
        this.isDrawing = false;
        
        if (this.currentAnnotation) {
            this.finalizeAnnotation();
        }
    }
    
    handleClick(e) {
        const pos = this.getMousePos(e);
        
        if (this.currentTool === 'text') {
            this.addTextAnnotation(pos.x, pos.y);
        }
    }
    
    startAnnotation(x, y) {
        this.currentAnnotation = {
            type: this.currentTool,
            coordinates: { x, y },
            style: {
                color: this.currentColor,
                strokeWidth: this.currentStrokeWidth
            },
            temporary: true
        };
        
        if (this.currentTool === 'rectangle' || this.currentTool === 'circle') {
            this.currentAnnotation.coordinates.width = 0;
            this.currentAnnotation.coordinates.height = 0;
        }
    }
    
    updateCurrentAnnotation(x, y) {
        if (!this.currentAnnotation) return;
        
        switch (this.currentAnnotation.type) {
            case 'rectangle':
                this.currentAnnotation.coordinates.width = x - this.currentAnnotation.coordinates.x;
                this.currentAnnotation.coordinates.height = y - this.currentAnnotation.coordinates.y;
                break;
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(x - this.currentAnnotation.coordinates.x, 2) +
                    Math.pow(y - this.currentAnnotation.coordinates.y, 2)
                );
                this.currentAnnotation.coordinates.width = radius * 2;
                this.currentAnnotation.coordinates.height = radius * 2;
                break;
            case 'arrow':
                this.currentAnnotation.coordinates.endX = x;
                this.currentAnnotation.coordinates.endY = y;
                break;
        }
    }
    
    startFreehandDrawing(x, y) {
        this.currentAnnotation = {
            type: 'freehand',
            coordinates: {
                points: [{ x, y }]
            },
            style: {
                color: this.currentColor,
                strokeWidth: this.currentStrokeWidth
            },
            temporary: true
        };
    }
    
    addFreehandPoint(x, y) {
        if (this.currentAnnotation && this.currentAnnotation.type === 'freehand') {
            this.currentAnnotation.coordinates.points.push({ x, y });
        }
    }
    
    async addTextAnnotation(x, y) {
        const text = prompt('Enter text for annotation:');
        if (!text) return;
        
        const annotation = {
            type: 'text',
            coordinates: { x, y },
            text: text,
            style: {
                color: this.currentColor,
                fontSize: 16
            }
        };
        
        this.annotations.push(annotation);
        this.redraw();
        
        // Save to server
        await this.saveAnnotationToServer(annotation);
    }
    
    finalizeAnnotation() {
        if (!this.currentAnnotation) return;
        
        // Remove temporary flag
        delete this.currentAnnotation.temporary;
        
        // Add to annotations list
        this.annotations.push(this.currentAnnotation);
        this.currentAnnotation = null;
        
        // Save to server
        this.saveAnnotationToServer(this.annotations[this.annotations.length - 1]);
    }
    
    async saveAnnotationToServer(annotation) {
        if (!this.fileId) return;
        
        try {
            await API.addAnnotation(this.fileId, annotation);
            UI.showToast('Annotation saved', 'success');
        } catch (error) {
            console.error('Error saving annotation:', error);
            UI.showToast('Error saving annotation', 'error');
        }
    }
    
    async loadAnnotations() {
        if (!this.fileId) return;
        
        try {
            const response = await API.getFile(this.fileId);
            this.annotations = response.file.annotations || [];
            this.redraw();
        } catch (error) {
            console.error('Error loading annotations:', error);
        }
    }
    
    selectAnnotationAt(x, y) {
        this.selectedAnnotation = null;
        
        // Check each annotation for hit test
        for (let i = this.annotations.length - 1; i >= 0; i--) {
            const annotation = this.annotations[i];
            if (this.hitTest(annotation, x, y)) {
                this.selectedAnnotation = annotation;
                break;
            }
        }
        
        this.redraw();
    }
    
    hitTest(annotation, x, y) {
        const coords = annotation.coordinates;
        const margin = 5; // Hit test margin
        
        switch (annotation.type) {
            case 'rectangle':
                return x >= coords.x - margin && x <= coords.x + coords.width + margin &&
                       y >= coords.y - margin && y <= coords.y + coords.height + margin;
            case 'circle':
                const centerX = coords.x + coords.width / 2;
                const centerY = coords.y + coords.height / 2;
                const radius = coords.width / 2;
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                return distance <= radius + margin;
            case 'text':
                // Simple bounding box for text
                return x >= coords.x - margin && x <= coords.x + 100 + margin &&
                       y >= coords.y - 20 - margin && y <= coords.y + margin;
            case 'freehand':
                // Check if point is near any line segment
                for (let i = 0; i < coords.points.length - 1; i++) {
                    const p1 = coords.points[i];
                    const p2 = coords.points[i + 1];
                    if (this.distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y) <= margin) {
                        return true;
                    }
                }
                return false;
            case 'arrow':
                // Check if point is near the arrow line
                return this.distanceToLineSegment(x, y, coords.x, coords.y, coords.endX, coords.endY) <= margin;
            default:
                return false;
        }
    }
    
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        
        if (param < 0) {
            return Math.sqrt(A * A + B * B);
        } else if (param > 1) {
            const dx = px - x2;
            const dy = py - y2;
            return Math.sqrt(dx * dx + dy * dy);
        } else {
            const dx = px - (x1 + param * C);
            const dy = py - (y1 + param * D);
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
    
    redraw() {
        if (!this.ctx || !this.image) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw image
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        
        // Draw annotations
        this.annotations.forEach(annotation => {
            this.drawAnnotation(annotation);
        });
        
        // Draw current annotation (while drawing)
        if (this.currentAnnotation) {
            this.drawAnnotation(this.currentAnnotation);
        }
    }
    
    drawAnnotation(annotation) {
        const coords = annotation.coordinates;
        const style = annotation.style;
        
        this.ctx.save();
        
        // Scale coordinates
        const scaleCoords = (value) => value * this.scale;
        
        // Set style
        this.ctx.strokeStyle = style.color || '#ff0000';
        this.ctx.lineWidth = (style.strokeWidth || 2) * this.scale;
        this.ctx.fillStyle = style.fillColor || 'transparent';
        
        // Draw selection highlight
        if (annotation === this.selectedAnnotation) {
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 10 * this.scale;
        }
        
        switch (annotation.type) {
            case 'rectangle':
                this.ctx.strokeRect(
                    scaleCoords(coords.x),
                    scaleCoords(coords.y),
                    scaleCoords(coords.width),
                    scaleCoords(coords.height)
                );
                if (style.fillColor) {
                    this.ctx.fillRect(
                        scaleCoords(coords.x),
                        scaleCoords(coords.y),
                        scaleCoords(coords.width),
                        scaleCoords(coords.height)
                    );
                }
                break;
                
            case 'circle':
                const centerX = scaleCoords(coords.x + coords.width / 2);
                const centerY = scaleCoords(coords.y + coords.height / 2);
                const radius = scaleCoords(coords.width / 2);
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                if (style.fillColor) {
                    this.ctx.fill();
                }
                break;
                
            case 'arrow':
                this.drawArrow(
                    scaleCoords(coords.x),
                    scaleCoords(coords.y),
                    scaleCoords(coords.endX),
                    scaleCoords(coords.endY)
                );
                break;
                
            case 'freehand':
                if (coords.points && coords.points.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(scaleCoords(coords.points[0].x), scaleCoords(coords.points[0].y));
                    for (let i = 1; i < coords.points.length; i++) {
                        this.ctx.lineTo(scaleCoords(coords.points[i].x), scaleCoords(coords.points[i].y));
                    }
                    this.ctx.stroke();
                }
                break;
                
            case 'text':
                this.ctx.font = `${(style.fontSize || 16) * this.scale}px Arial`;
                this.ctx.fillStyle = style.color || '#ff0000';
                this.ctx.fillText(annotation.text || '', scaleCoords(coords.x), scaleCoords(coords.y));
                break;
        }
        
        this.ctx.restore();
    }
    
    drawArrow(fromX, fromY, toX, toY) {
        const headlen = 10 * this.scale; // Arrow head length
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();
        
        // Draw arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }
    
    clearAll() {
        this.annotations = [];
        this.selectedAnnotation = null;
        this.currentAnnotation = null;
        this.redraw();
    }
    
    async save() {
        try {
            UI.showToast('Saving annotations...', 'info');
            
            // All annotations are already saved individually
            // This could export the annotated image or perform batch operations
            
            UI.showToast('Annotations saved successfully', 'success');
            this.close();
            
        } catch (error) {
            console.error('Error saving annotations:', error);
            UI.showToast('Error saving annotations', 'error');
        }
    }
    
    close() {
        UI.hideModal('annotation-modal');
        this.annotations = [];
        this.selectedAnnotation = null;
        this.currentAnnotation = null;
        this.fileId = null;
        
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('click', this.handleClick);
        }
    }
    
    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!UI.activeModals.has('annotation-modal')) return;
            
            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'Delete':
                case 'Backspace':
                    if (this.selectedAnnotation) {
                        this.deleteSelectedAnnotation();
                    }
                    break;
                case '1':
                    this.selectTool('select');
                    break;
                case '2':
                    this.selectTool('rectangle');
                    break;
                case '3':
                    this.selectTool('circle');
                    break;
                case '4':
                    this.selectTool('arrow');
                    break;
                case '5':
                    this.selectTool('freehand');
                    break;
                case '6':
                    this.selectTool('text');
                    break;
            }
        });
    }
    
    deleteSelectedAnnotation() {
        if (!this.selectedAnnotation) return;
        
        const index = this.annotations.indexOf(this.selectedAnnotation);
        if (index > -1) {
            this.annotations.splice(index, 1);
            this.selectedAnnotation = null;
            this.redraw();
        }
    }
    
    // Export annotated image
    exportImage() {
        if (!this.canvas) return;
        
        // Create a new canvas with the original image size
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCanvas.width = this.image.naturalWidth;
        exportCanvas.height = this.image.naturalHeight;
        
        // Draw original image
        exportCtx.drawImage(this.image, 0, 0);
        
        // Draw annotations at original scale
        const originalScale = this.scale;
        this.scale = 1;
        this.ctx = exportCtx;
        
        this.annotations.forEach(annotation => {
            this.drawAnnotation(annotation);
        });
        
        // Restore original context and scale
        this.ctx = this.canvas.getContext('2d');
        this.scale = originalScale;
        
        // Download the image
        const link = document.createElement('a');
        link.download = 'annotated-image.png';
        link.href = exportCanvas.toDataURL();
        link.click();
    }
}

// Create global AnnotationEditor instance
const AnnotationEditor = new AnnotationEditor();

// Setup keyboard shortcuts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AnnotationEditor.setupKeyboardShortcuts();
});