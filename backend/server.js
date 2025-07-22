const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Keep original filename with timestamp to avoid conflicts
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${timestamp}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only .c and .cpp files
        const allowedExtensions = ['.c', '.cpp', '.cc', '.cxx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only C/C++ files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

// Function to run the FP16 demotion plugin
function runFp16Plugin(filePath) {
    return new Promise((resolve, reject) => {
        const workingDir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        
        // Path to your plugin
        const pluginPath = path.resolve(__dirname, '../build/libfp16DemotionPlugin.dylib');
        const clangPath = '/opt/homebrew/opt/llvm/bin/clang'; // Use homebrew clang that matches plugin build
        
        const command = `cd "${workingDir}" && "${clangPath}" -fplugin="${pluginPath}" "${fileName}" -Xclang -plugin-arg-fp16-demotion -Xclang -fprecision-demote=fp16 -c 2>&1`;
        
        console.log('Executing command:', command);
        
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            const result = {
                success: !error,
                stdout: stdout,
                stderr: stderr,
                workingDir: workingDir
            };
            
            if (error) {
                console.error('Plugin execution error:', error);
                result.error = error.message;
            }
            
            resolve(result);
        });
    });
}

// Function to read generated files
function readGeneratedFiles(workingDir) {
    const files = {};
    
    try {
        // Read demoted code
        const demotedPath = path.join(workingDir, 'demoted.c');
        if (fs.existsSync(demotedPath)) {
            files.demotedCode = fs.readFileSync(demotedPath, 'utf8');
        }
        
        // Read memory analysis
        const memoryAnalysisPath = path.join(workingDir, 'memory_analysis.txt');
        if (fs.existsSync(memoryAnalysisPath)) {
            files.memoryAnalysis = fs.readFileSync(memoryAnalysisPath, 'utf8');
        }
        
        // Read JSON analysis
        const jsonPath = path.join(workingDir, 'float_map.json');
        if (fs.existsSync(jsonPath)) {
            try {
                let jsonData = fs.readFileSync(jsonPath, 'utf8');
                
                // Fix JSON issues:
                // 1. Replace non-breaking spaces with regular spaces
                jsonData = jsonData.replace(/\u00A0/g, ' ');
                // 2. Fix unquoted inf values
                jsonData = jsonData
                    .replace(/:\s*inf\s*,/g, ': "Infinity",')
                    .replace(/:\s*inf\s*}/g, ': "Infinity"}')
                    .replace(/:\s*inf\s*$/gm, ': "Infinity"');
                
                files.jsonAnalysis = JSON.parse(jsonData);
                console.log('Successfully parsed JSON with', files.jsonAnalysis.length, 'items');
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                files.jsonAnalysis = [];
            }
        }
    } catch (error) {
        console.error('Error reading generated files:', error);
    }
    
    return files;
}

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'FP16 Demotion Plugin API Server' });
});

app.post('/analyze', upload.single('codeFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }
        
        console.log('File uploaded:', req.file.filename);
        
        // Read original file content
        const originalContent = fs.readFileSync(req.file.path, 'utf8');
        
        // Run the plugin
        const pluginResult = await runFp16Plugin(req.file.path);
        
        // Read generated files
        const generatedFiles = readGeneratedFiles(path.dirname(req.file.path));
        
        // Clean up the uploaded file (optional)
        // fs.unlinkSync(req.file.path);
        
        const response = {
            success: pluginResult.success,
            originalCode: originalContent,
            originalFilename: req.file.originalname,
            pluginOutput: {
                stdout: pluginResult.stdout,
                stderr: pluginResult.stderr
            },
            analysis: {
                demotedCode: generatedFiles.demotedCode,
                memoryAnalysis: generatedFiles.memoryAnalysis,
                jsonAnalysis: generatedFiles.jsonAnalysis
            }
        };
        
        if (pluginResult.error) {
            response.error = pluginResult.error;
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: error.message
    });
});

app.listen(PORT, () => {
    console.log(`FP16 Demotion API server running on http://localhost:${PORT}`);
    console.log('Ready to process C/C++ files through the FP16 demotion plugin!');
});
