#!/usr/bin/env python3
"""
Script to regenerate QR codes for all existing organisms in the database.
This fixes organisms that were created with incorrect QR code URLs.

Required Environment Variables:
    MONGO_URL - MongoDB connection string
    FRONTEND_URL - Frontend URL for QR code generation (default: http://localhost:3000)
    DB_NAME - Database name (default: biomuseum)

Usage:
    python fix_organism_qr_codes.py
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import qrcode
import io
import base64

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

if not MONGO_URL:
    print("ERROR: MONGO_URL environment variable is not set.")
    sys.exit(1)

# Use first URL if multiple are configured
FRONTEND_URL = FRONTEND_URL.split(',')[0].strip()


def generate_qr_code(organism_id: str) -> str:
    """Generate QR code image as base64 string pointing to organism page."""
    qr_url = f"{FRONTEND_URL}/organism/{organism_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"


async def fix_qr_codes():
    """Fetch all organisms and regenerate their QR codes."""
    client = AsyncIOMotorClient(MONGO_URL)
    # Get the database name from environment or use default (same as server.py)
    db_name = os.environ.get('DB_NAME', 'biomuseum')
    db = client[db_name]
    organisms_collection = db['organisms']
    
    try:
        print(f"Connecting to MongoDB: {MONGO_URL}")
        print(f"Database: {db_name}")
        print(f"Frontend URL: {FRONTEND_URL}")
        print("-" * 60)
        
        # Get all organisms
        organisms = await organisms_collection.find({}).to_list(None)
        
        if not organisms:
            print("✓ No organisms found in database.")
            return
        
        print(f"Found {len(organisms)} organisms. Regenerating QR codes...")
        print("-" * 60)
        
        updated_count = 0
        for organism in organisms:
            organism_id = organism.get('id')
            organism_name = organism.get('name', 'Unknown')
            
            if not organism_id:
                print(f"⚠ Skipping organism with missing ID: {organism_name}")
                continue
            
            try:
                # Generate new QR code
                new_qr_code = generate_qr_code(organism_id)
                
                # Update organism in database
                result = await organisms_collection.update_one(
                    {'id': organism_id},
                    {'$set': {'qr_code_image': new_qr_code}}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"✓ Updated: {organism_name} (ID: {organism_id})")
                else:
                    print(f"⚠ Not modified: {organism_name} (ID: {organism_id})")
                    
            except Exception as e:
                print(f"✗ Error updating {organism_name}: {str(e)}")
        
        print("-" * 60)
        print(f"\n✓ Completed! Updated {updated_count} out of {len(organisms)} organisms.")
        print(f"QR codes now point to: {FRONTEND_URL}/organism/{{organism_id}}")
        
    except Exception as e:
        print(f"✗ Database error: {str(e)}")
        sys.exit(1)
    finally:
        client.close()


if __name__ == '__main__':
    print("=" * 60)
    print("BioMuseum QR Code Fixer")
    print("=" * 60)
    print()
    
    asyncio.run(fix_qr_codes())
