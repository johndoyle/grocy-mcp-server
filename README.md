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

### Option 1: Docker Compose (Recommended)

This repository includes a complete Docker Compose setup with both Grocy and the MCP server.

1. Clone the repository:
```bash
git clone https://github.com/johndoyle/grocy-mcp-server.git
cd grocy-mcp-server
```

2. Create a `.env` file with your Grocy API key:
```bash
echo "GROCY_API_KEY=your_api_key_here" > .env
```

3. Start the services:
```bash
docker compose up -d
```

### Option 2: Standalone Installation

If you have an existing Grocy instance:

1. Clone and install dependencies:
```bash
git clone https://github.com/johndoyle/grocy-mcp-server.git
cd grocy-mcp-server
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Set environment variables:
```bash
export GROCY_BASE_URL="http://your-grocy-host:port/api"
export GROCY_API_KEY="your_api_key_here"
```

4. Run the server:
```bash
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GROCY_BASE_URL` | Grocy API base URL | `http://grocy:80/api` | No |
| `GROCY_API_KEY` | Grocy API key | - | **Yes** |

### Getting Your Grocy API Key

1. Open your Grocy web interface
2. Navigate to **Manage API keys** (usually under user settings)
3. Create a new API key
4. Copy the key and add it to your `.env` file or environment variables

**Important**: If your Grocy instance is behind Home Assistant ingress, use the **local network URL** (e.g., `http://grocy:80/api` or `http://192.168.x.x:port/api`) instead of the ingress URL. The ingress authentication is only for browser sessions.

## Usage

### With Claude Desktop

Add the following to your Claude Desktop MCP configuration file:

**Local Setup:**
```json
{
  "mcpServers": {
    "grocy": {
      "command": "node",
      "args": ["/path/to/grocy-mcp-server/build/index.js"],
      "env": {
        "GROCY_BASE_URL": "http://your-grocy-host:port/api",
        "GROCY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Remote Docker Setup (via SSH):**
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

### With VS Code (Development Client)

This repository includes an interactive development client for testing:

1. Edit `.vscode/launch.json` with your SSH/Docker details
2. Open the Run view in VS Code
3. Select **Run MCP SSH Client** and start debugging
4. Use the interactive REPL:
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

## Development

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
