# Game Design Review System

An interactive web application for game design review and collaboration, featuring task management, media uploads, and advanced image annotation tools.

## Features

✨ **Interactive Task Management** - Create, assign, and track game design issues  
🎨 **Image Annotation Tools** - Draw, annotate, and mark up screenshots  
📁 **Media Upload & Management** - Support for images, videos, and documents  
👥 **Team Collaboration** - Real-time updates and role-based access  
📱 **Responsive Design** - Works on desktop, tablet, and mobile  

## Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd game-design-review
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB connection

# Start MongoDB and run app
npm run dev
```

Visit `http://localhost:3000` to get started!

## Key Features

### Task Management
- Create issues with priority levels (critical, high, medium, low)
- Assign to team members with different roles
- Track status: open → in-progress → needs-review → resolved → closed
- Filter and search tasks, switch between list and kanban views

### Image Annotation
- Upload screenshots and images
- Use annotation tools: rectangles, circles, arrows, freehand drawing, text
- Choose colors and stroke widths
- Save and export annotated images
- Real-time collaborative annotation

### File Management
- Drag & drop file uploads
- Support for images (PNG, JPG, GIF), videos (MP4, WebM), documents (PDF)
- File previews and thumbnails
- Attachment to specific tasks

### Team Collaboration
- Real-time updates via WebSocket
- Role-based permissions (admin, reviewer, developer, designer)
- Comment system with threading
- Live notifications for task updates

## Usage

1. **Sign up** and create your account
2. **Create a project** for your game
3. **Add team members** and assign roles
4. **Create tasks** for bugs, features, or design feedback
5. **Upload screenshots** and use annotation tools to mark issues
6. **Track progress** with status updates and comments

## Project Structure

```
├── server.js              # Express server
├── models/                # MongoDB schemas
├── routes/                # API endpoints
├── middleware/            # Authentication & security
├── public/                # Frontend files
│   ├── index.html         # Main application
│   ├── css/main.css       # Styling
│   └── js/                # JavaScript modules
└── uploads/               # File storage
```

## Environment Variables

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/game-design-review
JWT_SECRET=your-secret-key
MAX_FILE_SIZE=50MB
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/projects` - Get projects
- `GET /api/tasks/project/:id` - Get project tasks
- `POST /api/upload/file` - Upload files
- `POST /api/upload/file/:id/annotations` - Add annotations

## Development

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Install additional dependencies
npm install
```

## Deployment

### Docker
```bash
docker build -t game-review .
docker run -p 3000:3000 game-review
```

### Cloud Platforms
- Heroku + MongoDB Atlas
- DigitalOcean App Platform
- AWS EC2 + DocumentDB
- Railway with built-in database

## Security Features

- JWT authentication
- Role-based access control
- File type validation
- Rate limiting
- CORS protection
- Secure file uploads

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.

---

**Perfect for game studios, indie developers, and design teams!**