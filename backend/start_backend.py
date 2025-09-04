#!/usr/bin/env python3
"""
FastAPI Backend Startup Script
This script starts the FastAPI backend server with proper configuration.
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the src directory to the Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print(f"Starting FastAPI backend on {host}:{port}")
    print(f"Reload mode: {reload}")
    print(f"Python path includes: {src_dir}")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        reload_dirs=[str(src_dir)],
        log_level="info"
    )
