#!/bin/bash

echo "🚀 MCP Server Builder - Starting Application"
echo "============================================"
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed!"
    echo ""
    echo "Please install Maven first:"
    echo "  - Ubuntu/Debian: sudo apt-get install maven"
    echo "  - macOS: brew install maven"
    echo "  - Windows: Download from https://maven.apache.org/"
    echo ""
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed!"
    echo ""
    echo "Please install Java 17 or higher:"
    echo "  - Ubuntu/Debian: sudo apt-get install openjdk-17-jdk"
    echo "  - macOS: brew install openjdk@17"
    echo "  - Windows: Download from https://adoptium.net/"
    echo ""
    exit 1
fi

echo "✅ Maven found: $(mvn -version | head -n 1)"
echo "✅ Java found: $(java -version 2>&1 | head -n 1)"
echo ""

# Build the application if not already built
if [ ! -f "target/mcp-server-builder-1.0.0.jar" ]; then
    echo "📦 Building application..."
    mvn clean package -DskipTests
    echo ""
fi

# Start the application
echo "🎯 Starting Spring Boot application on http://localhost:8080"
echo "💡 Press Ctrl+C to stop"
echo ""

mvn spring-boot:run
