# FP16 Demotion Plugin Web Interface

A modern web interface for the FP16 demotion plugin that allows you to upload C/C++ files and visualize memory optimization results.

## Features

- 🚀 **Drag & Drop File Upload** - Easy file upload with validation for C/C++ files
- 🔍 **Code Comparison** - Side-by-side view of original vs. optimized code with syntax highlighting
- 📊 **Memory Analysis** - Comprehensive visualization of memory savings and optimization statistics
- 📈 **Interactive Charts** - Visual representation of memory usage before and after optimization
- 💡 **Educational Content** - Detailed explanations of FP16 optimization benefits and techniques
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Project Structure

```
├── backend/                 # Node.js/Express API server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── uploads/            # Temporary file storage
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── FileUpload.js
│   │   │   ├── CodeDisplay.js
│   │   │   └── MemoryAnalysis.js
│   │   ├── App.js          # Main React component
│   │   └── index.js        # React entry point
│   ├── public/
│   │   └── index.html      # HTML template
│   └── package.json        # Frontend dependencies
├── src/                    # Original plugin source
├── build/                  # Compiled plugin
└── test/                   # Test files
```

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Clang/LLVM (for the FP16 plugin)
- CMake (for building the plugin)

## Quick Start

1. **Setup and Install Dependencies**
   ```bash
   ./setup.sh
   ```

2. **Start the Backend Server** (in one terminal)
   ```bash
   cd backend
   npm start
   ```

3. **Start the Frontend Development Server** (in another terminal)
   ```bash
   cd frontend
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Manual Setup

If you prefer to set up manually:

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## How to Use

1. **Upload a File**: Drag and drop or click to select a C/C++ file
2. **Analyze**: Click the "Analyze Code" button to run the FP16 optimization
3. **View Results**: 
   - **Code Comparison**: See original vs. optimized code side-by-side
   - **Memory Analysis**: Explore detailed memory savings and statistics
   - **Explanations**: Learn about FP16 optimization techniques

## API Endpoints

### POST /analyze
Upload and analyze a C/C++ file.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: File upload with key 'codeFile'

**Response:**
```json
{
  "success": true,
  "originalCode": "...",
  "demotedCode": "...",
  "memoryAnalysis": "...",
  "floatMap": {...}
}
```

## Component Details

### FileUpload Component
- Handles drag-and-drop file uploads
- Validates file types (C/C++ only)
- Shows upload progress and file information
- Communicates with backend API

### CodeDisplay Component
- Displays original and optimized code side-by-side
- Syntax highlighting using react-syntax-highlighter
- Shows code differences and change statistics
- Tabbed interface for different views

### MemoryAnalysis Component
- Parses memory analysis results
- Creates interactive charts for memory savings
- Displays detailed float variable analysis
- Provides educational explanations

## Technologies Used

### Frontend
- **React** - UI framework
- **Axios** - HTTP client
- **react-syntax-highlighter** - Code syntax highlighting
- **CSS3** - Modern styling with gradients and animations

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

## Configuration

### Backend Configuration
The backend server runs on port 3001 by default. You can modify this in `backend/server.js`:

```javascript
const PORT = process.env.PORT || 3001;
```

### Frontend Configuration
The frontend assumes the backend is running on `localhost:3001`. If you change the backend port, update the API calls in `FileUpload.js`.

## File Size Limits

- Maximum file size: 5MB
- Supported file types: .c, .cpp, .cc, .cxx

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start  # Auto-reloads on changes
```

## Building for Production

### Frontend Build
```bash
cd frontend
npm run build
```

This creates a `build/` folder with optimized production files.

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Backend: Change port in `server.js`
   - Frontend: Kill other React apps or change port with `PORT=3002 npm start`

2. **Plugin not found**
   - Ensure the FP16 plugin is built in the `build/` directory
   - Check the plugin path in `backend/server.js`

3. **Upload fails**
   - Check file type (must be C/C++)
   - Ensure file size is under 5MB
   - Check backend server is running

4. **CORS errors**
   - Ensure CORS is properly configured in backend
   - Check that frontend is calling correct backend URL

### Debug Mode

Enable debug logging in the backend by setting:
```bash
DEBUG=true npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the FP16 Demotion Plugin research project.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Create an issue in the repository
