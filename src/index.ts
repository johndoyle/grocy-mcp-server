import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";

interface GrocyConfig {
  baseUrl: string;
  apiKey: string;
}

class GrocyMCPServer {
  private server: Server;
  private axiosInstance: AxiosInstance;

  constructor(config: GrocyConfig) {
    this.server = new Server(
      {
        name: "grocy-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        "GROCY-API-KEY": config.apiKey,
        "Content-Type": "application/json",
      },
    });
    
    // Debug: log API key prefix for verification
    console.error(`API key starts with: ${config.apiKey.substring(0, 10)}...`);

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Stock Management
        {
          name: "get_stock",
          description: "Get current stock information for all products",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_volatile_stock",
          description: "Get volatile stock information (products expiring soon)",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_product_details",
          description: "Get details for a specific product by ID",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID" },
            },
            required: ["product_id"],
          },
        },
        {
          name: "add_product",
          description: "Add stock of a product (purchase)",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to add stock for" },
              amount: { type: "number", description: "Amount to add" },
              best_before_date: { type: "string", description: "Best before date (YYYY-MM-DD format, optional)" },
              price: { type: "number", description: "Price per unit (optional)" },
            },
            required: ["product_id", "amount"],
          },
        },
        {
          name: "consume_product",
          description: "Consume/remove stock of a product",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to consume" },
              amount: { type: "number", description: "Amount to consume" },
              spoiled: { type: "boolean", description: "Mark as spoiled (optional)" },
            },
            required: ["product_id", "amount"],
          },
        },
        {
          name: "transfer_product",
          description: "Transfer product stock to a different location",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to transfer" },
              amount: { type: "number", description: "Amount to transfer" },
              location_id_from: { type: "number", description: "Source location ID" },
              location_id_to: { type: "number", description: "Destination location ID" },
            },
            required: ["product_id", "amount", "location_id_from", "location_id_to"],
          },
        },
        {
          name: "inventory_product",
          description: "Set absolute stock amount for a product (inventory/stocktaking)",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID" },
              new_amount: { type: "number", description: "New absolute stock amount" },
              best_before_date: { type: "string", description: "Best before date (YYYY-MM-DD, optional)" },
            },
            required: ["product_id", "new_amount"],
          },
        },
        {
          name: "open_product",
          description: "Mark a product as opened",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to open" },
              amount: { type: "number", description: "Amount to open (default: 1)" },
            },
            required: ["product_id"],
          },
        },
        {
          name: "get_product_by_barcode",
          description: "Get product information by scanning barcode",
          inputSchema: {
            type: "object",
            properties: {
              barcode: { type: "string", description: "Product barcode" },
            },
            required: ["barcode"],
          },
        },
        {
          name: "get_products",
          description: "Get list of all products in Grocy",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "search_products",
          description: "Search for products by name",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search term" },
            },
            required: ["query"],
          },
        },
        {
          name: "get_product_entries",
          description: "Get all stock entries for a specific product",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID" },
            },
            required: ["product_id"],
          },
        },
        {
          name: "get_locations",
          description: "Get all storage locations",
          inputSchema: { type: "object", properties: {} },
        },
        
        // Shopping List
        {
          name: "get_shopping_list",
          description: "Get all items on shopping lists",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "add_to_shopping_list",
          description: "Add a product to shopping list",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to add" },
              amount: { type: "number", description: "Amount to add (default: 1)" },
            },
            required: ["product_id"],
          },
        },
        {
          name: "remove_from_shopping_list",
          description: "Remove a product from shopping list",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to remove" },
              amount: { type: "number", description: "Amount to remove (default: 1)" },
            },
            required: ["product_id"],
          },
        },
        {
          name: "add_missing_products_to_shopping_list",
          description: "Add all products below their minimum stock amount to shopping list",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "add_expired_products_to_shopping_list",
          description: "Add all expired products to shopping list",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "clear_shopping_list",
          description: "Clear entire shopping list",
          inputSchema: { type: "object", properties: {} },
        },

        // Recipes
        {
          name: "get_recipes",
          description: "Get all recipes",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_recipe_fulfillment",
          description: "Check if recipe requirements are fulfilled by current stock",
          inputSchema: {
            type: "object",
            properties: {
              recipe_id: { type: "number", description: "Recipe ID" },
            },
            required: ["recipe_id"],
          },
        },
        {
          name: "consume_recipe",
          description: "Consume products needed for a recipe",
          inputSchema: {
            type: "object",
            properties: {
              recipe_id: { type: "number", description: "Recipe ID to consume" },
            },
            required: ["recipe_id"],
          },
        },
        {
          name: "add_recipe_to_shopping_list",
          description: "Add missing products for recipe to shopping list",
          inputSchema: {
            type: "object",
            properties: {
              recipe_id: { type: "number", description: "Recipe ID" },
            },
            required: ["recipe_id"],
          },
        },

        // Chores
        {
          name: "get_chores",
          description: "Get all chores",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_chore_details",
          description: "Get details for a specific chore",
          inputSchema: {
            type: "object",
            properties: {
              chore_id: { type: "number", description: "Chore ID" },
            },
            required: ["chore_id"],
          },
        },
        {
          name: "execute_chore",
          description: "Mark a chore as completed",
          inputSchema: {
            type: "object",
            properties: {
              chore_id: { type: "number", description: "Chore ID to execute" },
              tracked_time: { type: "string", description: "Execution timestamp (optional, ISO format)" },
            },
            required: ["chore_id"],
          },
        },

        // Tasks
        {
          name: "get_tasks",
          description: "Get all tasks",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "complete_task",
          description: "Mark a task as completed",
          inputSchema: {
            type: "object",
            properties: {
              task_id: { type: "number", description: "Task ID to complete" },
            },
            required: ["task_id"],
          },
        },

        // Batteries
        {
          name: "get_batteries",
          description: "Get all batteries and their charge status",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_battery_details",
          description: "Get details for a specific battery",
          inputSchema: {
            type: "object",
            properties: {
              battery_id: { type: "number", description: "Battery ID" },
            },
            required: ["battery_id"],
          },
        },
        {
          name: "charge_battery",
          description: "Track battery charging",
          inputSchema: {
            type: "object",
            properties: {
              battery_id: { type: "number", description: "Battery ID to charge" },
              tracked_time: { type: "string", description: "Charge timestamp (optional, ISO format)" },
            },
            required: ["battery_id"],
          },
        },

        // System & Info
        {
          name: "get_system_info",
          description: "Get Grocy system information",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_userfields",
          description: "Get custom user fields for an entity",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Entity name (e.g., 'products', 'chores')" },
              object_id: { type: "number", description: "Object ID" },
            },
            required: ["entity", "object_id"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (!args) {
          throw new Error("Arguments are required");
        }

        switch (name) {
          // Stock Management
          case "get_stock": {
            const response = await this.axiosInstance.get("/stock");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_volatile_stock": {
            const response = await this.axiosInstance.get("/stock/volatile");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_product_details": {
            const productId = args.product_id as number;
            const response = await this.axiosInstance.get(`/stock/products/${productId}`);
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "add_product": {
            const productId = args.product_id as number;
            const amount = args.amount as number;
            const bestBeforeDate = args.best_before_date as string | undefined;
            const price = args.price as number | undefined;
            
            const data: any = {
              amount: amount,
              best_before_date: bestBeforeDate || "2099-12-31",
            };
            if (price !== undefined) data.price = price;
            
            await this.axiosInstance.post(`/stock/products/${productId}/add`, data);
            return {
              content: [{ type: "text", text: `Successfully added ${amount} units of product ${productId}` }],
            };
          }

          case "consume_product": {
            const productId = args.product_id as number;
            const amount = args.amount as number;
            const spoiled = args.spoiled as boolean | undefined;
            
            const data: any = { amount: amount };
            if (spoiled !== undefined) data.spoiled = spoiled;
            
            await this.axiosInstance.post(`/stock/products/${productId}/consume`, data);
            return {
              content: [{ type: "text", text: `Successfully consumed ${amount} units of product ${productId}` }],
            };
          }

          case "transfer_product": {
            const productId = args.product_id as number;
            const amount = args.amount as number;
            const locationIdFrom = args.location_id_from as number;
            const locationIdTo = args.location_id_to as number;
            
            const data = {
              amount: amount,
              location_id_from: locationIdFrom,
              location_id_to: locationIdTo,
            };
            await this.axiosInstance.post(`/stock/products/${productId}/transfer`, data);
            return {
              content: [{ type: "text", text: `Successfully transferred ${amount} units of product ${productId}` }],
            };
          }

          case "inventory_product": {
            const productId = args.product_id as number;
            const newAmount = args.new_amount as number;
            const bestBeforeDate = args.best_before_date as string | undefined;
            
            const data: any = { new_amount: newAmount };
            if (bestBeforeDate) data.best_before_date = bestBeforeDate;
            
            await this.axiosInstance.post(`/stock/products/${productId}/inventory`, data);
            return {
              content: [{ type: "text", text: `Successfully set stock of product ${productId} to ${newAmount}` }],
            };
          }

          case "open_product": {
            const productId = args.product_id as number;
            const amount = (args.amount as number) || 1;
            
            const data = { amount: amount };
            await this.axiosInstance.post(`/stock/products/${productId}/open`, data);
            return {
              content: [{ type: "text", text: `Successfully opened ${amount} unit(s) of product ${productId}` }],
            };
          }

          case "get_product_by_barcode": {
            const barcode = args.barcode as string;
            const response = await this.axiosInstance.get(`/stock/products/by-barcode/${barcode}`);
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_products": {
            const response = await this.axiosInstance.get("/objects/products");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "search_products": {
            const query = args.query as string;
            const response = await this.axiosInstance.get("/objects/products");
            const products = response.data.filter((p: any) =>
              p.name.toLowerCase().includes(query.toLowerCase())
            );
            return {
              content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
            };
          }

          case "get_product_entries": {
            const productId = args.product_id as number;
            const response = await this.axiosInstance.get(`/stock/products/${productId}/entries`);
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_locations": {
            const response = await this.axiosInstance.get("/objects/locations");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          // Shopping List
          case "get_shopping_list": {
            const response = await this.axiosInstance.get("/objects/shopping_list");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "add_to_shopping_list": {
            const productId = args.product_id as number;
            const amount = (args.amount as number) || 1;
            
            const data = { product_id: productId, amount: amount };
            await this.axiosInstance.post("/stock/shoppinglist/add-product", data);
            return {
              content: [{ type: "text", text: `Successfully added product ${productId} to shopping list` }],
            };
          }

          case "remove_from_shopping_list": {
            const productId = args.product_id as number;
            const amount = (args.amount as number) || 1;
            
            const data = { product_id: productId, amount: amount };
            await this.axiosInstance.post("/stock/shoppinglist/remove-product", data);
            return {
              content: [{ type: "text", text: `Successfully removed product ${productId} from shopping list` }],
            };
          }

          case "add_missing_products_to_shopping_list": {
            await this.axiosInstance.post("/stock/shoppinglist/add-missing-products");
            return {
              content: [{ type: "text", text: "Successfully added missing products to shopping list" }],
            };
          }

          case "add_expired_products_to_shopping_list": {
            await this.axiosInstance.post("/stock/shoppinglist/add-expired-products");
            return {
              content: [{ type: "text", text: "Successfully added expired products to shopping list" }],
            };
          }

          case "clear_shopping_list": {
            await this.axiosInstance.post("/stock/shoppinglist/clear");
            return {
              content: [{ type: "text", text: "Successfully cleared shopping list" }],
            };
          }

          // Recipes
          case "get_recipes": {
            const response = await this.axiosInstance.get("/objects/recipes");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_recipe_fulfillment": {
            const recipeId = args.recipe_id as number;
            const response = await this.axiosInstance.get(`/recipes/${recipeId}/fulfillment`);
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "consume_recipe": {
            const recipeId = args.recipe_id as number;
            await this.axiosInstance.post(`/recipes/${recipeId}/consume`);
            return {
              content: [{ type: "text", text: `Successfully consumed recipe ${recipeId}` }],
            };
          }

          case "add_recipe_to_shopping_list": {
            const recipeId = args.recipe_id as number;
            await this.axiosInstance.post(`/recipes/${recipeId}/add-not-fulfilled-products-to-shoppinglist`);
            return {
              content: [{ type: "text", text: `Successfully added recipe ${recipeId} to shopping list` }],
            };
          }

          // Chores
          case "get_chores": {
            const response = await this.axiosInstance.get("/objects/chores");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_chore_details": {
            const choreId = args.chore_id as number;
            const response = await this.axiosInstance.get(`/chores/${choreId}`);
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "execute_chore": {
            const choreId = args.chore_id as number;
            const trackedTime = args.tracked_time as string | undefined;
            
            const data: any = {};
            if (trackedTime) data.tracked_time = trackedTime;
            
            await this.axiosInstance.post(`/chores/${choreId}/execute`, data);
            return {
              content: [{ type: "text", text: `Successfully executed chore ${choreId}` }],
            };
          }

          // Tasks
          case "get_tasks": {
            const response = await this.axiosInstance.get("/objects/tasks");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "complete_task": {
            const taskId = args.task_id as number;
            await this.axiosInstance.post(`/tasks/${taskId}/complete`);
            return {
              content: [{ type: "text", text: `Successfully completed task ${taskId}` }],
            };
          }

          // Batteries
          case "get_batteries": {
            const response = await this.axiosInstance.get("/objects/batteries");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_battery_details": {
            const batteryId = args.battery_id as number;
            const response = await this.axiosInstance.get(`/batteries/${batteryId}`);
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "charge_battery": {
            const batteryId = args.battery_id as number;
            const trackedTime = args.tracked_time as string | undefined;
            
            const data: any = {};
            if (trackedTime) data.tracked_time = trackedTime;
            
            await this.axiosInstance.post(`/batteries/${batteryId}/charge`, data);
            return {
              content: [{ type: "text", text: `Successfully charged battery ${batteryId}` }],
            };
          }

          // System & Info
          case "get_system_info": {
            const response = await this.axiosInstance.get("/system/info");
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          case "get_userfields": {
            const entity = args.entity as string;
            const objectId = args.object_id as number;
            const response = await this.axiosInstance.get(`/userfields/${entity}/${objectId}`);
            return {
              content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data) : ''}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Grocy MCP server running on stdio");
  }
}

// Main execution
async function main() {
  const config: GrocyConfig = {
    baseUrl: process.env.GROCY_BASE_URL || process.env.GROCY_BASE_API || "http://grocy:80/api",
    apiKey: process.env.GROCY_API_KEY || "",
  };

  if (!config.apiKey) {
    console.error("Error: GROCY_API_KEY environment variable is required");
    process.exit(1);
  }
  
  console.error(`Using Grocy base URL: ${config.baseUrl}`);

  const server = new GrocyMCPServer(config);
  await server.run();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});