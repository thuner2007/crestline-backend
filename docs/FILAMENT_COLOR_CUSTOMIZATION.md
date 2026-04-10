# Filament Color Customization Option

## Overview

The `filamentColor` customization option allows parts to dynamically display available colors based on a specific filament type (e.g., PLA, PETG, ABS). This is useful when you want customers to choose colors that are only available for a particular material type.

## Features

- **Dynamic Color Loading**: Colors are automatically loaded from the database based on the selected filament type
- **Active Colors Only**: Only active colors are displayed to customers
- **Multilingual Support**: Color options support the same translation structure as other customization options
- **Price Adjustments**: Supports optional price adjustments (default is 0 for colors)

## How It Works

1. When creating a part, you add a `filamentColor` customization option that references a `filamentTypeId`
2. When the part is retrieved, the system automatically fetches all active colors for that filament type
3. The colors are returned as part of the customization options, ready to be displayed in the frontend
4. When a customer orders the part, they select their desired color from the available options

## Structure

### Part Creation with FilamentColor Option

```json
{
  "price": 29.99,
  "quantity": 100,
  "translations": {
    "en": {
      "title": "Custom 3D Printed Phone Case",
      "description": "A phone case printed with your choice of PLA color"
    },
    "de": {
      "title": "Individuell 3D-gedruckte Handyhülle",
      "description": "Eine Handyhülle gedruckt in Ihrer Wahl der PLA-Farbe"
    }
  },
  "customizationOptions": {
    "options": [
      {
        "type": "filamentColor",
        "filamentTypeId": "uuid-of-pla-filament-type",
        "priceAdjustment": 0,
        "translations": {
          "en": {
            "title": "Choose Color",
            "description": "Select your preferred PLA color"
          },
          "de": {
            "title": "Farbe wählen",
            "description": "Wählen Sie Ihre bevorzugte PLA-Farbe"
          },
          "fr": {
            "title": "Choisir la couleur",
            "description": "Sélectionnez votre couleur PLA préférée"
          },
          "it": {
            "title": "Scegli il colore",
            "description": "Seleziona il tuo colore PLA preferito"
          }
        }
      }
    ]
  }
}
```

### Response (Enhanced with Available Colors)

When you fetch the part, the response will include the populated colors:

```json
{
  "id": "part-uuid",
  "price": 29.99,
  "customizationOptions": {
    "options": [
      {
        "type": "filamentColor",
        "filamentTypeId": "uuid-of-pla-filament-type",
        "filamentTypeName": "PLA",
        "priceAdjustment": 0,
        "translations": {
          "en": {
            "title": "Choose Color",
            "description": "Select your preferred PLA color"
          },
          "de": {
            "title": "Farbe wählen",
            "description": "Wählen Sie Ihre bevorzugte PLA-Farbe"
          }
        },
        "colors": [
          {
            "id": "color-uuid-1",
            "value": "Red",
            "priceAdjustment": 0
          },
          {
            "id": "color-uuid-2",
            "value": "Blue",
            "priceAdjustment": 0
          },
          {
            "id": "color-uuid-3",
            "value": "Green",
            "priceAdjustment": 0
          }
        ]
      }
    ]
  }
}
```

## API Endpoints

### Get Available Colors for a Part

```http
GET /parts/:id/available-colors
```

This endpoint returns all colors available for a part based on its associated filament types.

### Creating an Order with FilamentColor Selection

```json
{
  "partOrderItems": [
    {
      "partId": "part-uuid",
      "quantity": 2,
      "customizationOptions": [
        {
          "optionId": "0",
          "type": "filamentColor",
          "value": "color-uuid-1"
        }
      ]
    }
  ]
}
```

## Use Cases

### 1. Single Material Type

Best for parts that are always printed in one material (e.g., PLA):

- Create one filamentColor option with PLA's filamentTypeId
- Customers choose from all available PLA colors

### 2. Multiple Material Types

For parts that can be printed in different materials:

- Use a dropdown option to let customers choose the material type first
- Add separate filamentColor options for each material type
- Frontend can conditionally show the appropriate color picker based on material selection

### 3. Premium Colors with Price Adjustments

If certain colors cost more:

- You can manually set `priceAdjustment` on the filamentColor option itself
- Or use a regular dropdown option instead for fine-grained control per color

## Example: Phone Case with Material Choice

```json
{
  "customizationOptions": {
    "options": [
      {
        "type": "dropdown",
        "translations": {
          "en": { "title": "Material Type" },
          "de": { "title": "Materialtyp" }
        },
        "items": [
          {
            "id": "pla",
            "priceAdjustment": 0,
            "translations": {
              "en": { "title": "PLA (Standard)" },
              "de": { "title": "PLA (Standard)" }
            }
          },
          {
            "id": "petg",
            "priceAdjustment": 5,
            "translations": {
              "en": { "title": "PETG (Durable)" },
              "de": { "title": "PETG (Robust)" }
            }
          }
        ]
      },
      {
        "type": "filamentColor",
        "filamentTypeId": "pla-uuid",
        "translations": {
          "en": { "title": "PLA Color" },
          "de": { "title": "PLA Farbe" }
        }
      },
      {
        "type": "filamentColor",
        "filamentTypeId": "petg-uuid",
        "translations": {
          "en": { "title": "PETG Color" },
          "de": { "title": "PETG Farbe" }
        }
      }
    ]
  }
}
```

## Technical Details

### Database Schema

The system uses the following tables:

- `filament_type`: Stores filament types (PLA, PETG, etc.)
- `available_color`: Stores colors associated with filament types
- `part`: Contains the customizationOptions JSON field

### Color Population

Colors are populated in the following service methods:

- `findOne()` - Single part lookup
- `findOneByName()` - Part lookup by name
- `findAll()` - All parts list
- `findAllWithStock()` - Parts with stock information
- `getPartWithStockInfo()` - Part with detailed stock info

### Performance Considerations

- Colors are fetched separately for each part with filamentColor options
- For bulk operations (like `findAll()`), this uses `Promise.all()` for efficient parallel loading
- Only active colors are retrieved from the database
- Colors are cached within each part response

## Migration Guide

If you have existing parts using a regular `color` option type and want to switch to `filamentColor`:

1. First, ensure your colors are properly associated with filament types in the database
2. Update the part's customizationOptions:
   - Change `"type": "color"` to `"type": "filamentColor"`
   - Add `"filamentTypeId": "uuid-of-filament-type"`
3. Remove any hardcoded color lists (they will be loaded dynamically)
4. Update your frontend to handle the new colors array structure

## Troubleshooting

### Colors not appearing?

- Verify the filamentTypeId is correct
- Check that colors are marked as `active: true` in the database
- Ensure the filament_type has associated colors

### Wrong colors showing?

- Check that colors have the correct `filamentTypeId` in the `available_color` table
- Verify the part's customization option has the right `filamentTypeId`

### Price adjustments not working?

- FilamentColor options default to 0 price adjustment
- Set the `priceAdjustment` field on the option itself if needed
- For per-color pricing, consider using a dropdown option instead
