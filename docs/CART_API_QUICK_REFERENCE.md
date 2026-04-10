# Cart API Quick Reference

## Endpoints Summary

All endpoints support both `userId` (authenticated) and `anonymousToken` (anonymous) query parameters.

### GET /cart
Get cart with all items and full details.

**Query Params:** `userId` OR `anonymousToken` (required)

**Response:** Full cart object with:
- Stickers with translations
- Parts with translations, customization options (including translations for dropdowns), groups, links, accessories
- Powdercoat services

---

### POST /cart/part
Add a part to cart.

**Query Params:** `userId` OR `anonymousToken` (required)

**Body:**
```json
{
  "partId": "uuid",
  "quantity": 1,
  "customizationOptions": { /* user selections */ }
}
```

**Note:** Full customization options with translations are automatically included from the part.

---

### POST /cart/sticker
Add a sticker to cart.

**Query Params:** `userId` OR `anonymousToken` (required)

**Body:**
```json
{
  "stickerId": "uuid",
  "width": 100,
  "height": 50,
  "vinyl": true,
  "printed": false,
  "quantity": 1,
  "customizationOptions": []
}
```

---

### POST /cart/powdercoat-service
Add a powdercoat service to cart.

**Query Params:** `userId` OR `anonymousToken` (required)

**Body:**
```json
{
  "powdercoatingServiceId": "uuid",
  "quantity": 1,
  "color": "Red",
  "customizationOptions": []
}
```

---

### PATCH /cart/{type}/amount/{id}
Update item quantity.

**Types:** `sticker`, `part`, `powdercoat-service`

**Query Params:** `userId` OR `anonymousToken` (required)

**Body:**
```json
{
  "amount": 2
}
```

---

### DELETE /cart/{type}/{id}
Remove item from cart.

**Types:** `sticker`, `part`, `powdercoat-service`

**Query Params:** `userId` OR `anonymousToken` (required)

---

### DELETE /cart/clear
Clear all items from cart (keeps cart).

**Query Params:** `userId` OR `anonymousToken` (required)

---

### DELETE /cart
Delete entire cart.

**Query Params:** `userId` OR `anonymousToken` (required)

---

## Frontend Integration

### Anonymous User
```javascript
// Generate token on first use
const token = crypto.randomUUID();
localStorage.setItem('cartToken', token);

// Use in requests
const cart = await fetch(`/api/cart?anonymousToken=${token}`);
```

### Authenticated User
```javascript
// Extract from JWT
const userId = getUserIdFromJWT();

// Use in requests
const cart = await fetch(`/api/cart?userId=${userId}`);
```

## Key Features

- ✅ Supports both authenticated and anonymous users
- ✅ Anonymous carts expire after 72 hours
- ✅ Automatic cleanup of expired carts (hourly)
- ✅ Full customization options with translations
- ✅ Complete part details with translations, groups, links, accessories
- ✅ Rate limited (15 req/sec)
- ✅ Public endpoints (no auth required for anonymous)

## Cleanup

### Automatic
Runs every hour automatically.

### Manual
```http
POST /scheduler/cart-cleanup/manual
```
