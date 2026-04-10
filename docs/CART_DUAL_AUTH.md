# Cart Functionality - Dual Authentication Support

This document describes the updated cart functionality that supports both authenticated users (JWT) and anonymous users (frontend-generated tokens).

## Overview

The cart system now supports two types of users:

1. **Authenticated Users**: Users logged in with JWT tokens (userId)
2. **Anonymous Users**: Users without accounts using frontend-generated tokens (anonymousToken)

Anonymous carts automatically expire after **72 hours** from creation and are cleaned up automatically.

## Database Schema Changes

### Cart Model
```prisma
model cart {
  id                 String    @id @default(uuid())
  userId             String?   // Foreign key to user (for authenticated users)
  user               user?     @relation(fields: [userId], references: [id])
  anonymousToken     String?   @unique // Frontend-generated token for anonymous users
  anonymousExpiresAt DateTime? @db.Timestamptz(6) // Expiration date (72 hours from creation)
  createdAt          DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime  @default(now()) @updatedAt @db.Timestamptz(6)

  orderItems           order_item[]
  partOrderItems       part_order_item[]
  powdercoatOrderItems powdercoat_order_item[]

  @@index([anonymousToken])
  @@index([anonymousExpiresAt])
}
```

## API Endpoints

All cart endpoints now accept **either** `userId` OR `anonymousToken` as query parameters.

### Get Cart
```http
GET /cart?userId={userId}
GET /cart?anonymousToken={anonymousToken}
```

Returns the complete cart with all items including:
- Full sticker/part/powdercoat service details
- All translations (title, description)
- Customization options with translations
- Groups, links, and accessories for parts

**Response includes:**
- All order items (stickers) with translations
- All part order items with full part details including:
  - Translations
  - Groups with translations
  - Links with translations
  - Accessories with translations
  - Customization options with translations for dropdowns, etc.
- All powdercoat service order items

### Add Part to Cart
```http
POST /cart/part?userId={userId}
POST /cart/part?anonymousToken={anonymousToken}

Body:
{
  "partId": "uuid",
  "quantity": 1,
  "customizationOptions": {
    // User's selections for customization options
    // The full options with translations are stored from the part
  }
}
```

**Important:** When adding a part, the system:
1. Fetches the part with all its customization options including translations
2. Merges user selections with the full customization structure
3. Stores everything in `customizationOptions` field for the order item

This ensures that when retrieving the cart, all customization options (dropdowns, etc.) include their translations.

### Add Sticker to Cart
```http
POST /cart/sticker?userId={userId}
POST /cart/sticker?anonymousToken={anonymousToken}

Body:
{
  "stickerId": "uuid",  // OR "customStickerId"
  "width": 100,
  "height": 50,
  "vinyl": true,
  "printed": false,
  "quantity": 1,
  "customizationOptions": []
}
```

### Add Powdercoat Service to Cart
```http
POST /cart/powdercoat-service?userId={userId}
POST /cart/powdercoat-service?anonymousToken={anonymousToken}

Body:
{
  "powdercoatingServiceId": "uuid",
  "quantity": 1,
  "color": "Red",
  "customizationOptions": []
}
```

### Update Quantities
```http
PATCH /cart/sticker/amount/{orderItemId}?userId={userId}
PATCH /cart/part/amount/{partOrderItemId}?userId={userId}
PATCH /cart/powdercoat-service/amount/{powdercoatOrderItemId}?userId={userId}

Body:
{
  "amount": 2
}
```

### Remove Items
```http
DELETE /cart/sticker/{orderItemId}?userId={userId}
DELETE /cart/part/{partOrderItemId}?userId={userId}
DELETE /cart/powdercoat-service/{powdercoatOrderItemId}?userId={userId}
```

### Clear Cart
```http
DELETE /cart/clear?userId={userId}
DELETE /cart/clear?anonymousToken={anonymousToken}
```

Removes all items from the cart but keeps the cart.

### Delete Cart
```http
DELETE /cart?userId={userId}
DELETE /cart?anonymousToken={anonymousToken}
```

Deletes the entire cart and all its items.

## Frontend Implementation Guide

### Anonymous User Flow

1. **Generate Token**: On first cart interaction, generate a unique token:
```javascript
const anonymousToken = crypto.randomUUID(); // or any unique ID generator
localStorage.setItem('cartToken', anonymousToken);
```

2. **Use Token**: Include the token in all cart requests:
```javascript
const token = localStorage.getItem('cartToken');
const response = await fetch(`/api/cart?anonymousToken=${token}`);
```

3. **Token Expiry**: Anonymous carts expire after 72 hours. The frontend should:
   - Clear the token if the cart returns empty/expired
   - Generate a new token for the next cart interaction

### Authenticated User Flow

1. **Use JWT**: Extract userId from JWT token and use it in requests:
```javascript
const userId = getUserIdFromJWT(); // Your JWT decoding logic
const response = await fetch(`/api/cart?userId=${userId}`);
```

### Migration from Anonymous to Authenticated

When a user logs in, you can:
1. Get the anonymous cart using the `anonymousToken`
2. Get the user's cart using their `userId`
3. Merge items if needed (implement frontend logic)
4. Clear the anonymous token

## Customization Options with Translations

### Part Customization Options Structure

When adding parts to cart, customization options are stored with full translations:

```json
{
  "customizationOptions": [
    {
      "id": "option-1",
      "type": "dropdown",
      "translations": {
        "en": {
          "label": "Color",
          "description": "Choose your color"
        },
        "de": {
          "label": "Farbe",
          "description": "Wähle deine Farbe"
        }
      },
      "items": [
        {
          "id": "red",
          "translations": {
            "en": { "label": "Red" },
            "de": { "label": "Rot" }
          },
          "priceAdjustment": 0
        },
        {
          "id": "blue",
          "translations": {
            "en": { "label": "Blue" },
            "de": { "label": "Blau" }
          },
          "priceAdjustment": 5
        }
      ],
      "selectedValue": "red"  // User's selection
    }
  ]
}
```

This structure ensures that:
- All dropdown options have translations
- Price adjustments are preserved
- User selections are stored alongside options
- Frontend can display options in any language

## Automatic Cleanup

### Scheduled Cleanup

A scheduler runs **every hour** to cleanup expired anonymous carts:

```typescript
@Cron(CronExpression.EVERY_HOUR)
async cleanupExpiredAnonymousCarts()
```

This automatically:
1. Finds carts where `anonymousExpiresAt < now()`
2. Deletes all cart items (order_item, part_order_item, powdercoat_order_item)
3. Deletes the cart itself

### Manual Cleanup

For testing or administrative purposes:

```http
POST /scheduler/cart-cleanup/manual
```

Returns:
```json
{
  "success": true,
  "message": "Cleaned up X expired anonymous carts",
  "count": X
}
```

## Error Handling

All endpoints validate that **either** `userId` **or** `anonymousToken` is provided:

```typescript
if (!userId && !anonymousToken) {
  throw new BadRequestException(
    'Either userId or anonymousToken is required'
  );
}
```

## Security Considerations

1. **Token Generation**: Frontend should generate cryptographically secure random tokens
2. **Token Storage**: Store tokens in localStorage (not sensitive data)
3. **Expiration**: 72-hour automatic expiration prevents database bloat
4. **Public Endpoints**: All cart endpoints are marked `@Public()` to allow anonymous access
5. **Rate Limiting**: Throttled to 15 requests per second to prevent abuse

## Testing

### Test Anonymous Cart
```bash
# Generate a token
TOKEN=$(uuidgen)

# Add part to cart
curl -X POST "http://localhost:3000/cart/part?anonymousToken=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partId": "part-uuid",
    "quantity": 1,
    "customizationOptions": {}
  }'

# Get cart
curl "http://localhost:3000/cart?anonymousToken=$TOKEN"

# Clear cart
curl -X DELETE "http://localhost:3000/cart/clear?anonymousToken=$TOKEN"
```

### Test Authenticated Cart
```bash
# Get user's cart
curl "http://localhost:3000/cart?userId=user-uuid" \
  -H "Authorization: Bearer {jwt-token}"
```

## Migration Notes

- Existing carts are not affected (they have userId, no anonymousToken)
- Anonymous carts are automatically created when needed
- No data migration required for existing carts
- Backward compatible with existing cart operations
