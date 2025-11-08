#!/bin/bash

# Quick validation script to test Codespaces setup
# This validates that all configuration files are correct

set -e

echo "🔍 Validating GitHub Codespaces UI Development Setup..."
echo ""

# Check devcontainer files
echo "📋 Checking devcontainer configuration..."
if [ -f ".devcontainer/devcontainer.json" ]; then
    echo "✓ .devcontainer/devcontainer.json exists"
else
    echo "✗ .devcontainer/devcontainer.json missing"
    exit 1
fi

if [ -f ".devcontainer/docker-compose.yml" ]; then
    echo "✓ .devcontainer/docker-compose.yml exists"
else
    echo "✗ .devcontainer/docker-compose.yml missing"
    exit 1
fi

# Check VS Code configuration
echo ""
echo "📋 Checking VS Code configuration..."
for file in settings.json tasks.json launch.json extensions.json; do
    if [ -f ".vscode/$file" ]; then
        echo "✓ .vscode/$file exists"
    else
        echo "✗ .vscode/$file missing"
        exit 1
    fi
done

# Check development scripts
echo ""
echo "📋 Checking development scripts..."
if [ -x "dev-ui.sh" ]; then
    echo "✓ dev-ui.sh exists and is executable"
else
    echo "✗ dev-ui.sh missing or not executable"
    exit 1
fi

# Check documentation
echo ""
echo "📋 Checking documentation..."
if [ -f "CODESPACES.md" ]; then
    echo "✓ CODESPACES.md exists"
else
    echo "✗ CODESPACES.md missing"
    exit 1
fi

# Validate Vite configuration
echo ""
echo "📋 Validating Vite configuration..."
cd frontend
if [ -f "vite.config.js" ]; then
    echo "✓ vite.config.js exists"
    
    # Check for key HMR settings
    if grep -q "host: '0.0.0.0'" vite.config.js; then
        echo "✓ Vite configured to listen on all interfaces"
    else
        echo "⚠ Warning: Vite might not be accessible from outside"
    fi
    
    if grep -q "hmr:" vite.config.js; then
        echo "✓ HMR configuration present"
    else
        echo "⚠ Warning: HMR configuration not found"
    fi
else
    echo "✗ vite.config.js missing"
    exit 1
fi

# Check frontend dependencies
echo ""
echo "📋 Checking frontend dependencies..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules exists"
else
    echo "⚠ node_modules not found - run 'npm install' in frontend directory"
fi

cd ..

# Validate Docker Compose
echo ""
echo "📋 Validating Docker Compose configuration..."
if command -v docker &> /dev/null; then
    if docker compose config > /dev/null 2>&1; then
        echo "✓ docker-compose.yml is valid"
    else
        echo "⚠ Warning: docker-compose.yml might have issues"
    fi
else
    echo "⚠ Docker not available (this is OK in Codespaces)"
fi

echo ""
echo "✅ All validation checks passed!"
echo ""
echo "🚀 You're ready to develop the UI!"
echo "   Run: ./dev-ui.sh"
echo "   Or:  cd frontend && npm run dev"
echo ""
