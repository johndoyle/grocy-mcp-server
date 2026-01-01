# Grocy MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides comprehensive access to the [Grocy](https://grocy.info/) API. This server enables AI assistants like Claude to interact with your Grocy instance for managing groceries, recipes, chores, tasks, batteries, and shopping lists.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI assistants to securely connect to external data sources and tools. This server implements MCP to expose Grocy's functionality, allowing AI assistants to help you manage your household inventory, meal planning, and task tracking.

## Features

- **Complete Grocy API Coverage**: 34+ tools covering all major Grocy endpoints
- **Stock Management**: Track inventory, add/consume products, manage locations
- **Shopping Lists**: Add items, remove items, auto-add missing/expired products
- **Recipes**: Check fulfillment, consume ingredients, add to shopping list
- **Chores & Tasks**: Track household chores and personal tasks
- **Batteries**: Monitor and track battery charging cycles
- **Barcode Support**: Look up products by barcode
- **Stdio Transport**: Works with Claude Desktop and other MCP clients

## Prerequisites

- **Grocy Instance**: A running Grocy installation (Docker or standalone)
- **Grocy API Key**: Generate from Grocy's API settings page
- **Docker & Docker Compose**: For running the MCP server (recommended)
- **Node.js 18+**: For local development (optional)

## Installation

### Option 1: Docker with Grocy (Complete Setup)

This option installs both Grocy and the MCP server together. Perfect if you don't have Grocy yet.

1. **Clone the repository:**
```bash
git clone https://github.com/johndoyle/grocy-mcp-server.git
cd grocy-mcp-server
```

2. **Start the containers:**
```bash
docker compose up -d
```

This will start:
- **Grocy** on `http://localhost:9283`
- **MCP Server** (stdio mode) ready for Claude Desktop

3. **Get your Grocy API key:**
   - Open Grocy at `http://localhost:9283`
   - Complete initial setup
   - Navigate to **Manage API keys** (under user settings)
   - Create a new API key and copy it

4. **Configure the API key:**
```bash
echo "GROCY_API_KEY=your_api_key_here" > .env
docker compose restart grocy-mcp-server
```

Your MCP server is now running and ready to connect to Claude Desktop (see [Connecting to Claude Desktop](#connecting-to-claude-desktop)).

### Option 2: Docker without Grocy (Existing Grocy Instance)

If you already have Grocy running elsewhere, install just the MCP server.

1. **Clone the repository:**
```bash
git clone https://github.com/johndoyle/grocy-mcp-server.git
cd grocy-mcp-server
```

2. **Build the Docker image:**
```bash
npm install
npm run build
docker build -t grocy-mcp-server:latest .
```

3. **Run the container:**
```bash
docker run -d \
  --name grocy-mcp-server \
  -e GROCY_BASE_URL="http://your-grocy-host:port/api" \
  -e GROCY_API_KEY="your_api_key_here" \
  -e TRANSPORT="stdio" \
  grocy-mcp-server:latest
```

For HTTP/SSE mode, add port mapping:
```bash
docker run -d \
  --name grocy-mcp-server \
  -p 3000:3000 \
  -e GROCY_BASE_URL="http://your-grocy-host:port/api" \
  -e GROCY_API_KEY="your_api_key_here" \
  -e TRANSPORT="http" \
  -e PORT="3000" \
  grocy-mcp-server:latest
```

Your MCP server is now running and ready to connect to Claude Desktop (see [Connecting to Claude Desktop](#connecting-to-claude-desktop)).

### Option 3: Local Installation (Development)

For development or if you prefer not to use Docker:

1. **Clone and install:**
```bash
git clone https://github.com/johndoyle/grocy-mcp-server.git
cd grocy-mcp-server
npm install
```

2. **Build:**
```bash
npm run build
```

3. **Run:**
```bash
# Stdio mode
GROCY_BASE_URL="http://your-grocy:port/api" \
GROCY_API_KEY="your_key" \
npm start

# HTTP/SSE mode
GROCY_BASE_URL="http://your-grocy:port/api" \
GROCY_API_KEY="your_key" \
TRANSPORT="http" \
PORT="3000" \
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GROCY_BASE_URL` | Grocy API base URL | `http://grocy:80/api` | No |
| `GROCY_API_KEY` | Grocy API key | - | **Yes** |
| `TRANSPORT` | Transport protocol (`stdio` or `http`) | `stdio` | No |
| `PORT` | HTTP server port (when using `http` transport) | `3000` | No |

### Getting Your Grocy API Key

1. Open your Grocy web interface
2. Navigate to **Manage API keys** (usually under user settings)
3. Create a new API key
4. Copy the key and add it to your `.env` file or environment variables

**Important**: If your Grocy instance is behind Home Assistant ingress, use the **local network URL** (e.g., `http://grocy:80/api` or `http://192.168.x.x:port/api`) instead of the ingress URL. The ingress authentication is only for browser sessions.

## Connecting to Claude Desktop

Once your MCP server is running, connect it to Claude Desktop using one of these methods:

### Method 1: Stdio via SSH (Recommended for Docker)

This method works with the Docker container over SSH. Best for remote servers.

**Configuration file location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Add to your config:**
```json
{
  "mcpServers": {
    "grocy": {
      "command": "ssh",
      "args": [
        "user@hostname",
        "docker",
        "exec",
        "-i",
        "grocy-mcp-server",
        "node",
        "build/index.js"
      ]
    }
  }
}
```

Replace `user@hostname` with your server details. Ensure you have passwordless SSH configured (SSH keys).

### Method 2: Local Stdio

If running the MCP server locally (not in Docker):

```json
{
  "mcpServers": {
    "grocy": {
      "command": "node",
      "args": ["/absolute/path/to/grocy-mcp-server/build/index.js"],
      "env": {
        "GROCY_BASE_URL": "http://your-grocy:port/api",
        "GROCY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Method 3: HTTP/SSE (Experimental)

For direct HTTP connections without SSH:

1. **Start the MCP server in HTTP mode:**
```bash
# Update .env or docker-compose.yml
TRANSPORT=http
PORT=3000

# Restart container
docker compose up -d
```

2. **Add to Claude Desktop config:**
```json
{
  "mcpServers": {
    "grocy": {
      "url": "http://your-server-ip:3000/sse",
      "transport": "sse"
    }
  }
}
```

**HTTP Endpoints:**
- SSE Stream: `http://localhost:3000/sse` (GET)
- Messages: `http://localhost:3000/message` (POST)
- Health Check: `http://localhost:3000/health` (GET)

### Testing the Connection

After configuring Claude Desktop:

1. Restart Claude Desktop
2. Start a new conversation
3. Ask Claude: "Can you list my Grocy products?"
4. Claude should connect to the MCP server and return your products

If connection fails, check:
- MCP server is running: `docker ps | grep grocy-mcp-server`
- Logs for errors: `docker logs grocy-mcp-server`
- SSH connection works (for Method 1)
- API key is correct

## Available Tools

### Stock Management (14 tools)

| Tool | Description |
|------|-------------|
| `get_stock` | Get current stock for all products |
| `get_volatile_stock` | Get products expiring soon |
| `get_product_details` | Get detailed info for a specific product |
| `get_products` | List all products |
| `search_products` | Search products by name |
| `get_product_by_barcode` | Look up product by barcode |
| `get_product_entries` | Get all stock entries for a product |
| `get_locations` | Get all storage locations |
| `add_product` | Add stock (purchase) |
| `consume_product` | Remove stock (consume/use) |
| `transfer_product` | Transfer between locations |
| `inventory_product` | Set absolute stock amount |
| `open_product` | Mark product as opened |

### Shopping List (6 tools)

| Tool | Description |
|------|-------------|
| `get_shopping_list` | Get all shopping list items |
| `add_to_shopping_list` | Add product to shopping list |
| `remove_from_shopping_list` | Remove product from shopping list |
| `add_missing_products_to_shopping_list` | Auto-add products below minimum stock |
| `add_expired_products_to_shopping_list` | Auto-add expired products |
| `clear_shopping_list` | Clear entire shopping list |

### Recipes (4 tools)

| Tool | Description |
|------|-------------|
| `get_recipes` | List all recipes |
| `get_recipe_fulfillment` | Check if ingredients are in stock |
| `consume_recipe` | Consume ingredients for a recipe |
| `add_recipe_to_shopping_list` | Add missing ingredients to shopping list |

### Chores (3 tools)

| Tool | Description |
|------|-------------|
| `get_chores` | List all chores |
| `get_chore_details` | Get details for a specific chore |
| `execute_chore` | Mark chore as completed |

### Tasks (2 tools)

| Tool | Description |
|------|-------------|
| `get_tasks` | List all tasks |
| `complete_task` | Mark task as completed |

### Batteries (3 tools)

| Tool | Description |
|------|-------------|
| `get_batteries` | List all batteries and charge status |
| `get_battery_details` | Get details for a specific battery |
| `charge_battery` | Track battery charging |

### System (2 tools)

| Tool | Description |
|------|-------------|
| `get_system_info` | Get Grocy system information |
| `get_userfields` | Get custom user fields for an entity |

### Bulk Operations & Smart Tools (6 tools)

| Tool | Description |
|------|-------------|
| `create_recipe_with_ingredients` | Create a complete recipe with all ingredients in one call |
| `add_recipe_missing_to_shopping_list` | Calculate missing ingredients and add to shopping list |
| `match_product_by_name` | Fuzzy search products with confidence scores |
| `bulk_get_stock` | Get stock levels for multiple products at once |
| `get_recipe_with_stock_status` | Get recipe with detailed stock status per ingredient |
| `bulk_add_to_shopping_list` | Add multiple items to shopping list in one call |

### Generic Entity CRUD (4 tools)

| Tool | Description |
|------|-------------|
| `create_entity` | Create any entity (products, locations, recipes, etc.) |
| `update_entity` | Update an existing entity |
| `delete_entity` | Delete an entity |
| `get_entity` | Get a specific entity by ID |

### BeerSmith Integration (1 tool)

| Tool | Description |
|------|-------------|
| `list_brewing_ingredients` | Export brewing ingredients with pricing for BeerSmith price sync |

## Bulk Operations Examples

### Create Recipe with Ingredients
```json
call create_recipe_with_ingredients {
  "recipe": {"name": "Pale Ale", "description": "Classic American pale ale"},
  "ingredients": [
    {"product_id": 65, "amount": 3.88, "note": "Maris Otter"},
    {"product_id": 74, "amount": 0.5, "note": "Crystal malt"}
  ]
}
```

### Smart Shopping List from Recipe
```json
call add_recipe_missing_to_shopping_list {"recipe_id": 17, "servings": 2}
```

### Fuzzy Product Matching
```json
call match_product_by_name {"name": "Golden Promise", "fuzzy": true}
// Returns matches with confidence scores
```

### Bulk Stock Check
```json
call bulk_get_stock {"product_ids": [65, 74, 12, 17, 75]}
```

### BeerSmith Price Sync
Export brewing ingredients with pricing data for sync with BeerSmith:
```json
call list_brewing_ingredients {"product_group_filter": "Brewing"}
// Returns products with name, price, quantity unit, and product group
```

Filter by specific categories:
```json
call list_brewing_ingredients {"product_group_filter": "Hops"}
```

Include all products regardless of pricing:
```json
call list_brewing_ingredients {"include_all_products": true}
```

## Development

### Testing the MCP Server

For development and testing, use the included interactive client:

```bash
npm run dev-client
```

This provides a REPL interface:
- `list` - List all available tools
- `call <toolName> <jsonArgs>` - Call a tool
- `help` - Show available commands
- `exit` - Close the client

Example:
```
> list
> call get_products {}
> call add_product {"product_id": 5, "amount": 2}
```

### Project Structure

```
grocy-mcp-server/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript (generated)
├── dev/
│   ├── mcp-ssh-client.js # Interactive test client
│   └── README.md         # Development client docs
├── .vscode/
│   └── launch.json       # VS Code debug configuration
├── docker-compose.yml    # Docker Compose setup
├── Dockerfile           # Container definition
├── package.json         # Node.js dependencies
└── tsconfig.json        # TypeScript configuration
```

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
GROCY_BASE_URL="http://localhost:9283/api" \
GROCY_API_KEY="your_key" \
npm start
```

### Development with Docker

The development setup includes:
- Local Grocy instance on port 9283
- MCP server in a container
- Hot-reload support via volume mounting

```bash
# Build and start containers
docker compose up --build

# View logs
docker logs -f grocy-mcp-server

# Rebuild after code changes
npm run build
docker compose restart grocy-mcp-server
```

### Testing with the Development Client

```bash
# Run the interactive client
npm run dev-client

# Or with custom SSH args
MCP_SSH_ARGS='["user@host","docker","exec","-i","grocy-mcp-server","node","build/index.js"]' \
npm run dev-client
```

## Troubleshooting

### 401 Unauthorized Errors

- **Check API Key**: Verify your `GROCY_API_KEY` is correct
- **Check URL**: Use local network URL, not Home Assistant ingress URL
- **Test manually**: `curl -H "GROCY-API-KEY: your_key" http://your-grocy/api/system/info`

### Connection Issues

- **Container networking**: Ensure `grocy-mcp-server` can reach `grocy` container
- **Firewall**: Check firewall rules if accessing remote Grocy
- **SSH keys**: Ensure passwordless SSH is configured for remote access

### Build Permission Errors

If you get EACCES errors when building:
```bash
sudo chown -R $USER:$USER build/
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Grocy](https://grocy.info/) - The amazing self-hosted grocery & household management solution
- [Model Context Protocol](https://modelcontextprotocol.io) - The standard for connecting AI to external tools
- [Anthropic](https://www.anthropic.com/) - For Claude and MCP SDK

## Links

- [Grocy GitHub](https://github.com/grocy/grocy)
- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [BeerSmith MCP Server](https://github.com/johndoyle/BeerSmith-MCP-Server) - Integrate with BeerSmith recipes

## Integration Guides

- **[BeerSmith + Grocy Integration](docs/BEERSMITH_INTEGRATION.md)** - Complete guide for managing brewing ingredients and recipes using both MCP servers together
