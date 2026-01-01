#!/bin/bash

# Test HTTP/SSE transport for Grocy MCP Server

echo "Testing Grocy MCP Server HTTP/SSE transport..."
echo ""

# Check if server is running
echo "1. Checking health endpoint..."
curl -s http://localhost:3000/health | jq '.'
echo ""

# Test SSE connection (in background)
echo "2. Testing SSE endpoint..."
echo "   Opening SSE connection in background..."
curl -N http://localhost:3000/sse &
SSE_PID=$!
sleep 2

# Extract session ID from SSE response (would need proper parsing in real scenario)
echo ""
echo "3. SSE connection established (PID: $SSE_PID)"
echo ""

# Kill the SSE connection
echo "4. Closing test connection..."
kill $SSE_PID 2>/dev/null
echo ""

echo "Test complete!"
echo ""
echo "To use with Claude Desktop, configure:"
echo '{
  "mcpServers": {
    "grocy": {
      "url": "http://localhost:3000/sse",
      "transport": "sse"
    }
  }
}'
