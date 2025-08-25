# Game Design Review System

A comprehensive web-based tool for managing game design reviews with Google Sheets integration, media upload capabilities, and advanced image annotation features.

## 🎮 Features

### Core Functionality
- **Issue Management**: Create, track, and manage design review issues
- **Task Assignment**: Assign issues to team members with priority levels
- **Status Tracking**: Track issues from creation to completion
- **Real-time Statistics**: View project progress and metrics

### Media Management
- **Drag & Drop Upload**: Easy upload of screenshots and videos
- **Multiple File Support**: Upload multiple images/videos at once
- **Preview System**: Visual preview of uploaded media
- **File Organization**: Automatic organization by issue

### Advanced Image Annotation
- **Drawing Tools**: Freehand drawing with customizable brush sizes
- **Shape Tools**: Add arrows, circles, rectangles, and text
- **Color Picker**: Full color customization for annotations
- **Layer System**: Draw over images while preserving originals
- **Save & Export**: Save annotated images for review

### Google Sheets Integration
- **Automatic Sync**: Real-time synchronization with Google Sheets
- **Data Export**: Export all issues to spreadsheet format
- **Team Collaboration**: Share data across team members
- **Backup System**: Automatic backup of all data

### Team Management
- **Member Management**: Add/remove team members
- **Role Assignment**: Assign issues to specific team members
- **Filtering**: Filter issues by assignee, status, priority
- **Search Functionality**: Search through all issues and descriptions

## 🚀 Quick Start

### 1. Open the Application
Simply open `game-design-review.html` in your web browser. No server setup required!

### 2. Initial Setup
1. Click the **Settings** button in the header
2. Configure your Google Sheets integration (optional)
3. Add team members
4. Start creating issues!

### 3. Create Your First Issue
1. Click **New Issue** in the sidebar
2. Fill in the issue details:
   - Title and description
   - Priority level
   - Assignee
   - Category
3. Upload screenshots or videos
4. Click **Create Issue**

## 📋 Google Sheets Setup

### Prerequisites
1. Google Cloud Platform account
2. Google Sheets API enabled
3. API key with Sheets access

### Setup Steps

#### 1. Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google Sheets API
4. Create credentials (API Key)

#### 2. Configure the Application
1. Open the application
2. Click **Settings**
3. Enter your API key in the "API Key" field
4. Enter your spreadsheet ID (found in the URL)
5. Click **Test Connection** to verify
6. Save settings

#### 3. Spreadsheet Format
The system automatically creates a spreadsheet with these columns:
- ID
- Title
- Description
- Priority
- Assignee
- Category
- Status
- Created Date
- Updated Date

## 🎨 Image Annotation Guide

### Available Tools
- **Draw Tool**: Freehand drawing with customizable brush
- **Arrow Tool**: Add directional arrows
- **Text Tool**: Add text annotations
- **Circle Tool**: Draw circles to highlight areas
- **Rectangle Tool**: Draw rectangles to frame areas
- **Color Picker**: Choose any color for annotations
- **Brush Size**: Adjust line thickness (1-20px)
- **Clear Canvas**: Remove all annotations

### How to Annotate
1. Upload an image to an issue
2. Click on the image in the issue detail view
3. Use the annotation tools to draw on the image
4. Adjust colors and brush sizes as needed
5. Click **Save Annotation** to preserve changes
6. The annotated image is automatically saved to the issue

## 🔧 Configuration

### Settings Options
- **Google Sheets API Key**: For spreadsheet integration
- **Spreadsheet ID**: Target spreadsheet for data sync
- **Team Members**: Add/remove team members
- **Auto-sync**: Enable/disable automatic synchronization

### Data Storage
- All data is stored locally in browser localStorage
- No external servers required
- Data persists between sessions
- Export/import functionality available

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices
- All modern browsers

## 🛠️ Technical Details

### Browser Requirements
- Modern browser with ES6+ support
- LocalStorage enabled
- Canvas API support (for annotations)
- File API support (for uploads)

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Videos**: MP4, WebM, OGV
- **Maximum file size**: Browser dependent (typically 50MB+)

### Performance
- Optimized for large numbers of issues
- Efficient filtering and search
- Compressed image storage
- Minimal memory usage

## 🔒 Privacy & Security

### Data Privacy
- All data stored locally in your browser
- No data sent to external servers (except Google Sheets if configured)
- No tracking or analytics
- Complete control over your data

### Security Features
- XSS protection for user input
- Secure file handling
- API key encryption in storage
- No external dependencies for core functionality

## 📊 Usage Statistics

The system tracks:
- Total issues created
- Open issues count
- Completed issues count
- Issues by priority
- Issues by assignee
- Issues by category

## 🔄 Workflow Integration

### Typical Workflow
1. **Create Issue**: Designer identifies a problem
2. **Upload Media**: Add screenshots/videos of the issue
3. **Annotate**: Draw on images to highlight specific areas
4. **Assign**: Assign to appropriate team member
5. **Track Progress**: Monitor status updates
6. **Review**: Team member addresses the issue
7. **Complete**: Mark issue as resolved
8. **Re-review**: Verify the fix meets requirements

### Status Flow
- **Open**: New issue created
- **In Progress**: Assigned team member working on it
- **Under Review**: Changes made, awaiting review
- **Completed**: Issue resolved and verified

## 🎯 Best Practices

### Issue Creation
- Use clear, descriptive titles
- Provide detailed descriptions
- Include relevant screenshots/videos
- Set appropriate priority levels
- Assign to the right team member

### Annotation Tips
- Use different colors for different types of feedback
- Keep annotations clear and readable
- Use arrows to point to specific elements
- Add text explanations when needed
- Save annotations frequently

### Team Management
- Keep team member list updated
- Use consistent naming conventions
- Regular status updates
- Clear communication through comments

## 🐛 Troubleshooting

### Common Issues

#### Google Sheets Not Syncing
- Verify API key is correct
- Check spreadsheet ID format
- Ensure API is enabled in Google Cloud Console
- Check browser console for errors

#### Images Not Loading
- Check file format compatibility
- Verify file size limits
- Clear browser cache
- Try different browser

#### Annotations Not Saving
- Ensure canvas is properly initialized
- Check browser console for errors
- Try refreshing the page
- Verify localStorage is enabled

#### Performance Issues
- Clear old data from localStorage
- Reduce number of open issues
- Close unused browser tabs
- Restart browser

### Getting Help
1. Check browser console for error messages
2. Verify all requirements are met
3. Try in different browser
4. Clear browser data and restart

## 🔮 Future Features

Planned enhancements:
- **Real-time Collaboration**: Multiple users editing simultaneously
- **Advanced Filters**: More sophisticated filtering options
- **Export Options**: PDF, Excel, CSV export
- **Notification System**: Email/Slack integration
- **Version Control**: Track changes over time
- **API Integration**: Connect with other development tools
- **Mobile App**: Native mobile application
- **Cloud Storage**: Optional cloud backup

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions:
- Check the troubleshooting section
- Review browser console for errors
- Ensure all requirements are met
- Try the application in different browsers

---

**Happy Game Designing! 🎮**

*This tool is designed to streamline your game design review process and improve team collaboration.*