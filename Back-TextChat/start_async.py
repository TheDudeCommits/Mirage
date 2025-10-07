#!/usr/bin/env python3
"""
Startup script for Quart async application using Hypercorn
"""
import subprocess
import sys

if __name__ == "__main__":
    # Run the Quart app with Hypercorn ASGI server
    cmd = [
        "hypercorn", 
        "--bind", "0.0.0.0:5000",
        "--reload",
        "main:app"
    ]
    
    print("Starting Quart application with Hypercorn...")
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        sys.exit(1)