#!/bin/bash

# Game Design Review System - Startup Script

echo "🎮 Game Design Review System"
echo "=============================="
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    echo "🚀 Starting development server..."
    echo "📱 Open your browser and go to: http://localhost:8000"
    echo "📁 Or open index.html directly in your browser"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    echo "🚀 Starting development server..."
    echo "📱 Open your browser and go to: http://localhost:8000"
    echo "📁 Or open index.html directly in your browser"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m http.server 8000
elif command -v node &> /dev/null; then
    echo "✅ Node.js found"
    echo "🚀 Starting development server..."
    echo "📱 Open your browser and go to: http://localhost:8000"
    echo "📁 Or open index.html directly in your browser"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    npx http-server -p 8000 -c-1
else
    echo "❌ No Python or Node.js found"
    echo ""
    echo "📁 You can still use the application by opening index.html directly in your browser"
    echo "📖 For more information, see README.md"
    echo ""
    echo "To install a local server:"
    echo "  - Install Python: https://www.python.org/downloads/"
    echo "  - Or install Node.js: https://nodejs.org/"
    echo ""
    read -p "Press Enter to open index.html in your default browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open index.html
    elif command -v open &> /dev/null; then
        open index.html
    else
        echo "Please open index.html manually in your browser"
    fi
fi