# Orders API Documentation

## Overview
This document describes the API endpoints for retrieving orders from the RevSticks backend system.

---

## Endpoints

### 1. Get All Orders (with optional filtering)

**Endpoint:** `GET /orders`

**Description:** Retrieves all orders in the system with pagination support. Can optionally filter by status.

**Authorization:** Admin only (requires `ADMIN` role)

**Query Parameters:**
- `page` (optional): Page number for pagination
  - Type: `number`
  - Default: `1`
  - Example: `?page=2`
  
- `limit` (optional): Number of orders per page
  - Type: `number`
  - Default: `10`
  - Example: `?limit=20`
  
- `status` (optional): Filter orders by status
  - Type: `sticker_order_status_enum`
  - Valid values: `stand`, `pending`, `completed`, `cancelled`
  - Example: `?status=pending`

**Example Requests:**
```
GET /orders
GET /orders?page=1&limit=20
GET /orders?status=completed
GET /orders?page=2&limit=10&status=pending
```

**Response Structure:**
```json
{
  "parsedOrders": [
    {
      "id": "order-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+41 79 123 45 67",
      "street": "Main Street",
      "houseNumber": "123",
      "zipCode": "8000",
      "city": "Zurich",
      "country": "CH",
      "additionalAddressInfo": null,
      "paymentMethod": "stripe",
      "comment": "Please deliver after 5pm",
      "paymentId": "pi_xxx",
      "totalPrice": 125.50,
      "shipmentCost": 9.00,
      "status": "pending",
      "orderDate": "2026-03-14T10:30:00.000Z",
      "userId": "user-uuid",
      "guestEmail": null,
      "discountId": "discount-uuid",
      "items": [
        {
          "id": "item-uuid",
          "width": 10,
          "height": 15,
          "vinyl": true,
          "printed": false,
          "quantity": 2,
          "stickerId": "sticker-uuid",
          "customStickerId": null,
          "customizationOptions": [
            {
              "type": "dropdown",
              "optionId": "0",
              "value": "red",
              "translations": {
                "en": { "label": "Red" },
                "de": { "label": "Rot" }
              }
            }
          ],
          "sticker": {
            "id": "sticker-uuid",
            "name": "Custom Logo",
            "images": ["https://..."],
            "translations": [
              {
                "language": "de",
                "title": "Custom Logo"
              }
            ]
          },
          "customSticker": null
        }
      ],
      "partItems": [
        {
          "id": "part-item-uuid",
          "partId": "part-uuid",
          "quantity": 1,
          "customizationOptions": [
            {
              "type": "color",
              "value": "#FF0000"
            }
          ],
          "part": {
            "id": "part-uuid",
            "name": "Handlebar",
            "price": 45.00,
            "images": ["https://..."],
            "translations": [
              {
                "language": "de",
                "title": "Lenker"
              }
            ]
          }
        }
      ],
      "powdercoatItems": [
        {
          "id": "powdercoat-item-uuid",
          "powdercoatingServiceId": "service-uuid",
          "quantity": 1,
          "color": "Matte Black",
          "powdercoatingService": {
            "id": "service-uuid",
            "name": "Frame Powdercoating",
            "price": 120.00
          }
        }
      ],
      "discount": {
        "id": "discount-uuid",
        "code": "SPRING2026",
        "type": "percentage",
        "value": 10
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

**Response Fields:**

- `parsedOrders`: Array of order objects with the following structure:
  - `id`: Unique order identifier
  - `firstName`, `lastName`, `email`, `phone`: Customer contact information
  - `street`, `houseNumber`, `zipCode`, `city`, `country`: Shipping address
  - `additionalAddressInfo`: Optional additional address information
  - `paymentMethod`: Payment method used (e.g., "stripe", "invoice")
  - `comment`: Optional customer comment
  - `paymentId`: Payment transaction ID
  - `totalPrice`: Total order price including shipping
  - `shipmentCost`: Shipping cost
  - `status`: Order status (`stand`, `pending`, `completed`, `cancelled`)
  - `orderDate`: Date and time when order was created
  - `userId`: User ID (if authenticated user) or null (if guest)
  - `guestEmail`: Email for guest orders
  - `discountId`: Applied discount ID (if any)
  - `items`: Array of sticker order items with customization options and translations
  - `partItems`: Array of part order items with customization options and translations
  - `powdercoatItems`: Array of powdercoat service items
  - `discount`: Applied discount details (if any)

- `meta`: Pagination metadata
  - `total`: Total number of orders matching the filter
  - `page`: Current page number
  - `limit`: Number of items per page
  - `totalPages`: Total number of pages

**Status Codes:**
- `200 OK`: Successfully retrieved orders
- `401 Unauthorized`: User is not authenticated
- `403 Forbidden`: User does not have admin role

---

### 2. Get Pending Orders

**Endpoint:** `GET /orders/pending`

**Description:** Retrieves all orders with status "pending". This is a convenience endpoint that filters orders in the "pending" status, which indicates orders that have been paid but not yet completed or shipped.

**Authorization:** Admin only (requires `ADMIN` role)

**Query Parameters:**
- `page` (optional): Page number for pagination
  - Type: `number`
  - Default: `1`
  - Example: `?page=2`
  
- `limit` (optional): Number of orders per page
  - Type: `number`
  - Default: `10`
  - Example: `?limit=20`

**Example Requests:**
```
GET /orders/pending
GET /orders/pending?page=1&limit=20
GET /orders/pending?page=3&limit=5
```

**Response Structure:**
Same as the "Get All Orders" endpoint above, but `parsedOrders` array will only contain orders with `status: "pending"`.

```json
{
  "parsedOrders": [
    {
      "id": "order-uuid",
      "status": "pending",
      // ... all other order fields as described above
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Use Case:**
This endpoint is particularly useful for:
- Viewing orders that need to be processed and fulfilled
- Dashboard views showing pending work
- Automation workflows that process paid orders

**Status Codes:**
- `200 OK`: Successfully retrieved pending orders
- `401 Unauthorized`: User is not authenticated
- `403 Forbidden`: User does not have admin role

---

## Order Status Flow

Understanding order statuses:

1. **`stand`**: Order created but payment not yet completed
2. **`pending`**: Payment successful, awaiting processing/shipment
3. **`completed`**: Order processed and shipped to customer
4. **`cancelled`**: Order cancelled

---

## Notes

- Both endpoints return the same response structure
- The `/orders/pending` endpoint is equivalent to calling `/orders?status=pending`
- Orders are always sorted by `orderDate` in descending order (newest first)
- `customizationOptions` are parsed from JSON strings and enhanced with translations for dropdown options
- Pagination helps manage large result sets efficiently
- The `meta` object provides all necessary information for building pagination UI components
