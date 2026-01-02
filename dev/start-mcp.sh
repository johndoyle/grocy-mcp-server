#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Loaded environment variables from .env"
else
    echo "⚠ Warning: .env file not found"
    exit 1
fi

echo ""
echo "⚠ Note: MCP servers run via stdio and are typically invoked by MCP clients"
echo "  (like Claude Desktop), not as background processes."
echo ""
echo "Options:"
echo "  1. Run interactively: npm start"
echo "  2. Configure in Claude Desktop's MCP settings"
echo "  3. Use the dev client: npm run dev-client"
echo ""
echo "If you want to test the server, it will start now but may exit immediately"
echo "without a client connection."
echo ""
read -p "Continue anyway? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

# Check if already running
if [ -f mcp-server.pid ]; then
    PID=$(cat mcp-server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "⚠ MCP server is already running (PID: $PID)"
        echo "  Use ./stop-mcp.sh to stop it first"
        exit 1
    else
        rm mcp-server.pid
    fi
fi

# Start the server in the background
echo "Starting MCP server..."
nohup npm start > mcp-server.log 2>&1 &
SERVER_PID=$!

# Save the PID
echo $SERVER_PID > mcp-server.pid

# Give it a moment to start
sleep 1

# Check if it's still running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✓ MCP server started in background (PID: $SERVER_PID)"
    echo "  Log file: mcp-server.log"
    echo "  Stop with: ./stop-mcp.sh"
    echo "  View logs: tail -f mcp-server.log"
else
    echo "⚠ Server exited immediately (this is expected for stdio-based MCP servers)"
    echo "  See mcp-server.log for details"
    rm mcp-server.pid
    exit 1
fi
