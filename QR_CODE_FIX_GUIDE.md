# QR Code Fix Guide

## Issue Description
QR codes for organisms were being generated with incorrect URLs, causing them to redirect to the base application URL instead of the specific organism detail pages.

## Root Cause
1. **Frontend Bug (PrintOrganismModal)**: QR codes in the print modal were using `window.location.pathname` (which gives the current admin page path) instead of constructing the proper `/organism/{id}` path.
2. **Backend Environment**: If `FRONTEND_URL` environment variable wasn't properly configured on the deployment, new organisms might have QR codes pointing to wrong URLs.

## What Was Fixed

### 1. Frontend Fix (Already Applied)
- Updated `PrintOrganismModal` component in `frontend/src/App.js`
- Changed QR code generation from:
  ```javascript
  ${window.location.origin}${window.location.pathname}?organism=${organism.id}
  ```
  to:
  ```javascript
  ${window.location.origin}/organism/${organism.id}
  ```
- This affects both the visual QR code (QRCodeSVG) and the printable QR code

### 2. Backend: Regenerating Existing QR Codes

If you have existing organisms in the database with incorrect QR codes, run the fixer script:

#### Option A: Local Development
```bash
cd backend
# Make sure your .env has correct MONGO_URL and FRONTEND_URL
python fix_organism_qr_codes.py
```

#### Option B: Production (Render)
1. Access your Render deployment
2. Open the Shell tab in your service
3. Run:
```bash
cd backend
python fix_organism_qr_codes.py
```

#### Option C: Using MongoDB Atlas directly
If you prefer to update MongoDB directly:
```javascript
// Run in MongoDB Atlas UI Console
db.organisms.updateMany(
  {},
  [
    {
      $set: {
        qr_code_image: "regenerated_qr_code_base64_here"
      }
    }
  ]
)
```

## Environment Configuration

Make sure your deployment has the correct environment variables:

### For Development
```
FRONTEND_URL=http://localhost:3000
```

### For Vercel Deployment
```
FRONTEND_URL=https://zoomuseumsb.vercel.app
```

If you have multiple URLs (e.g., staging + production):
```
FRONTEND_URL=https://zoomuseumsb.vercel.app,https://staging.zoomuseumsb.vercel.app
```
The script will use the first URL in the list.

## Verification

After running the fix:

1. **Test New Organisms**: Create a new organism in the admin panel
2. **Test Existing Organisms**: Use the Manage Organisms tab
3. **Print QR Code**: Click "Print" button on any organism
4. **Scan the QR Code**: It should now redirect to `/organism/{organism_id}` instead of the base URL

## Files Modified
- `frontend/src/App.js` - Fixed `PrintOrganismModal` component
- `backend/fix_organism_qr_codes.py` - New script to regenerate QR codes (created)

## Rollback

If you need to revert the frontend changes:
```javascript
// In PrintOrganismModal, change back to:
value={`${window.location.origin}${window.location.pathname}?organism=${organism.id}`}
```

However, this is not recommended as the new URLs are correct.
