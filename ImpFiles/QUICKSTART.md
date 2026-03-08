# BioMuseum - Quickstart Guide

Welcome to BioMuseum! This guide will help you get the project up and running on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **Git** (optional) - [Download Git](https://git-scm.com/)
- **MongoDB Atlas Account** - [Create a free account](https://www.mongodb.com/cloud/atlas)

Verify installations by running:
```powershell
python --version
node --version
npm --version
```

## Project Structure

```
BioMuseum/
├── backend/              # FastAPI Python backend
│   ├── server.py         # Main API server
│   ├── requirements.txt   # Python dependencies
│   └── .env             # Environment variables
├── frontend/             # React frontend
│   ├── src/             # React components and pages
│   ├── package.json     # JavaScript dependencies
│   └── .env             # Environment variables
└── README.md            # Project documentation
```

## Setup Instructions

### Step 1: Configure MongoDB Connection

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new database cluster (or use existing one)
3. Create a database user with credentials
4. Get your connection string from MongoDB Atlas:
   - Click "Connect" on your cluster
   - Select "Drivers" → "Python"
   - Copy the connection string
5. Replace `your-cluster-name` in the connection string with your actual cluster name

Your connection string should look like:
```
mongodb+srv://biomuseum_admin:adminSBES@your-cluster-name.mongodb.net/biomuseum?retryWrites=true&w=majority
```

### Step 2: Configure Backend Environment

1. Open a terminal and navigate to the backend directory:
```powershell
cd d:\BioMuseum\backend
```

2. Create/edit the `.env` file with your MongoDB connection:
```
MONGO_URL=mongodb+srv://biomuseum_admin:adminSBES@your-cluster-name.mongodb.net/biomuseum?retryWrites=true&w=majority
DB_NAME=biomuseum
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

3. Install Python dependencies:
```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Or if you already have the virtual environment:
```powershell
d:\BioMuseum\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Step 3: Configure Frontend Environment

1. Open a new terminal and navigate to the frontend directory:
```powershell
cd d:\BioMuseum\frontend
```

2. Create/edit the `.env` file:
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

3. Install Node.js dependencies:
```powershell
npm install --legacy-peer-deps
```

## Running the Application

### Option 1: Two Separate Terminals (Recommended)

**Terminal 1 - Start Backend:**
```powershell
python.exe -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Terminal 2 - Start Frontend:**
```powershell
cd d:\BioMuseum\frontend
npm start
```

You should see:
```
Compiled successfully!

You can now view frontend in the browser.
  Local:            http://localhost:3000
```

### Option 2: Using a Single Terminal (Sequential)

```powershell
# Start backend in background
cd d:\BioMuseum\backend
Start-Process -NoNewWindow -FilePath d:\BioMuseum\.venv\Scripts\python.exe -ArgumentList "-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
cd d:\BioMuseum\frontend
npm start
```

## Accessing the Application

Once both servers are running, open your browser and navigate to:

- **Homepage**: http://localhost:3000
- **Admin Panel**: http://localhost:3000 (click the 🔐 Admin button)
- **API Documentation**: http://localhost:8000/docs

## Default Admin Credentials

```
Username: admin
Password: adminSBES
```

## Using the Application

### Adding Organisms (Admin Panel)

1. Click the **🔐 Admin** button on the homepage
2. Login with the default credentials
3. Click **➕ Add Organism** tab
4. Fill in the organism details:
   - Common name (required)
   - Scientific name (required)
   - Taxonomic classification
   - Morphology description (required)
   - Physiology description (required)
   - General description
   - Add images (optional)
5. Click **✅ Add Organism**

### Viewing Organisms

- **Homepage**: Displays all organisms in a grid
- **Search**: Use the search bar to find organisms by name
- **Detail Page**: Click any organism card to see full details and QR code

### QR Scanner

1. Click the **📱 QR Scanner** button
2. Allow camera access when prompted
3. Point camera at a QR code to scan and view organism details

### Managing Organisms

In the Admin Panel:
- **Dashboard**: View statistics about your organisms
- **Manage Organisms**: Edit or delete existing organisms

## API Endpoints

### Public Endpoints

```
GET  /api/                          # Root endpoint
GET  /api/organisms                 # Get all organisms
GET  /api/organisms/{id}            # Get specific organism
GET  /api/organisms/qr/{qr_code_id} # Get organism by QR code
GET  /api/search?q={query}          # Search organisms
POST /api/admin/login               # Admin login
```

### Admin Endpoints (Requires Authentication)

```
POST   /api/admin/organisms         # Create organism
PUT    /api/admin/organisms/{id}    # Update organism
DELETE /api/admin/organisms/{id}    # Delete organism
```

## Troubleshooting

### Backend won't start

**Error: "Port 8000 already in use"**
```powershell
# Kill existing process
taskkill /F /IM python.exe
```

**Error: "MongoDB connection failed"**
- Verify your MongoDB connection string in `.env`
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure your MongoDB credentials are correct

### Frontend won't start

**Error: "npm ERR! code ERESOLVE"**
```powershell
npm install --legacy-peer-deps
```

**Error: "Port 3000 already in use"**
```powershell
# Kill existing process
taskkill /F /IM node.exe
```

**Blank page or nothing displays**
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors (F12)
- Verify backend is running on http://localhost:8000

### Database issues

**Organisms not appearing after adding**
- Verify MongoDB connection is working
- Check API docs at http://localhost:8000/docs to test endpoints manually
- Check browser console for API errors

## Development Tips

- **Hot Reload**: Frontend automatically reloads on file changes
- **Backend Reload**: Backend automatically reloads on file changes (when using `--reload` flag)
- **API Documentation**: Interactive API docs available at http://localhost:8000/docs
- **Browser DevTools**: Press F12 to open developer console for debugging

## Building for Production

### Backend

```powershell
cd d:\BioMuseum\backend
# Run with production settings (no reload)
d:\BioMuseum\.venv\Scripts\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
cd d:\BioMuseum\frontend
# Build production bundle
npm run build

# Output will be in the `build/` directory
```

## File Structure Reference

```
backend/
├── server.py           # Main FastAPI application with all routes
├── requirements.txt    # Python package dependencies
├── .env               # Environment configuration
└── seed_data.py       # Optional script to seed initial data

frontend/
├── src/
│   ├── App.js         # Main React component with all pages and logic
│   ├── App.css        # Global styles
│   ├── index.js       # Application entry point
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
├── public/
│   ├── index.html     # HTML template
│   └── favicon.ico    # App icon
├── package.json       # Node.js dependencies
├── .env              # Frontend environment variables
└── tailwind.config.js # Tailwind CSS configuration
```

## Environment Variables

### Backend (.env in backend/)
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/biomuseum
DB_NAME=biomuseum
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Frontend (.env in frontend/)
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Next Steps

1. **Customize**: Update the app colors, branding, and text in `frontend/src/App.js`
2. **Deploy**: See README.md for deployment instructions
3. **Add Features**: Extend the API and frontend components as needed
4. **Database**: Add indexes and optimize MongoDB queries for production

## Support

For detailed documentation, see:
- Backend: `backend/` directory
- Frontend: `frontend/README.md`
- Full documentation: `README.md`

## Quick Command Reference

| Task | Command |
|------|---------|
| Start Backend | `cd backend && d:\.venv\Scripts\python.exe -m uvicorn server:app --reload` |
| Start Frontend | `cd frontend && npm start` |
| Install Backend Deps | `pip install -r requirements.txt` |
| Install Frontend Deps | `npm install --legacy-peer-deps` |
| Kill Backend | `taskkill /F /IM python.exe` |
| Kill Frontend | `taskkill /F /IM node.exe` |
| Build Frontend | `npm run build` |
| Test API | Open http://localhost:8000/docs |
| View App | Open http://localhost:3000 |

---

**Happy exploring!** 🧬🦁🌿
