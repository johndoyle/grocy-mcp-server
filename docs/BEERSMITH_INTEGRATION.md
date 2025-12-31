# BeerSmith + Grocy Integration Guide

This guide shows how to use the BeerSmith MCP Server and Grocy MCP Server together to manage your brewing ingredients and recipes.

## Prerequisites

Both MCP servers configured in Claude Desktop or your MCP client:
- [BeerSmith MCP Server](https://github.com/johndoyle/BeerSmith-MCP-Server)
- Grocy MCP Server (this repository)

## Integration Workflows

### 1. Import Recipe from BeerSmith to Grocy

**Step 1: Get recipe from BeerSmith**
```
beersmith:get_recipe {"recipe_name": "Ruddles County Bitter"}
```

**Step 2: Match ingredients to Grocy products**
For each ingredient in the BeerSmith recipe, find matching Grocy products:
```
grocy:match_product_by_name {"name": "Maris Otter", "fuzzy": true}
grocy:match_product_by_name {"name": "Golden Promise", "fuzzy": true}
grocy:match_product_by_name {"name": "Crystal Malt", "fuzzy": true}
```

**Step 3: Create recipe in Grocy with matched products**
```
grocy:create_recipe_with_ingredients {
  "recipe": {
    "name": "Ruddles County Bitter",
    "description": "Traditional English bitter",
    "base_servings": 1
  },
  "ingredients": [
    {"product_id": 65, "amount": 3.88, "note": "Maris Otter (base malt)"},
    {"product_id": 74, "amount": 0.5, "note": "Crystal Malt"},
    {"product_id": 12, "amount": 0.025, "note": "Cascade hops"},
    {"product_id": 17, "amount": 0.020, "note": "Fuggles hops"}
  ]
}
```

### 2. Check Brewing Readiness

**Step 1: Get BeerSmith recipe details**
```
beersmith:get_recipe {"recipe_name": "Pale Ale"}
```

**Step 2: Check stock for all ingredients**
```
grocy:bulk_get_stock {"product_ids": [65, 74, 12, 17, 75, 5, 14]}
```

Or for an existing Grocy recipe:
```
grocy:get_recipe_with_stock_status {"recipe_id": 17}
```

### 3. Automated Shopping List for Brew Day

**Step 1: Get recipe from BeerSmith**
```
beersmith:get_recipe {"recipe_name": "IPA"}
```

**Step 2: Add missing ingredients to Grocy shopping list**

If the recipe exists in Grocy:
```
grocy:add_recipe_missing_to_shopping_list {"recipe_id": 17, "servings": 1}
```

If creating from scratch, use bulk add:
```
grocy:bulk_add_to_shopping_list {
  "items": [
    {"product_id": 65, "amount": 4.5, "note": "For IPA brew"},
    {"product_id": 12, "amount": 0.1, "note": "Cascade hops"},
    {"product_id": 75, "amount": 1, "note": "US-05 yeast"}
  ]
}
```

### 4. Track Ingredient Consumption for Brew

**Step 1: Get BeerSmith recipe**
```
beersmith:get_recipe {"recipe_name": "Stout"}
```

**Step 2: Consume ingredients in Grocy**

Using the recipe (if it exists in Grocy):
```
grocy:consume_recipe {"recipe_id": 23}
```

Or consume individually:
```
grocy:consume_product {"product_id": 65, "amount": 5.2}
grocy:consume_product {"product_id": 74, "amount": 0.5}
grocy:consume_product {"product_id": 12, "amount": 0.05}
```

### 5. Recipe Scaling and Stock Check

**Step 1: Scale recipe in BeerSmith** (if supported)
```
beersmith:scale_recipe {"recipe_name": "Pale Ale", "scale_factor": 1.5}
```

**Step 2: Check if Grocy has enough stock**
```
grocy:get_recipe_with_stock_status {"recipe_id": 17}
```

**Step 3: Add missing amounts to shopping list**
```
grocy:add_recipe_missing_to_shopping_list {"recipe_id": 17, "servings": 1}
```

## Advanced Workflows

### Automated Recipe Import with Fuzzy Matching

When importing a BeerSmith recipe, you can automate the ingredient matching:

1. Get BeerSmith recipe ingredients
2. For each ingredient, use `match_product_by_name` with fuzzy=true
3. Review matches with confidence scores > 60
4. Manually verify matches with scores < 80
5. Create recipe in Grocy with matched product IDs

Example Python-style pseudo-workflow:
```python
# Get BeerSmith recipe
recipe = beersmith:get_recipe("Pale Ale")

# Match each ingredient
matched_ingredients = []
for ingredient in recipe.ingredients:
    matches = grocy:match_product_by_name(ingredient.name, fuzzy=True)
    
    # Take highest confidence match
    if matches and matches[0].match_score >= 60:
        matched_ingredients.append({
            "product_id": matches[0].id,
            "amount": ingredient.amount,
            "note": f"{ingredient.name} ({matches[0].match_score}% match)"
        })

# Create recipe in Grocy
grocy:create_recipe_with_ingredients(
    recipe={"name": recipe.name, "description": recipe.style},
    ingredients=matched_ingredients
)
```

### Inventory Management After Brewing

After a brew session:

1. **Consume recipe ingredients:**
   ```
   grocy:consume_recipe {"recipe_id": 17}
   ```

2. **Check low stock items:**
   ```
   grocy:get_volatile_stock {}
   ```

3. **Add low stock to shopping list:**
   ```
   grocy:add_missing_products_to_shopping_list {}
   ```

### Brew Planning with Multiple Recipes

Plan several brews and check ingredient availability:

```
# Check stock for multiple recipes
grocy:get_recipe_with_stock_status {"recipe_id": 17}
grocy:get_recipe_with_stock_status {"recipe_id": 23}
grocy:get_recipe_with_stock_status {"recipe_id": 45}

# Consolidate missing ingredients
grocy:add_recipe_missing_to_shopping_list {"recipe_id": 17}
grocy:add_recipe_missing_to_shopping_list {"recipe_id": 23}
grocy:add_recipe_missing_to_shopping_list {"recipe_id": 45}
```

## Common Ingredient Mappings

Here are typical brewing ingredients and how they might map to Grocy products:

| BeerSmith Ingredient | Grocy Product Type | Example Grocy Name |
|---------------------|-------------------|-------------------|
| Pale Malt / Maris Otter | Base Malt | "Maris Otter Malt" |
| 2-Row | Base Malt | "2-Row Pale Malt" |
| Crystal Malt | Specialty Malt | "Crystal 60L" |
| Chocolate Malt | Specialty Malt | "Chocolate Malt" |
| Cascade (hops) | Hops | "Cascade Hops (pellets)" |
| Saaz (hops) | Hops | "Saaz Hops (pellets)" |
| US-05 | Yeast | "Safale US-05 Dry Yeast" |
| Irish Moss | Finings | "Irish Moss" |
| Gypsum | Water Treatment | "Gypsum (Calcium Sulfate)" |

## Tips for Effective Integration

1. **Use consistent naming:** Keep product names in Grocy similar to BeerSmith for better fuzzy matching
2. **Add notes:** When creating recipes, include the original BeerSmith ingredient name in notes
3. **Track by batch:** Use Grocy's note fields to track which brew batch consumed which ingredients
4. **Inventory after purchases:** Always update Grocy stock after buying ingredients
5. **Regular reconciliation:** Periodically compare your physical inventory with Grocy stock levels

## Troubleshooting

### Ingredient not found
If `match_product_by_name` doesn't find a match:
1. Check spelling variations
2. Try shorter search terms (e.g., "Cascade" instead of "Cascade Hops Pellets")
3. Search manually: `grocy:search_products {"query": "cascade"}`
4. Create the product if it doesn't exist: `grocy:create_entity`

### Stock discrepancies
If Grocy stock doesn't match reality:
1. Use `inventory_product` to set absolute amounts
2. Check `get_product_entries` to see transaction history
3. Verify consumption was tracked correctly

### Recipe import errors
If recipe creation fails:
1. Verify all product IDs exist: `grocy:bulk_get_stock`
2. Check ingredient amounts are numeric
3. Ensure base_servings is set (default: 1)

## Price Sync Workflow

The BeerSmith MCP Server includes a `sync_prices_from_grocy` tool that can bulk-update ingredient prices from Grocy.

### Step 1: Export brewing ingredients from Grocy
```
grocy:list_brewing_ingredients {"product_group_filter": "Brewing"}
```

This returns ingredients with pricing data:
```json
{
  "count": 15,
  "ingredients": [
    {
      "name": "Cascade Hops 2024",
      "price": 2.50,
      "qu_id": "oz",
      "product_group": "hops",
      "product_id": 12
    },
    {
      "name": "Pilsner Malt",
      "price": 1.89,
      "qu_id": "lb",
      "product_group": "grain",
      "product_id": 65
    }
  ]
}
```

### Step 2: Preview price updates in BeerSmith
```
beersmith:sync_prices_from_grocy {
  "ingredients": [/* paste from step 1 */],
  "dry_run": true
}
```

This shows which ingredients will be matched and updated.

### Step 3: Apply price updates
```
beersmith:sync_prices_from_grocy {
  "ingredients": [/* paste from step 1 */],
  "dry_run": false
}
```

### Filter by specific categories
Export only hops:
```
grocy:list_brewing_ingredients {"product_group_filter": "Hops"}
```

Export only grains:
```
grocy:list_brewing_ingredients {"product_group_filter": "Grain"}
```

### Tips for better matching
- Keep product names close to BeerSmith conventions
- Use Grocy product groups: "Hops", "Grains", "Yeast", "Brewing"
- The `product_group` field improves matching accuracy
- Review dry_run results before applying updates

## Example: Complete Brew Day Workflow

```bash
# Morning: Check readiness
> grocy:get_recipe_with_stock_status {"recipe_id": 17}
# Result shows you have everything!

# During brew: Track consumption
> grocy:consume_recipe {"recipe_id": 17}

# After brew: Check what needs restocking
> grocy:get_stock {}
# Notice hops are low

# Add to shopping list
> grocy:add_missing_products_to_shopping_list {}

# Next week: Get shopping list
> grocy:get_shopping_list {}
# Includes the hops that went below minimum stock
```

## Reference

- [BeerSmith MCP Server](https://github.com/johndoyle/BeerSmith-MCP-Server)
- [Grocy MCP Server](https://github.com/johndoyle/grocy-mcp-server)
- [Grocy API Documentation](https://demo.grocy.info/api)
