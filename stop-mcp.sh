#!/bin/bash

if [ ! -f mcp-server.pid ]; then
    echo "⚠ MCP server doesn't appear to be running (no PID file found)"
    exit 1
fi

PID=$(cat mcp-server.pid)

if ps -p $PID > /dev/null 2>&1; then
    echo "Stopping MCP server (PID: $PID)..."
    kill $PID
    rm mcp-server.pid
    echo "✓ MCP server stopped"
else
    echo "⚠ Process $PID not found (may have already stopped)"
    rm mcp-server.pid
fi
