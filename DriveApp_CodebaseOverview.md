# Google Drive Client Portal Codebase Overview

This document provides a comprehensive overview of the current client portal system implemented using Zoho Creator with HTML snippets and a Vercel app middleware. This serves as reference documentation for migrating the functionality to a standalone Vercel application.

## System Architecture

The current architecture consists of:

1. **Zoho Creator Application**
   - Hosts the client portal UI
   - Handles user authentication and session management
   - Contains HTML snippets for UI elements
   - Uses Deluge scripts for server-side logic

2. **Vercel Middleware Application**
   - Node.js/Next.js application deployed on Vercel
   - Provides API endpoints for communicating with Google Drive
   - Handles Google Drive authentication via service account
   - Returns pre-rendered HTML for file listings

3. **Google Drive Integration**
   - Stores client-specific files in dedicated folders
   - Service account access for file operations
   - Supports listing, uploading, downloading files

## Core Functionality

### 1. Client-Specific File Access

The system determines which files to show based on:
- Client email (from Zoho login)
- Folder ID (specified in URL parameters)

```javascript
// From app/controllers/drive.controller.js
async function findClientFolder(drive, clientEmail) {
  console.log(`Finding best matching folder for: ${clientEmail}`);
  
  // First strategy: Try exact match
  try {
    console.log('Strategy 1: Exact match search');
    const exactMatchQuery = `mimeType = 'application/vnd.google-apps.folder' and name contains '${clientEmail}' and trashed = false`;
    console.log('Exact match query:', exactMatchQuery);
    
    const exactMatchResponse = await drive.files.list({
      q: exactMatchQuery,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });
    
    console.log(`Exact match found ${exactMatchResponse.data.files.length} folders`);
    
    if (exactMatchResponse.data.files.length > 0) {
      console.log('Exact matches:', exactMatchResponse.data.files.map(f => f.name).join(', '));
      return exactMatchResponse.data.files[0];
    }
  } catch (error) {
    console.error('Error in exact match search:', error);
  }
  
  // Additional strategies for finding client folders...
  // ...
}
```

### 2. File Listing and Display

Files are fetched from Google Drive and displayed in a responsive grid layout:

```javascript
// From pages/api/files.js
export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-vercel-protection-bypass');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check for protection bypass header
  const bypassHeader = req.headers['x-vercel-protection-bypass'];
  if (bypassHeader !== process.env.VERCEL_PROTECTION_BYPASS) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access',
      fileCount: 0,
      filesHtml: ''
    });
  }

  // Get folder ID from query parameters
  const { folderId } = req.query;
  
  // Validate folder ID
  if (!folderId) {
    return res.status(400).json({
      success: false,
      error: 'Missing folderId parameter',
      fileCount: 0,
      filesHtml: ''
    });
  }

  try {
    console.log(`Processing request for folder ID: ${folderId}`);
    
    // Initialize Google Drive API with service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // List files in the folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    const files = response.data.files;
    console.log(`Found ${files.length} files in folder ${folderId}`);
    
    // Generate HTML for each file
    let filesHtml = '';
    files.forEach(file => {
      filesHtml += generateFileHtml(file);
    });
    
    // Return the response with pre-rendered HTML
    return res.status(200).json({
      success: true,
      fileCount: files.length,
      filesHtml: filesHtml,
      error: null
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    
    return res.status(500).json({
      success: false,
      fileCount: 0,
      filesHtml: '',
      error: `Failed to fetch files: ${error.message}`
    });
  }
}
```

### 3. File Upload Functionality

Clients can upload files directly to their Google Drive folder:

```javascript
// From app/controllers/drive.controller.js
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Accept either clientEmail or email parameter
    const clientEmail = req.body.clientEmail || req.body.email;
    const { folderId } = req.body;
    
    console.log('Upload - Using clientEmail:', clientEmail);
    console.log('Upload - Using folderId:', folderId);
    
    if (!clientEmail && !folderId) {
      return res.status(400).json({
        success: false,
        message: 'Client email or folder ID is required'
      });
    }
    
    const drive = initDriveClient();
    
    // Determine parent folder ID
    let parentFolderId = folderId;
    
    if (!parentFolderId) {
      // Find folder by client email using our enhanced search
      const clientFolder = await findClientFolder(drive, clientEmail);
      
      if (!clientFolder) {
        return res.status(404).json({
          success: false,
          message: 'No folder found for this client'
        });
      }
      
      parentFolderId = clientFolder.id;
      console.log('Upload - Using folder:', clientFolder.name, 'with ID:', parentFolderId);
    }
    
    // Create file metadata
    const fileMetadata = {
      name: req.file.originalname,
      parents: [parentFolderId]
    };
    
    // Create media object
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path)
    };
    
    // Upload file to Drive
    console.log('Upload - Uploading file:', req.file.originalname);
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });
    
    // Clean up temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }
    
    res.json({
      success: true,
      file: {
        id: file.data.id,
        name: file.data.name,
        link: file.data.webViewLink
      }
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up temporary file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting temporary file:', e);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};
```

### 4. Zoho Integration with HTML Snippet

The Zoho Creator HTML snippet displays the files from Google Drive:

```html
<!-- From zoho_html_snippet.html -->
<%{
/* Deluge code at the top */
try 
{
    // Initialize default values
    input.statusMessage = "Successfully loaded 3 files";
    input.debugInfo = "Files loaded from Google Drive folder: 1Mr21tEwKUzYaFf5bWRqWSdhYBC3Eeeb2";
    input.userEmail = zoho.loginuserid;
    fileCount = 3;
    
    // Sample file HTML - hardcoded to match exactly what we see in the screenshot
    filesHtml = "<div class='drive-file-item'>" + 
        "<h4 class='drive-file-name'>Contracts</h4>" + 
        "<p class='drive-file-details'>Type: application/vnd.google-apps.folder</p>" + 
        "<p class='drive-file-details'>Modified: 3/9/2025</p>" + 
        "<p class='drive-file-details'>Size: Unknown size</p>" + 
        "<div class='drive-file-link-container'>" + 
        "<a href='https://drive.google.com/drive/folders/sample' target='_blank' class='drive-file-link'>View in Drive</a>" + 
        "</div></div>" + 
        // More sample HTML...
}
catch (e)
{
    input.statusMessage = "Error: " + e;
    info "Exception occurred: " + e;
    fileCount = 0;
    filesHtml = "";
}
%>
<div class="drive-files-component">
    <style>
        /* CSS styling for file components */
        .drive-files-component { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 20px; 
            background-color: #f9f9f9;
            color: #333;
        }
        /* More CSS styles... */
    </style>

    <div class="drive-page-header">
        <h4>My Drive Files</h4>
        <div class="drive-status-info">
            <p>Status: <%=input.statusMessage%></p>
            <p>User: <%=input.userEmail%></p>
        </div>
    </div>

    <p>Found <%=fileCount%> files</p>
    <div class="drive-files-container">
        <%=filesHtml%>
    </div>
    
    <div class="drive-debug-info">
        <p>Debug Info: <%=input.debugInfo%></p>
    </div>
</div>
<%}%>
```

### 5. Deluge Script for API Communication

The Deluge script in Zoho Creator makes API calls to the Vercel middleware:

```javascript
// From page_script.deluge
/* Page Script for Drive Files Integration */

// Initialize variables
folderID = "1Mr21tEwKUzYaFf5bWRqWSdhYBC3Eeeb2"; // Default folder ID
userEmail = zoho.loginuserid;
statusMessage = "Loading files...";
debugInfo = "Initializing...";
fileCount = 0;
filesHtml = "";

try {
    // Make API call to Vercel endpoint
    apiUrl = "https://new-drive-adq7p5zpp-beaus-projects-7c904857.vercel.app/api/files?folderId=" + folderID;
    info "Calling API URL: " + apiUrl;
    
    response = invokeurl
    [
        url: apiUrl
        type: GET
        headers: {"x-vercel-protection-bypass":"VIPddPc64kqProQuiWdsPRykfKsD7ROB"}
    ];
    
    info "API response received";
    
    // Process the response
    if(response != null) {
        // Check if the API call was successful
        success = false;
        try {
            success = response.success;
        } catch(e) {
            info "Error checking success property: " + e;
        }
        
        if(success == true) {
            // Get file count and HTML
            try {
                fileCount = response.fileCount;
                filesHtml = response.filesHtml;
                statusMessage = "Successfully loaded " + fileCount + " files";
                debugInfo = "Files loaded from Google Drive folder: " + folderID;
            } catch(e) {
                info "Error extracting data from response: " + e;
                statusMessage = "Error processing API response";
                debugInfo = "API call succeeded but error processing data: " + e;
            }
        } else {
            // Handle API error
            errorMsg = "Unknown error";
            try {
                errorMsg = response.error;
            } catch(e) {}
            
            statusMessage = "Error: API call was not successful";
            debugInfo = "API returned error: " + errorMsg;
        }
    } else {
        statusMessage = "Error: No response from API";
        debugInfo = "API response is null";
    }
} catch(e) {
    statusMessage = "Error making API call: " + e;
    debugInfo = "Exception during API call: " + e;
}

// Set input variables for the HTML snippet
input.statusMessage = statusMessage;
input.debugInfo = debugInfo;
input.userEmail = userEmail;
input.folderId = folderID;
input.fileCount = fileCount;
input.filesHtml = filesHtml;
```

## API Endpoints

### Main Endpoints

1. **List Files**
   - `GET /api/files?folderId=YOUR_FOLDER_ID`
   - Returns file listings from a specific Google Drive folder

2. **Upload File**
   - `POST /api/drive/upload`
   - Uploads a file to a specific Google Drive folder

3. **Download File**
   - `GET /api/drive/files/:fileId/download`
   - Downloads a specific file from Google Drive

## Authentication & Security

1. **API Authentication**
   - Custom header-based authentication using `x-vercel-protection-bypass` token
   - JWT-based tokens for user authentication (planned for migration)

2. **Google Drive Authentication**
   - Service account credentials for accessing Google Drive
   - Environment variables for secure credential storage

## Client-Side JavaScript

The client portal includes JavaScript for handling file operations:

```javascript
// From script.js
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const fileList = document.getElementById('fileList');
  const emptyState = document.getElementById('emptyState');
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const fileSelectBtn = document.getElementById('fileSelectBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Config
  const apiBaseUrl = '/api/drive';
  
  // Get the client identifier from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const clientEmail = urlParams.get('email');
  const folderId = urlParams.get('folderId');
  
  // Initialize
  loadFiles();
  
  // File selection and upload handlers
  fileSelectBtn.addEventListener('click', function() {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
      uploadFile(fileInput.files[0]);
    }
  });
  
  // Drag and drop functionality
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('active');
  });
  
  uploadArea.addEventListener('dragleave', function() {
    uploadArea.classList.remove('active');
  });
  
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('active');
    
    if (e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  });
  
  // Load files function
  function loadFiles() {
    // Implementation details...
  }
  
  // Upload file function
  function uploadFile(file) {
    // Implementation details...
  }
});
```

## Project Configuration

### Next.js/Vercel Configuration

```json
// From vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Package Dependencies

```json
// From package.json
{
  "name": "google-drive-client-portal",
  "version": "1.0.0",
  "description": "A middleware application connecting Google Drive with Zoho to display client-specific files.",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "googleapis": "^118.0.0",
    "multer": "^1.4.5-lts.1",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@types/react": "^18.2.61",
    "nodemon": "^2.0.22",
    "typescript": "^5.3.3"
  }
}
```

## Migration Plan

To migrate this functionality to a standalone Vercel app, we will need to:

1. **Create a Next.js Application**
   - Set up a new Next.js project with TypeScript
   - Implement the App Router for better routing

2. **Develop Authentication System**
   - Implement NextAuth.js for user authentication
   - Create login/signup flow
   - Set up role-based access control

3. **Rebuild File Management Components**
   - Create React components for file listing
   - Implement file upload functionality
   - Build file preview and download features

4. **Integrate with Google Drive API**
   - Port existing Google Drive controller logic
   - Add comprehensive error handling
   - Improve security measures

5. **Create Admin Dashboard**
   - Build admin interface for user management
   - Add reporting and analytics
   - Implement system configuration

6. **API Integration with Zoho**
   - Create API endpoints to fetch data from Zoho
   - Implement webhooks for real-time updates
   - Build data synchronization logic

This document serves as a comprehensive reference for understanding the current system's functionality and architecture. It will guide the development of the new standalone Vercel application that replaces the current Zoho Creator implementation. 