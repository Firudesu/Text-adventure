# Game Design Review System

An interactive web application for game design review with Google Sheets integration, file uploads, and image annotation capabilities.

## Features

- **Google Sheets Integration**: All tasks are synced with a Google Spreadsheet for easy collaboration
- **File Upload**: Support for images (PNG, JPG, GIF) and videos (MP4, MOV, AVI, WEBM) up to 100MB
- **Image Annotation**: Draw over screenshots with various tools (brush, shapes, text)
- **Task Management**: Create, view, and update design review tasks
- **Status Tracking**: Track tasks through pending, in-progress, and done states
- **Priority Levels**: Assign high, medium, or low priority to tasks
- **Modern UI**: Dark theme with Material-UI components

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Project with Sheets API enabled
- Google Service Account credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd /workspace/game-review-system
npm run install-all
```

### 2. Google Sheets Setup

1. Create a new Google Spreadsheet
2. Note the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Create a Google Cloud Project and enable the Google Sheets API
4. Create a Service Account and download the credentials JSON
5. Share your spreadsheet with the service account email (found in the credentials JSON)

### 3. Configure Environment Variables

Edit `/workspace/game-review-system/server/.env` with your credentials:

```env
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
SPREADSHEET_ID=your-spreadsheet-id
```

### 4. Initialize the Spreadsheet

Start the server and make a POST request to initialize the spreadsheet headers:

```bash
curl -X POST http://localhost:5000/api/sheets/initialize
```

### 5. Run the Application

```bash
cd /workspace/game-review-system
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

## Usage

### Creating Issues

1. Click "Create Issue" in the navigation
2. Fill in the required fields:
   - Title: Brief description of the issue
   - Description: Detailed information
   - Reporter: Your name or email
3. Optional fields:
   - Category: Type of issue (UI/UX, Gameplay, Performance, etc.)
   - Priority: Low, Medium, or High
   - Assignee: Person responsible for the issue
4. Upload screenshots or videos
5. Click on uploaded images to annotate them with drawings

### Image Annotation

When viewing or creating tasks with image attachments:
1. Click on an image to open it
2. Click "Annotate" to enter annotation mode
3. Use the toolbar to:
   - Draw freehand with the brush tool
   - Add rectangles, circles, or text
   - Change colors and brush size
   - Undo/redo changes
   - Clear all annotations
4. Click "Save Annotated" to save your annotated version

### Managing Tasks

- View all tasks on the dashboard
- Filter by status, priority, or search by text
- Click on any task to view details
- Edit task status, priority, or assignee
- View and download attachments

## Project Structure

```
game-review-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   └── App.js        # Main app component
│   └── package.json
├── server/                # Express backend
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── index.js          # Server entry point
│   └── package.json
├── uploads/              # Uploaded files directory
└── README.md
```

## API Endpoints

- `GET /api/sheets/tasks` - Get all tasks
- `POST /api/sheets/tasks` - Create a new task
- `PATCH /api/sheets/tasks/:id` - Update a task
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `POST /api/upload/save-annotation` - Save annotated image

## Technologies Used

- **Frontend**: React, Material-UI, Fabric.js (for image annotation), React Dropzone
- **Backend**: Node.js, Express, Google Sheets API, Multer (file uploads)
- **Storage**: Google Sheets for task data, local filesystem for file uploads

## Troubleshooting

1. **Google Sheets API errors**: Ensure your service account has access to the spreadsheet
2. **File upload errors**: Check that the uploads directory exists and has write permissions
3. **CORS errors**: Make sure the proxy in client/package.json points to the correct server port

## Future Enhancements

- User authentication and permissions
- Cloud storage integration (S3, Google Cloud Storage)
- Real-time updates using WebSockets
- Comments and discussion threads
- Email notifications
- Export reports