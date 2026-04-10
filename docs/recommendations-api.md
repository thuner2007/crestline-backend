# Recommendations API

## Get Item Recommendations to Reach 100 CHF

This endpoint returns product recommendations (parts, stickers, or powdercoat services) that will bring the total cost to at least 100 CHF.

### Endpoint

```
POST /cart/recommendations
```

### Request Body

```json
{
  "costAmount": 34,
  "itemsIdInCart": ["item-id-1", "item-id-2", "item-id-3"]
}
```

**Parameters:**

- `costAmount` (number, required): Current cart total amount in CHF
- `itemsIdInCart` (array of strings, required): Array of item IDs already in the cart (these will be excluded from recommendations)

### Response

The endpoint will return the optimal item(s) to add to reach at least 100 CHF:

#### Single Item Response

When a single item can bring the total to 100+ CHF:

```json
{
  "neededAmount": 66,
  "targetAmount": 100,
  "currentAmount": 34,
  "recommendations": [
    {
      "id": "part-uuid-here",
      "type": "part",
      "name": "Custom Part",
      "slug": "custom-part",
      "price": 64,
      "images": ["image1.jpg", "image2.jpg"],
      "totalWithItem": 98,
      "data": {
        "id": "part-uuid-here",
        "price": "64.00",
        "images": ["image1.jpg", "image2.jpg"],
        "translations": [
          {
            "language": "en",
            "title": "Custom Part",
            "description": "A great part"
          }
        ]
        // ... other part details
      }
    }
  ]
}
```

#### Multiple Items Response

When multiple items are needed to reach 100 CHF:

```json
{
  "neededAmount": 66,
  "targetAmount": 100,
  "currentAmount": 34,
  "recommendations": [
    {
      "id": "sticker-uuid-1",
      "type": "sticker",
      "name": "Cool Sticker",
      "slug": "cool-sticker",
      "price": 30,
      "images": ["sticker-image.jpg"],
      "data": {
        // sticker details
      }
    },
    {
      "id": "powdercoat-uuid-1",
      "type": "powdercoat",
      "name": "Premium Coating",
      "slug": "premium-coating",
      "price": 40,
      "images": null,
      "data": {
        // powdercoat service details
      }
    }
  ],
  "totalWithItems": 104
}
```

#### Already at Target Response

When the cost amount is already at or above 100 CHF:

```json
{
  "message": "Already at or above 100 CHF",
  "recommendations": []
}
```

#### No Items Found Response

When no suitable items are available:

```json
{
  "neededAmount": 66,
  "targetAmount": 100,
  "currentAmount": 34,
  "message": "No suitable items found to reach 100 CHF",
  "recommendations": []
}
```

### Algorithm Details

The endpoint uses the following logic:

1. **Single Item Search**: First tries to find a single item that gets closest to 100 CHF without going under
2. **Two Items Search**: If no single item works, tries combinations of 2 items
3. **Three Items Search**: If still no match, tries combinations of 3 items
4. **Optimization**: Always returns the combination with the smallest difference over 100 CHF

### Notes

- Only active items are considered
- Items already in the cart (specified in `itemsIdInCart`) are excluded
- The endpoint prioritizes getting as close as possible to 100 CHF without going under
- For stickers, the endpoint uses `generalPrice` or `price` field (whichever is available)
- The response includes full item details including translations for localization
- Each recommendation includes:
  - `name`: The product name (from English translation if available, otherwise first available translation)
  - `slug`: URL-friendly version of the name (lowercase, spaces and special characters replaced with hyphens)
  - `id`: The unique identifier (UUID)
  - `type`: The item type (`part`, `sticker`, or `powdercoat`)
  - `price`: The item price in CHF
  - `data`: Full item details including all translations

### Example Usage

```bash
curl -X POST http://localhost:3000/cart/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "costAmount": 34,
    "itemsIdInCart": ["existing-item-1", "existing-item-2"]
  }'
```

### Response Fields

Each item in the `recommendations` array includes:

| Field   | Type                      | Description                                                                  |
| ------- | ------------------------- | ---------------------------------------------------------------------------- |
| `id`    | string (UUID)             | Unique identifier of the item                                                |
| `type`  | string                    | Item type: `part`, `sticker`, or `powdercoat`                                |
| `name`  | string                    | Product name (from English translation if available)                         |
| `slug`  | string                    | URL-friendly name (e.g., "custom-part", "cool-sticker")                      |
| `price` | number                    | Item price in CHF                                                            |
| `images`| string, string[], or null | Image name(s) - can be a single string, array of strings, or null if no images |
| `data`  | object                    | Full item details including translations, images, etc.                       |

### Item Types

- **part**: Physical parts with customization options
- **sticker**: Stickers (vinyl or printable)
- **powdercoat**: Powder coating services
