# Part Option Stock Management

This feature allows tracking stock quantities for dropdown options within parts' customization options.

## Overview

When a part has customization options of type "dropdown", you can now track individual stock quantities for each dropdown option item. This is useful for scenarios like:

- Different sizes having different availability
- Color variants with limited stock
- Material options with varying quantities

## Database Schema

A new `part_option_stock` table tracks stock for each dropdown option item:

- `partId` - References the part
- `optionId` - ID of the customization option (usually the array index)
- `optionItemId` - ID of the specific dropdown item
- `quantity` - Available stock quantity

## API Endpoints

### Update Option Stock

```
PATCH /parts/{partId}/option-stock
```

Body:

```json
{
  "optionId": "0",
  "optionItemId": "size-large",
  "quantity": 50
}
```

### Get Option Stock

```
GET /parts/{partId}/option-stock?optionId=0&optionItemId=size-large
```

### Get Part with Stock Info

```
GET /parts/{partId} (includes stock by default)
GET /parts/{partId}/with-stock (explicit endpoint)
```

## Example Usage

### 1. Create a part with dropdown options

```json
{
  "price": 29.99,
  "customizationOptions": {
    "options": [
      {
        "type": "dropdown",
        "items": [
          {
            "id": "size-small",
            "priceAdjustment": 0,
            "translations": { "en": { "title": "Small" } }
          },
          {
            "id": "size-large",
            "priceAdjustment": 5,
            "translations": { "en": { "title": "Large" } }
          }
        ],
        "translations": { "en": { "title": "Size Options" } }
      }
    ]
  }
}
```

### 2. Set stock for dropdown options

```bash
# Set stock for small size
curl -X PATCH /parts/{partId}/option-stock \
  -d '{"optionId": "0", "optionItemId": "size-small", "quantity": 100}'

# Set stock for large size
curl -X PATCH /parts/{partId}/option-stock \
  -d '{"optionId": "0", "optionItemId": "size-large", "quantity": 25}'
```

### 3. View part with stock information

```bash
curl /parts/{partId}
```

Returns:

```json
{
  "id": "part-uuid",
  "customizationOptions": {
    "options": [
      {
        "type": "dropdown",
        "items": [
          {
            "id": "size-small",
            "stock": 100,
            "translations": { "en": { "title": "Small" } }
          },
          {
            "id": "size-large",
            "stock": 25,
            "translations": { "en": { "title": "Large" } }
          }
        ]
      }
    ]
  }
}
```

## Order Processing

When an order is placed:

1. **Stock Validation**: Before creating the order, the system checks if sufficient stock exists for each dropdown option
2. **Stock Decrementing**: After order creation, stock quantities are automatically decremented
3. **Error Handling**: If insufficient stock, the order creation fails with a clear error message

## Admin Features

Admins can:

- Set initial stock quantities for dropdown options
- Update stock levels at any time
- View current stock levels for all options
- Monitor stock through the part details endpoint

## Notes

- Stock tracking is optional - if no stock record exists, orders are allowed
- Stock validation only applies to dropdown type customization options
- Stock information is automatically included in part responses
- Failed stock operations are logged but don't fail order processing (for stock decrements)
