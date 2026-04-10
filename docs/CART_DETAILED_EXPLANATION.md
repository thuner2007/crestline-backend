# Cart API - Detailed Explanation with Examples

## How It Works

### 1. **Adding a Part to Cart**

When you send a POST request to add a part:

**Request:**
```http
POST /cart/part?anonymousToken=your-token-here
Content-Type: application/json

{
  "partId": "855d7e71-a0aa-4c77-b649-e7fb46047c91",
  "quantity": 1,
  "customizationOptions": [
    {
      "type": "dropdown",
      "value": "0l7ylsuto",
      "translations": {
        "en": { "title": "Axle diameter FRONT" }
      },
      "items": [ /* dropdown items */ ]
    }
  ]
}
```

**What Happens Behind the Scenes:**

1. **Find or Create Cart** - Finds existing cart or creates new one with your anonymousToken
2. **Validate Part** - Fetches the part from database to ensure it exists
3. **Create Order** - Creates a temporary `sticker_order` with status `cart_temp`
4. **Create Part Order Item** - Creates a `part_order_item` linked to the temporary order
5. **Link to Cart** - Connects the `part_order_item` to your cart via `cart.update()`
6. **Return Full Cart** - Returns complete cart data with all relations

## Example Return Data

### When Adding a Part (Full Response)

```json
{
  "id": "cart-uuid-abc123",
  "userId": null,
  "anonymousToken": "your-frontend-token-12345",
  "anonymousExpiresAt": "2026-01-20T15:30:00.000Z",
  "createdAt": "2026-01-17T15:30:00.000Z",
  "updatedAt": "2026-01-17T15:35:00.000Z",
  
  "orderItems": [],  // Stickers go here
  
  "partOrderItems": [
    {
      "id": "part-order-item-uuid-xyz789",
      "orderId": "temp-order-uuid-def456",
      "partId": "855d7e71-a0aa-4c77-b649-e7fb46047c91",
      "quantity": 1,
      "customizationOptions": [
        {
          "type": "dropdown",
          "value": "0l7ylsuto",
          "translations": {
            "en": { "title": "Axle diameter FRONT" },
            "de": { "title": "Axle diameter FRONT" },
            "fr": { "title": "Axle diameter FRONT" },
            "it": { "title": "Axle diameter FRONT" }
          },
          "priceAdjustment": 0,
          "items": [
            {
              "id": "0l7ylsuto",
              "priceAdjustment": 0,
              "translations": {
                "en": { "title": "M12" },
                "de": { "title": "M12" },
                "fr": { "title": "M12" },
                "it": { "title": "M12" }
              },
              "stock": 10
            },
            {
              "id": "bbkrm2qdi",
              "priceAdjustment": 0,
              "translations": {
                "en": { "title": "M10" },
                "de": { "title": "M10" }
              },
              "stock": 9
            }
          ]
        },
        {
          "type": "dropdown",
          "value": "om3bre81x",
          "translations": {
            "en": { "title": "Axle diameter BACK" }
          },
          "items": [ /* ... */ ]
        },
        {
          "type": "dropdown",
          "value": "72l34artl",
          "translations": {
            "en": { "title": "Color" }
          },
          "items": [
            {
              "id": "72l34artl",
              "translations": {
                "en": { "title": "Black" },
                "de": { "title": "Schwarz" }
              }
            }
          ]
        }
      ],
      
      "part": {
        "id": "855d7e71-a0aa-4c77-b649-e7fb46047c91",
        "price": "89.99",
        "initialPrice": "99.99",
        "quantity": 50,
        "images": ["part-image-1.jpg", "part-image-2.jpg"],
        "videos": ["part-video-1.mp4"],
        "sold": 120,
        "sortingRank": 10,
        "active": true,
        "shippingReady": "yes",
        "shippingDate": null,
        "type": "brake",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-15T10:00:00.000Z",
        "weight": "0.50",
        "width": "10.00",
        "height": "5.00",
        "length": "15.00",
        
        "translations": [
          {
            "id": "trans-en-uuid",
            "partId": "855d7e71-a0aa-4c77-b649-e7fb46047c91",
            "language": "en",
            "title": "Premium Brake System",
            "description": "High-quality brake system for freestyle scooters"
          },
          {
            "id": "trans-de-uuid",
            "partId": "855d7e71-a0aa-4c77-b649-e7fb46047c91",
            "language": "de",
            "title": "Premium Bremssystem",
            "description": "Hochwertiges Bremssystem für Freestyle-Scooter"
          },
          {
            "id": "trans-fr-uuid",
            "partId": "855d7e71-a0aa-4c77-b649-e7fb46047c91",
            "language": "fr",
            "title": "Système de freinage premium",
            "description": "Système de freinage de haute qualité"
          }
        ],
        
        "groups": [
          {
            "id": "group-uuid-1",
            "createdAt": "2025-01-01T00:00:00.000Z",
            "image": "brakes-category.jpg",
            "translations": [
              {
                "id": "group-trans-en",
                "groupId": "group-uuid-1",
                "language": "en",
                "title": "Brakes"
              },
              {
                "id": "group-trans-de",
                "groupId": "group-uuid-1",
                "language": "de",
                "title": "Bremsen"
              }
            ]
          }
        ],
        
        "links": [
          {
            "id": "link-uuid-1",
            "translations": [
              {
                "id": "link-trans-en",
                "language": "en",
                "title": "Installation Guide",
                "url": "https://example.com/install-guide-en"
              },
              {
                "id": "link-trans-de",
                "language": "de",
                "title": "Installationsanleitung",
                "url": "https://example.com/install-guide-de"
              }
            ]
          }
        ],
        
        "accessories": [
          {
            "id": "accessory-part-uuid",
            "price": "15.99",
            "translations": [
              {
                "language": "en",
                "title": "Brake Cable"
              },
              {
                "language": "de",
                "title": "Bremskabel"
              }
            ]
          }
        ]
      }
    }
  ],
  
  "powdercoatOrderItems": []  // Powdercoat services go here
}
```

## Understanding the Data Structure

### Cart Level
- `id`: Unique cart identifier
- `userId`: Present if authenticated user, `null` if anonymous
- `anonymousToken`: Your frontend-generated token (for anonymous users)
- `anonymousExpiresAt`: When this cart expires (72 hours from creation)
- `orderItems`: Array of sticker items
- `partOrderItems`: **Array of part items** ← Your parts are here
- `powdercoatOrderItems`: Array of powdercoat service items

### Part Order Item Level
Each item in `partOrderItems` contains:
- `id`: The part order item ID (use this for updates/deletes)
- `orderId`: The temporary order ID
- `partId`: Reference to the part
- `quantity`: How many
- `customizationOptions`: **Full array with translations** (exactly what you sent)
- `part`: **Complete part object with all relations**

### Part Object (Nested)
The `part` object includes EVERYTHING:
- Basic info (price, images, videos, etc.)
- `translations`: All language versions of title/description
- `groups`: Part groups with their translations
- `links`: Related links with translations
- `accessories`: Suggested accessories with translations

## Checking in Prisma Studio

When you open Prisma Studio, here's what to look for:

### 1. Check the Cart Table
- Find your cart by `anonymousToken`
- Look at the cart record

### 2. Check the Relation
The relation between `cart` and `part_order_item` is **implicit** in Prisma Studio. You need to:

**Option A: Check from Cart side**
1. Open `cart` table
2. Find your cart
3. Click on `partOrderItems` relation field
4. You should see the part_order_item(s)

**Option B: Check from part_order_item side**
1. Open `part_order_item` table
2. Find the item by `partId` or recent `createdAt`
3. Click on `cart` relation field
4. You should see your cart(s)

### 3. Verify the Link
The `part_order_item` table has a `cart cart[]` field (many-to-many relation).
The link is stored in the join table `_cartTopart_order_item`.

**Check the join table:**
1. In Prisma Studio, look for `_cartTopart_order_item` table
2. You should see entries with:
   - `A`: Your cart ID
   - `B`: Your part_order_item ID

## Common Issues

### Issue: "No orderItem linked"

**Clarification:** 
- `orderItem` (singular) refers to stickers → stored in `order_item` table
- `partOrderItem` refers to parts → stored in `part_order_item` table

If you added a **part**, it creates a `part_order_item`, NOT an `order_item`.

**Where to look:**
- ✅ Check `part_order_item` table
- ✅ Check `_cartTopart_order_item` join table
- ❌ Don't look in `order_item` table (that's for stickers)

### Issue: "Can't see the relation in Prisma Studio"

The cart → part_order_item relation is **many-to-many**, so:
1. The link is in the `_cartTopart_order_item` join table
2. In the cart record, you need to expand the `partOrderItems` field
3. In the part_order_item record, you need to expand the `cart` field

## Testing Flow

### Step 1: Generate Anonymous Token
```javascript
const token = crypto.randomUUID();
// Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Step 2: Add Part to Cart
```bash
curl -X POST "http://localhost:3000/cart/part?anonymousToken=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "partId": "855d7e71-a0aa-4c77-b649-e7fb46047c91",
    "quantity": 1,
    "customizationOptions": [ /* your options */ ]
  }'
```

### Step 3: Get Cart to Verify
```bash
curl "http://localhost:3000/cart?anonymousToken=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

You should get the full cart response as shown above.

### Step 4: Check Prisma Studio

**Tables to check:**
1. **cart** - Find by `anonymousToken` = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
2. **part_order_item** - Look for recent entries
3. **_cartTopart_order_item** - Should have a row linking them
4. **sticker_order** - Should have a temp order with `status = "cart_temp"`

## Debugging Steps

If the part isn't showing in your cart:

### 1. Check the API Response
Does the POST response include the part in `partOrderItems`?
- ✅ YES → It's in the database, check Prisma Studio correctly
- ❌ NO → Check server logs for errors

### 2. Check Server Logs
Look for errors when creating the part_order_item or linking to cart.

### 3. Check Database Directly
```sql
-- Find your cart
SELECT * FROM cart WHERE "anonymousToken" = 'your-token';

-- Find part order items for that cart
SELECT poi.* 
FROM part_order_item poi
JOIN "_cartTopart_order_item" link ON link."B" = poi.id
WHERE link."A" = 'your-cart-id';
```

### 4. Verify the Join Table
```sql
SELECT * FROM "_cartTopart_order_item" WHERE "A" = 'your-cart-id';
```

This should show all part_order_item IDs linked to your cart.

## Expected Behavior Summary

✅ **When you add a part:**
- Creates a temporary `sticker_order` with status "cart_temp"
- Creates a `part_order_item` linked to that order
- Links the `part_order_item` to your cart via join table
- Returns full cart with the part in `partOrderItems` array

✅ **The customization options:**
- Are stored exactly as you send them
- Include all translations for dropdown items
- Are preserved in the `customizationOptions` JSON field

✅ **The part details:**
- Full part object with all translations
- All related groups with translations
- All links with translations
- All accessories with translations

✅ **The relation:**
- Many-to-many between cart and part_order_item
- Stored in `_cartTopart_order_item` join table
- Visible when expanding relations in Prisma Studio
