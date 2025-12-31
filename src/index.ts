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

        // Generic Entity Management (CRUD)
        {
          name: "create_entity",
          description: "Create a new entity (product, location, recipe, chore, task, etc.)",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Entity type (e.g., 'products', 'locations', 'recipes', 'chores', 'tasks', 'batteries', 'quantity_units', 'shopping_locations')" },
              data: { type: "object", description: "Entity data as JSON object" },
            },
            required: ["entity", "data"],
          },
        },
        {
          name: "update_entity",
          description: "Update an existing entity",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Entity type (e.g., 'products', 'locations', 'recipes', 'chores')" },
              object_id: { type: "number", description: "Entity ID to update" },
              data: { type: "object", description: "Updated entity data as JSON object" },
            },
            required: ["entity", "object_id", "data"],
          },
        },
        {
          name: "delete_entity",
          description: "Delete an entity",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Entity type (e.g., 'products', 'locations', 'recipes')" },
              object_id: { type: "number", description: "Entity ID to delete" },
            },
            required: ["entity", "object_id"],
          },
        },
        {
          name: "get_entity",
          description: "Get a specific entity by ID",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Entity type (e.g., 'products', 'locations', 'recipes')" },
              object_id: { type: "number", description: "Entity ID" },
            },
            required: ["entity", "object_id"],
          },
        },
        
        // Shopping List
        {
          name: "get_shopping_list",
          description: "Get all items on shopping lists",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "add_to_shopping_list",
          description: "Add a product to shopping list with specified quantity",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to add" },
              amount: { type: "number", description: "Quantity to add (default: 1)" },
              note: { type: "string", description: "Optional note for this item" },
            },
            required: ["product_id"],
          },
        },
        {
          name: "remove_from_shopping_list",
          description: "Remove a product from shopping list or reduce its quantity",
          inputSchema: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID to remove" },
              amount: { type: "number", description: "Quantity to remove (default: removes all)" },
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

        // Bulk Operations & Smart Tools
        {
          name: "create_recipe_with_ingredients",
          description: "Create a complete recipe with all ingredients in a single operation. Supports automatic unit conversion when source_unit is specified (e.g., from grams to kg).",
          inputSchema: {
            type: "object",
            properties: {
              recipe: {
                type: "object",
                description: "Recipe data (name, description, etc.)",
                properties: {
                  name: { type: "string", description: "Recipe name" },
                  description: { type: "string", description: "Recipe description/instructions" },
                  base_servings: { type: "number", description: "Base servings (default: 1)" },
                },
                required: ["name"],
              },
              ingredients: {
                type: "array",
                description: "Array of ingredients",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "number", description: "Product ID" },
                    amount: { type: "number", description: "Amount needed in source_unit (or product's stock unit if source_unit not specified)" },
                    note: { type: "string", description: "Optional note" },
                    only_check_single_unit_in_stock: { type: "boolean", description: "Check single unit only" },
                  },
                  required: ["product_id", "amount"],
                },
              },
              source_unit: {
                type: "string",
                description: "Optional: Unit that amounts are provided in (e.g., 'g', 'gram', 'grams'). If specified, amounts will be converted to each product's stock unit.",
              },
            },
            required: ["recipe", "ingredients"],
          },
        },
        {
          name: "add_recipe_missing_to_shopping_list",
          description: "Check what ingredients are missing for a recipe and add them to shopping list",
          inputSchema: {
            type: "object",
            properties: {
              recipe_id: { type: "number", description: "Recipe ID" },
              servings: { type: "number", description: "Number of servings to calculate for (optional)" },
            },
            required: ["recipe_id"],
          },
        },
        {
          name: "match_product_by_name",
          description: "Find products by name with fuzzy matching and confidence scores",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Product name to search for" },
              fuzzy: { type: "boolean", description: "Enable fuzzy matching (default: true)" },
              limit: { type: "number", description: "Maximum results to return (default: 5)" },
            },
            required: ["name"],
          },
        },
        {
          name: "bulk_get_stock",
          description: "Get stock levels for multiple products in a single call",
          inputSchema: {
            type: "object",
            properties: {
              product_ids: {
                type: "array",
                items: { type: "number" },
                description: "Array of product IDs to check",
              },
            },
            required: ["product_ids"],
          },
        },
        {
          name: "get_recipe_with_stock_status",
          description: "Get recipe details with current stock status for all ingredients",
          inputSchema: {
            type: "object",
            properties: {
              recipe_id: { type: "number", description: "Recipe ID" },
              servings: { type: "number", description: "Calculate for specific servings (optional)" },
            },
            required: ["recipe_id"],
          },
        },
        {
          name: "bulk_add_to_shopping_list",
          description: "Add multiple products to shopping list in one operation",
          inputSchema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                description: "Array of items to add",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "number", description: "Product ID" },
                    amount: { type: "number", description: "Quantity" },
                    note: { type: "string", description: "Optional note" },
                  },
                  required: ["product_id", "amount"],
                },
              },
            },
            required: ["items"],
          },
        },

        // BeerSmith Integration
        {
          name: "list_brewing_ingredients",
          description: "Export brewing ingredients with pricing data for BeerSmith integration. Returns products with name, price, quantity unit, and product group.",
          inputSchema: {
            type: "object",
            properties: {
              product_group_filter: {
                type: "string",
                description: "Optional: Filter by product group name (e.g., 'Brewing', 'Hops', 'Grains')",
              },
              include_all_products: {
                type: "boolean",
                description: "If true, include all products. If false (default), only include products with pricing data.",
              },
            },
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

          // Generic Entity Management (CRUD)
          case "create_entity": {
            const entity = args.entity as string;
            const data = args.data as object;
            
            const response = await this.axiosInstance.post(`/objects/${entity}`, data);
            return {
              content: [{ type: "text", text: `Successfully created ${entity} with ID: ${response.data.created_object_id}\n${JSON.stringify(response.data, null, 2)}` }],
            };
          }

          case "update_entity": {
            const entity = args.entity as string;
            const objectId = args.object_id as number;
            const data = args.data as object;
            
            await this.axiosInstance.put(`/objects/${entity}/${objectId}`, data);
            return {
              content: [{ type: "text", text: `Successfully updated ${entity} ${objectId}` }],
            };
          }

          case "delete_entity": {
            const entity = args.entity as string;
            const objectId = args.object_id as number;
            
            await this.axiosInstance.delete(`/objects/${entity}/${objectId}`);
            return {
              content: [{ type: "text", text: `Successfully deleted ${entity} ${objectId}` }],
            };
          }

          case "get_entity": {
            const entity = args.entity as string;
            const objectId = args.object_id as number;
            
            const response = await this.axiosInstance.get(`/objects/${entity}/${objectId}`);
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
            const note = args.note as string | undefined;
            
            // Use direct objects API instead of /stock/shoppinglist/add-product
            // as that endpoint ignores the amount parameter
            const data: any = {
              product_id: productId,
              shopping_list_id: 1,
              amount: amount
            };
            if (note) data.note = note;
            
            const response = await this.axiosInstance.post(`/objects/shopping_list`, data);
            return {
              content: [{ type: "text", text: `Successfully added ${amount} unit(s) of product ${productId} to shopping list (entry ID: ${response.data.created_object_id})` }],
            };
          }

          case "remove_from_shopping_list": {
            const productId = args.product_id as number;
            const amount = (args.amount as number) || 1;
            
            // First find the shopping list entry for this product
            const listResponse = await this.axiosInstance.get(`/objects/shopping_list`);
            const entries = listResponse.data.filter((e: any) => e.product_id === productId);
            
            if (entries.length === 0) {
              return {
                content: [{ type: "text", text: `Product ${productId} not found on shopping list` }],
              };
            }
            
            // Update or delete the first matching entry
            const entry = entries[0];
            const newAmount = entry.amount - amount;
            
            if (newAmount <= 0) {
              await this.axiosInstance.delete(`/objects/shopping_list/${entry.id}`);
              return {
                content: [{ type: "text", text: `Successfully removed product ${productId} from shopping list` }],
              };
            } else {
              await this.axiosInstance.put(`/objects/shopping_list/${entry.id}`, { amount: newAmount });
              return {
                content: [{ type: "text", text: `Successfully reduced product ${productId} to ${newAmount} unit(s) on shopping list` }],
              };
            }
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

          // Bulk Operations & Smart Tools
          case "create_recipe_with_ingredients": {
            const recipeData = args.recipe as any;
            const ingredients = args.ingredients as any[];
            const sourceUnit = args.source_unit as string | undefined;
            
            // If source_unit is specified, fetch products and units for conversion
            let productMap: Map<number, any> | undefined;
            let unitsMap: Map<number, any> | undefined;
            
            if (sourceUnit) {
              const productsResponse = await this.axiosInstance.get("/objects/products");
              productMap = new Map(productsResponse.data.map((p: any) => [p.id, p]));
              
              const unitsResponse = await this.axiosInstance.get("/objects/quantity_units");
              unitsMap = new Map(unitsResponse.data.map((u: any) => [u.id, u]));
            }
            
            // Create the recipe first
            const recipePayload: any = {
              name: recipeData.name,
              description: recipeData.description || "",
              base_servings: recipeData.base_servings || 1,
            };
            
            const recipeResponse = await this.axiosInstance.post("/objects/recipes", recipePayload);
            const recipeId = recipeResponse.data.created_object_id;
            
            // Add all ingredients (with conversion if needed)
            const ingredientResults: any[] = [];
            for (const ingredient of ingredients) {
              try {
                let finalAmount = ingredient.amount;
                let conversionNote = "";
                
                // Perform unit conversion if source_unit is specified
                if (sourceUnit && productMap && unitsMap) {
                  const product = productMap.get(ingredient.product_id);
                  if (!product) {
                    ingredientResults.push({
                      product_id: ingredient.product_id,
                      status: "failed",
                      error: "Product not found",
                    });
                    continue;
                  }
                  
                  const stockUnit = unitsMap.get(product.qu_id_stock) as any;
                  const sourceUnitLower = sourceUnit.toLowerCase();
                  
                  if (stockUnit) {
                    const stockUnitLower = stockUnit.name.toLowerCase();
                    
                    // Convert from source unit to stock unit
                    if ((sourceUnitLower === "g" || sourceUnitLower === "gram" || sourceUnitLower === "grams") &&
                        (stockUnitLower === "kg" || stockUnitLower === "kilogram" || stockUnitLower === "kilograms")) {
                      finalAmount = ingredient.amount / 1000;
                      conversionNote = ` (${ingredient.amount}g → ${finalAmount}kg)`;
                    } else if ((sourceUnitLower === "g" || sourceUnitLower === "gram" || sourceUnitLower === "grams") &&
                               (stockUnitLower === "g" || stockUnitLower === "gram" || stockUnitLower === "grams")) {
                      finalAmount = ingredient.amount;
                      conversionNote = ` (${ingredient.amount}g)`;
                    } else if ((sourceUnitLower === "g" || sourceUnitLower === "gram" || sourceUnitLower === "grams") &&
                               (stockUnitLower === "oz" || stockUnitLower === "ounce" || stockUnitLower === "ounces")) {
                      finalAmount = ingredient.amount / 28.3495;
                      conversionNote = ` (${ingredient.amount}g → ${finalAmount.toFixed(2)}oz)`;
                    } else if ((sourceUnitLower === "g" || sourceUnitLower === "gram" || sourceUnitLower === "grams") &&
                               (stockUnitLower === "lb" || stockUnitLower === "pound" || stockUnitLower === "pounds")) {
                      finalAmount = ingredient.amount / 453.592;
                      conversionNote = ` (${ingredient.amount}g → ${finalAmount.toFixed(2)}lb)`;
                    } else {
                      // No conversion performed
                      conversionNote = ` (no conversion: ${sourceUnit} → ${stockUnit.name})`;
                    }
                  }
                }
                
                const ingredientPayload = {
                  recipe_id: recipeId,
                  product_id: ingredient.product_id,
                  amount: finalAmount,
                  note: `${ingredient.note || ""}${conversionNote}`.trim(),
                  only_check_single_unit_in_stock: ingredient.only_check_single_unit_in_stock || false,
                };
                
                await this.axiosInstance.post("/objects/recipes_pos", ingredientPayload);
                
                const result: any = { product_id: ingredient.product_id, status: "added" };
                if (conversionNote) {
                  result.conversion = conversionNote.trim();
                }
                ingredientResults.push(result);
              } catch (err: any) {
                ingredientResults.push({ product_id: ingredient.product_id, status: "failed", error: err.message });
              }
            }
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  recipe_id: recipeId,
                  recipe_name: recipeData.name,
                  ingredients_added: ingredientResults.filter(i => i.status === "added").length,
                  ingredients_failed: ingredientResults.filter(i => i.status === "failed").length,
                  details: ingredientResults,
                }, null, 2),
              }],
            };
          }

          case "add_recipe_missing_to_shopping_list": {
            const recipeId = args.recipe_id as number;
            const servings = (args.servings as number) || 1;
            
            // Get recipe fulfillment status
            const fulfillmentResponse = await this.axiosInstance.get(`/recipes/${recipeId}/fulfillment`);
            const fulfillment = fulfillmentResponse.data;
            
            // Get recipe ingredients
            const ingredientsResponse = await this.axiosInstance.get("/objects/recipes_pos");
            const recipeIngredients = ingredientsResponse.data.filter((i: any) => i.recipe_id === recipeId);
            
            // Get current stock
            const stockResponse = await this.axiosInstance.get("/stock");
            const stockMap = new Map(stockResponse.data.map((s: any) => [s.product_id, s.amount_aggregated]));
            
            const addedItems: any[] = [];
            for (const ingredient of recipeIngredients) {
              const neededAmount = ingredient.amount * servings;
              const stockAmount = (stockMap.get(ingredient.product_id) as number) || 0;
              const missingAmount = Math.max(0, neededAmount - stockAmount);
              
              if (missingAmount > 0) {
                try {
                  await this.axiosInstance.post("/objects/shopping_list", {
                    product_id: ingredient.product_id,
                    shopping_list_id: 1,
                    amount: missingAmount,
                    note: `For recipe (${servings} servings)`,
                  });
                  addedItems.push({
                    product_id: ingredient.product_id,
                    needed: neededAmount,
                    in_stock: stockAmount,
                    added_to_list: missingAmount,
                  });
                } catch (err: any) {
                  addedItems.push({
                    product_id: ingredient.product_id,
                    error: err.message,
                  });
                }
              }
            }
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  recipe_id: recipeId,
                  servings: servings,
                  items_added: addedItems.length,
                  details: addedItems,
                }, null, 2),
              }],
            };
          }

          case "match_product_by_name": {
            const searchName = (args.name as string).toLowerCase();
            const fuzzy = args.fuzzy !== false; // default true
            const limit = (args.limit as number) || 5;
            
            const response = await this.axiosInstance.get("/objects/products");
            const products = response.data;
            
            // Calculate match scores
            const scored = products.map((p: any) => {
              const productName = p.name.toLowerCase();
              let score = 0;
              let matchType = "none";
              
              if (productName === searchName) {
                score = 100;
                matchType = "exact";
              } else if (productName.includes(searchName) || searchName.includes(productName)) {
                score = 80;
                matchType = "contains";
              } else if (fuzzy) {
                // Simple fuzzy: check word overlap
                const searchWords = searchName.split(/\s+/);
                const productWords = productName.split(/\s+/);
                const matchingWords = searchWords.filter((sw: string) => 
                  productWords.some((pw: string) => pw.includes(sw) || sw.includes(pw))
                );
                score = Math.round((matchingWords.length / Math.max(searchWords.length, 1)) * 60);
                if (score > 0) matchType = "fuzzy";
              }
              
              return { ...p, match_score: score, match_type: matchType };
            });
            
            // Filter and sort
            const matches = scored
              .filter((p: any) => p.match_score > 0)
              .sort((a: any, b: any) => b.match_score - a.match_score)
              .slice(0, limit);
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  query: args.name,
                  matches_found: matches.length,
                  results: matches.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    match_score: m.match_score,
                    match_type: m.match_type,
                  })),
                }, null, 2),
              }],
            };
          }

          case "bulk_get_stock": {
            const productIds = args.product_ids as number[];
            
            // Get all stock at once
            const stockResponse = await this.axiosInstance.get("/stock");
            const stockMap = new Map(stockResponse.data.map((s: any) => [s.product_id, s]));
            
            const results = productIds.map(id => {
              const stock = stockMap.get(id) as any;
              if (stock) {
                return {
                  product_id: id,
                  product_name: stock.product?.name || "Unknown",
                  amount: stock.amount,
                  amount_aggregated: stock.amount_aggregated,
                  best_before_date: stock.best_before_date,
                  is_aggregated_amount: stock.is_aggregated_amount,
                };
              } else {
                return {
                  product_id: id,
                  amount: 0,
                  amount_aggregated: 0,
                  in_stock: false,
                };
              }
            });
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  products_checked: productIds.length,
                  results: results,
                }, null, 2),
              }],
            };
          }

          case "get_recipe_with_stock_status": {
            const recipeId = args.recipe_id as number;
            const servings = (args.servings as number) || 1;
            
            // Get recipe details
            const recipeResponse = await this.axiosInstance.get(`/objects/recipes/${recipeId}`);
            const recipe = recipeResponse.data;
            
            // Get recipe ingredients
            const ingredientsResponse = await this.axiosInstance.get("/objects/recipes_pos");
            const ingredients = ingredientsResponse.data.filter((i: any) => i.recipe_id === recipeId);
            
            // Get products for names
            const productsResponse = await this.axiosInstance.get("/objects/products");
            const productMap = new Map(productsResponse.data.map((p: any) => [p.id, p]));
            
            // Get current stock
            const stockResponse = await this.axiosInstance.get("/stock");
            const stockMap = new Map(stockResponse.data.map((s: any) => [s.product_id, s.amount_aggregated]));
            
            // Calculate fulfillment
            const ingredientStatus = ingredients.map((i: any) => {
              const product = productMap.get(i.product_id) as any;
              const neededAmount = i.amount * servings;
              const stockAmount = (stockMap.get(i.product_id) as number) || 0;
              const fulfilled = stockAmount >= neededAmount;
              const missing = Math.max(0, neededAmount - stockAmount);
              
              return {
                product_id: i.product_id,
                product_name: product?.name || "Unknown",
                amount_needed: neededAmount,
                amount_in_stock: stockAmount,
                fulfilled: fulfilled,
                missing: missing,
                note: i.note || "",
              };
            });
            
            const allFulfilled = ingredientStatus.every((i: any) => i.fulfilled);
            const totalMissing = ingredientStatus.filter((i: any) => !i.fulfilled).length;
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  recipe_id: recipeId,
                  recipe_name: recipe.name,
                  servings: servings,
                  can_make: allFulfilled,
                  missing_ingredients_count: totalMissing,
                  ingredients: ingredientStatus,
                }, null, 2),
              }],
            };
          }

          case "bulk_add_to_shopping_list": {
            const items = args.items as any[];
            
            const results: any[] = [];
            for (const item of items) {
              try {
                const response = await this.axiosInstance.post("/objects/shopping_list", {
                  product_id: item.product_id,
                  shopping_list_id: 1,
                  amount: item.amount,
                  note: item.note || "",
                });
                results.push({
                  product_id: item.product_id,
                  amount: item.amount,
                  status: "added",
                  entry_id: response.data.created_object_id,
                });
              } catch (err: any) {
                results.push({
                  product_id: item.product_id,
                  amount: item.amount,
                  status: "failed",
                  error: err.message,
                });
              }
            }
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  items_requested: items.length,
                  items_added: results.filter(r => r.status === "added").length,
                  items_failed: results.filter(r => r.status === "failed").length,
                  details: results,
                }, null, 2),
              }],
            };
          }

          // BeerSmith Integration
          case "list_brewing_ingredients": {
            const productGroupFilter = args.product_group_filter as string | undefined;
            const includeAll = args.include_all_products as boolean | undefined;
            
            // Get all products
            const productsResponse = await this.axiosInstance.get("/objects/products");
            const products = productsResponse.data;
            
            // Get quantity units for unit names
            const unitsResponse = await this.axiosInstance.get("/objects/quantity_units");
            const unitsMap = new Map(unitsResponse.data.map((u: any) => [u.id, u]));
            
            // Get product groups for categorization
            const groupsResponse = await this.axiosInstance.get("/objects/product_groups");
            const groupsMap = new Map(groupsResponse.data.map((g: any) => [g.id, g]));
            
            // Get stock entries to find last purchase prices
            const stockResponse = await this.axiosInstance.get("/stock");
            const stockMap = new Map(stockResponse.data.map((s: any) => [s.product_id, s]));
            
            // Format ingredients for BeerSmith
            const ingredients: any[] = [];
            
            for (const product of products) {
              // Apply product group filter if specified
              if (productGroupFilter) {
                const productGroup = groupsMap.get(product.product_group_id) as any;
                if (!productGroup || !productGroup.name.toLowerCase().includes(productGroupFilter.toLowerCase())) {
                  continue;
                }
              }
              
              // Get stock info for pricing
              const stockInfo = stockMap.get(product.id) as any;
              const lastPrice = stockInfo?.last_price || product.default_best_before_days_after_open || 0;
              
              // Skip products without prices unless includeAll is true
              if (!includeAll && !lastPrice) {
                continue;
              }
              
              // Get quantity unit name
              const unit = unitsMap.get(product.qu_id_stock) as any;
              const unitName = unit?.name || "unit";
              
              // Get product group for categorization
              const productGroup = groupsMap.get(product.product_group_id) as any;
              let productGroupHint = "";
              
              // Map Grocy product groups to BeerSmith categories
              if (productGroup) {
                const groupNameLower = productGroup.name.toLowerCase();
                if (groupNameLower.includes("hop")) {
                  productGroupHint = "hops";
                } else if (groupNameLower.includes("grain") || groupNameLower.includes("malt") || groupNameLower.includes("ferment")) {
                  productGroupHint = "grain";
                } else if (groupNameLower.includes("yeast")) {
                  productGroupHint = "yeast";
                } else if (groupNameLower.includes("misc") || groupNameLower.includes("additive") || groupNameLower.includes("other")) {
                  productGroupHint = "misc";
                } else {
                  productGroupHint = productGroup.name.toLowerCase();
                }
              }
              
              ingredients.push({
                name: product.name,
                price: parseFloat(lastPrice) || 0,
                qu_id: unitName,
                product_group: productGroupHint || "other",
                product_id: product.id, // Include for reference/debugging
              });
            }
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  count: ingredients.length,
                  ingredients: ingredients,
                }, null, 2),
              }],
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