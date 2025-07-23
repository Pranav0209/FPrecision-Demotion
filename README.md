# 🧠 FPrecision-Demotion: FP16 Analysis & Web Interface

A comprehensive system that combines a Clang plugin for analyzing C source code to identify `float` variables that can be **safely demoted to `__fp16`** (half-precision float) with a modern web interface for visualization and interaction.

---

## 📌 Purpose

In memory-constrained systems (e.g., embedded devices), replacing `float` with `__fp16` can save 50% memory space. This project provides:

1. **Clang Plugin**: Automated detection of demotion candidates and unsafe variables
2. **Web Interface**: User-friendly frontend for uploading, analyzing, and visualizing results
3. **Backend API**: Node.js server for handling file processing and analysis

---

## 📁 Project Structure

| File / Folder             | Description |
|---------------------------|-------------|
| `src/Fp16DemotionPlugin.cpp` | Main Clang plugin logic |
| `frontend/`               | Next.js web interface |
| `backend/`                | Node.js API server |
| `build/`                  | Build output directory (contains `.dylib`) |
| `test/`                   | Test C files for validation |
| `CMakeLists.txt`          | CMake build configuration |
| `web_test.c`              | Web interface test file |

---

## ⚙️ Prerequisites

Ensure your system has:
- **Node.js** (v18+) for frontend/backend
- **npm** or **yarn** for package management
- **CMake** (3.15+) for building the Clang plugin
- **LLVM with Clang** (installed via Homebrew on macOS)

---

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/Pranav0209/FPrecision-Demotion.git
cd FPrecision-Demotion
```

### 2. Build the Clang Plugin
```bash
# Set environment variables
export CC=/opt/homebrew/opt/llvm/bin/clang
export CXX=/opt/homebrew/opt/llvm/bin/clang++

# Build the plugin
mkdir -p build && cd build
cmake ..
make
cd ..
```

### 3. Start the Backend Server
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3001
```

### 4. Start the Frontend
```bash
cd frontend
npm install --force  # Use --force to resolve dependency conflicts
npm run build        # Build for production
npx next dev         # Start development server
# Frontend runs on http://localhost:3000
```

### 5. Access the Web Interface
Open your browser and go to: **http://localhost:3000**

---

## 🌐 Web Interface Usage

1. **Upload C Files**: Use the web interface to upload your C source files
2. **View Analysis**: See the analysis results with highlighted safe/unsafe demotions
3. **Download Results**: Get the modified code and analysis reports
4. **Memory Analysis**: View potential memory savings

---

## 🛠️ Development Setup

---

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon for auto-restart
npm start            # Start production server
```

### Plugin Development
```bash
# Rebuild plugin after changes
cd build
make

# Test with sample file
/opt/homebrew/opt/llvm/bin/clang \
  -fplugin="./libfp16DemotionPlugin.dylib" \
  ../test/comprehensive_test.c \
  -Xclang -plugin-arg-fp16-demotion \
  -Xclang -fprecision-demote=fp16 \
  -c
```

---

## � Testing

### Test the Plugin Directly
```bash
cd test
/opt/homebrew/opt/llvm/bin/clang \
  -fplugin="../build/libfp16DemotionPlugin.dylib" \
  comprehensive_test.c \
  -Xclang -plugin-arg-fp16-demotion \
  -Xclang -fprecision-demote=fp16 \
  -c
```

### Test via Web Interface
1. Start both frontend and backend servers
2. Upload `web_test.c` or any C file
3. View the analysis results in the browser

---

## 📊 Example Analysis

### Input (`web_test.c`):
```c
#include <stdio.h>

int main() {
    float small1 = 3.14f;      // ✅ Safe to demote
    float small2 = 42.0f;      // ✅ Safe to demote
    float array[3] = {1.0f, 2.0f, 3.0f};  // ✅ Safe to demote
    
    float large1 = 100000.0f;  // ❌ Out of fp16 range
    float tiny = 1e-10f;       // ❌ Loses precision
    
    return 0;
}
```

### Expected Output:
```
✅ Variable 'small1' can be safely demoted to __fp16
✅ Variable 'small2' can be safely demoted to __fp16
✅ Array 'array' can be safely demoted to __fp16
❌ Cannot demote 'large1': value out of __fp16 range
❌ Cannot demote 'tiny': precision loss detected
```

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Clang Plugin   │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (C++ .dylib)  │
│   Port: 3000    │    │   Port: 3001    │    │   Analysis      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Frontend**: User uploads C files through the web interface
2. **Backend**: Processes files and calls the Clang plugin
3. **Plugin**: Analyzes the code and returns results
4. **Frontend**: Displays analysis results and downloadable outputs

---

## 🔧 Configuration

### Plugin Flags
| Flag | Description |
|------|-------------|
| `-fplugin=...` | Loads the compiled plugin |
| `-Xclang -plugin-arg-fp16-demotion` | Activates the plugin |
| `-Xclang -fprecision-demote=fp16` | Enables FP16 demotion analysis |
| `-c` | Compile without linking |

### Environment Variables
```bash
# Required for building the plugin
export CC=/opt/homebrew/opt/llvm/bin/clang
export CXX=/opt/homebrew/opt/llvm/bin/clang++

# Optional: Custom ports
export FRONTEND_PORT=3000
export BACKEND_PORT=3001
```

---

## 🛠️ Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Frontend won't start | Dependency conflicts | Run `npm install --force` in frontend/ |
| Backend connection failed | Port conflict | Check if port 3001 is available |
| Plugin not loading | Clang version mismatch | Use same LLVM version for build & run |
| Build fails | Missing dependencies | Install LLVM via `brew install llvm` |
| Permission errors | Directory access | Run `chmod -R 755` on project directory |
| No warnings shown | Plugin not invoked | Verify plugin flags and file paths |

### Common Commands
```bash
# Fix npm permission issues
npm cache clean --force

# Rebuild everything
rm -rf build/ && mkdir build && cd build && cmake .. && make

# Check if servers are running
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Kill processes on ports
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:3001)
```

---

## 🌟 Features

- ✅ **Real-time Analysis**: Upload and analyze C files instantly
- ✅ **Visual Interface**: User-friendly web dashboard
- ✅ **Memory Optimization**: Calculate potential memory savings
- ✅ **Safe Demotion Detection**: Identify variables safe for FP16 conversion
- ✅ **Risk Assessment**: Highlight unsafe conversions with reasons
- ✅ **Downloadable Results**: Get modified code and analysis reports
- ✅ **Multiple File Support**: Batch processing capabilities

---

## 🎯 Use Cases

1. **Embedded Systems**: Optimize memory usage in resource-constrained devices
2. **Mobile Applications**: Reduce memory footprint for better performance
3. **IoT Devices**: Minimize power consumption through smaller data types
4. **Game Development**: Optimize graphics and physics calculations
5. **Scientific Computing**: Balance precision vs. memory trade-offs

---

## 🔗 API Endpoints

The backend provides the following REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Upload and analyze C files |
| `GET` | `/api/results/:id` | Get analysis results |
| `GET` | `/api/download/:id` | Download processed files |

### Example API Usage
```bash
# Upload file for analysis
curl -X POST -F "file=@test.c" http://localhost:3001/api/analyze

# Get results
curl http://localhost:3001/api/results/12345
```

---

## 🚀 Deployment

### Production Deployment
```bash
# Build frontend for production
cd frontend
npm run build
npm start

# Run backend in production mode
cd backend
NODE_ENV=production npm start
```

### Docker Support (Optional)
```dockerfile
# Dockerfile example for the project
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
