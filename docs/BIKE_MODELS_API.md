# Bike Models API Documentation

This document provides comprehensive information about the Bike Models API endpoints and their integration with the Parts system.

## Overview

The Bike Models feature allows you to:
- Create and manage motorcycle/bike models
- Associate bike models with parts
- Filter and sort parts by bike model compatibility
- Get parts prioritized by bike model relevance

## Bike Models Endpoints

### 1. Create Bike Model

Creates a new bike model.

**Endpoint:** `POST /bike-models`

**Auth:** Requires ADMIN role

**Request Body:**
```json
{
  "manufacturer": "KTM",
  "model": "EXC 125",
  "year": 2023,
  "active": true
}
```

**Fields:**
- `manufacturer` (string, required): The bike manufacturer name
- `model` (string, required): The bike model name
- `year` (number, optional): The model year (1900-2100)
- `active` (boolean, optional): Whether the bike model is active (default: true)

**Response:**
```json
{
  "id": "uuid-here",
  "manufacturer": "KTM",
  "model": "EXC 125",
  "year": 2023,
  "active": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "parts": []
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/bike-models \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "manufacturer": "YAMAHA",
    "model": "DT 200",
    "year": 2022
  }'
```

---

### 2. Get All Bike Models

Retrieves all bike models with optional filtering.

**Endpoint:** `GET /bike-models`

**Auth:** Public (no authentication required)

**Query Parameters:**
- `status` (optional): Filter by status
  - `active` - Only active bike models
  - `inactive` - Only inactive bike models
  - `all` - All bike models (default)
- `manufacturer` (optional): Filter by manufacturer name (case-insensitive partial match)

**Response:**
```json
[
  {
    "id": "uuid-1",
    "manufacturer": "KTM",
    "model": "EXC 125",
    "year": 2023,
    "active": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "_count": {
      "parts": 15
    }
  },
  {
    "id": "uuid-2",
    "manufacturer": "YAMAHA",
    "model": "DT 200",
    "year": 2022,
    "active": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "_count": {
      "parts": 8
    }
  }
]
```

**Examples:**
```bash
# Get all bike models
curl http://localhost:3000/bike-models

# Get only active bike models
curl http://localhost:3000/bike-models?status=active

# Filter by manufacturer
curl http://localhost:3000/bike-models?manufacturer=KTM

# Combine filters
curl http://localhost:3000/bike-models?status=active&manufacturer=YAMAHA
```

---

### 3. Get Manufacturers List

Retrieves a list of all unique manufacturers.

**Endpoint:** `GET /bike-models/manufacturers`

**Auth:** Public (no authentication required)

**Response:**
```json
[
  "BETA",
  "HONDA",
  "HUSQVARNA",
  "KAWASAKI",
  "KTM",
  "SUZUKI",
  "YAMAHA"
]
```

**Example:**
```bash
curl http://localhost:3000/bike-models/manufacturers
```

---

### 4. Get Single Bike Model

Retrieves a single bike model by ID with all associated parts.

**Endpoint:** `GET /bike-models/:id`

**Auth:** Public (no authentication required)

**Path Parameters:**
- `id` (required): The bike model UUID

**Response:**
```json
{
  "id": "uuid-here",
  "manufacturer": "KTM",
  "model": "EXC 125",
  "year": 2023,
  "active": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "parts": [
    {
      "id": "part-uuid-1",
      "price": "29.99",
      "quantity": 50,
      "translations": [
        {
          "language": "en",
          "title": "Chain Guide",
          "description": "High-quality chain guide"
        }
      ]
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/bike-models/uuid-here
```

---

### 5. Update Bike Model

Updates an existing bike model.

**Endpoint:** `PATCH /bike-models/:id`

**Auth:** Requires ADMIN role

**Path Parameters:**
- `id` (required): The bike model UUID

**Request Body:** (all fields optional)
```json
{
  "manufacturer": "KTM",
  "model": "EXC 150",
  "year": 2024,
  "active": false
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "manufacturer": "KTM",
  "model": "EXC 150",
  "year": 2024,
  "active": false,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-02T00:00:00.000Z",
  "parts": []
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/bike-models/uuid-here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "year": 2024
  }'
```

---

### 6. Toggle Bike Model Active Status

Toggles the active status of a bike model.

**Endpoint:** `PATCH /bike-models/:id/toggle-active`

**Auth:** Requires ADMIN role

**Path Parameters:**
- `id` (required): The bike model UUID

**Response:**
```json
{
  "id": "uuid-here",
  "manufacturer": "KTM",
  "model": "EXC 125",
  "year": 2023,
  "active": false,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-02T00:00:00.000Z",
  "parts": []
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/bike-models/uuid-here/toggle-active \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 7. Delete Bike Model

Deletes a bike model.

**Endpoint:** `DELETE /bike-models/:id`

**Auth:** Requires ADMIN role

**Path Parameters:**
- `id` (required): The bike model UUID

**Response:** `204 No Content`

**Example:**
```bash
curl -X DELETE http://localhost:3000/bike-models/uuid-here \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Parts Integration Endpoints

### 8. Assign Bike Models to Part

Assigns bike models to a part (replaces existing associations).

**Endpoint:** `POST /parts/:id/bike-models`

**Auth:** Requires ADMIN role

**Path Parameters:**
- `id` (required): The part UUID

**Request Body:**
```json
{
  "bikeModelIds": [
    "bike-model-uuid-1",
    "bike-model-uuid-2",
    "bike-model-uuid-3"
  ]
}
```

**Response:**
```json
{
  "id": "part-uuid",
  "price": "29.99",
  "quantity": 100,
  "active": true,
  "groups": [...],
  "translations": [...],
  "links": [...],
  "accessories": [...],
  "bikeModels": [
    {
      "id": "bike-model-uuid-1",
      "manufacturer": "KTM",
      "model": "EXC 125",
      "year": 2023,
      "active": true
    },
    {
      "id": "bike-model-uuid-2",
      "manufacturer": "YAMAHA",
      "model": "DT 200",
      "year": 2022,
      "active": true
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/parts/part-uuid-here/bike-models \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "bikeModelIds": ["bike-uuid-1", "bike-uuid-2"]
  }'
```

---

### 9. Get Parts Filtered by Bike Model

Get all parts with bike model filtering. Parts compatible with the specified bike model appear first, followed by all other parts.

**Endpoint:** `GET /parts`

**Auth:** Public (no authentication required)

**Query Parameters:**
- `bikeModelId` (optional): Filter and prioritize by bike model UUID
- `status` (optional): Filter by status (`active`, `inactive`, `all`)
- `amount` (optional): Number of results to return (default: 20)
- `start` (optional): Offset for pagination (default: 0)
- `groupIds` (optional): Comma-separated part group IDs
- `random` (optional): Randomize results (boolean)
- `sortBy` (optional): Field to sort by (default: `sortingRank`)
- `sortOrder` (optional): Sort order (`asc` or `desc`, default: `asc`)

**Response:**
```json
{
  "data": [
    {
      "id": "part-uuid-1",
      "price": "29.99",
      "quantity": 50,
      "translations": [...],
      "groups": [...],
      "bikeModels": [
        {
          "id": "bike-model-uuid",
          "manufacturer": "KTM",
          "model": "EXC 125"
        }
      ]
    }
  ],
  "meta": {
    "total": 100,
    "limit": 20,
    "skip": 0,
    "totalPages": 5
  }
}
```

**Examples:**
```bash
# Get parts prioritized for KTM EXC 125
curl "http://localhost:3000/parts?bikeModelId=bike-model-uuid"

# Combine with other filters
curl "http://localhost:3000/parts?bikeModelId=bike-model-uuid&status=active&amount=10"

# With pagination
curl "http://localhost:3000/parts?bikeModelId=bike-model-uuid&amount=20&start=20"
```

**Behavior:**
- When `bikeModelId` is provided, parts are returned in two groups:
  1. Parts that are compatible with the specified bike model (sorted by `sortBy`)
  2. All other parts (sorted by `sortBy`)
- Pagination is applied to the combined result
- This ensures compatible parts always appear first in the results

---

### 10. Get Parts with Stock Filtered by Bike Model

Same as Get Parts, but includes stock information for dropdown options.

**Endpoint:** `GET /parts/with-stock`

**Auth:** Public (no authentication required)

**Query Parameters:** Same as Get Parts endpoint

**Response:** Same structure as Get Parts, but includes stock information in `customizationOptions`

**Example:**
```bash
curl "http://localhost:3000/parts/with-stock?bikeModelId=bike-model-uuid"
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Bike model with ID xyz not found",
  "error": "Not Found"
}
```

---

## Workflow Examples

### Example 1: Setting up parts for a new bike model

```bash
# 1. Create a bike model
BIKE_ID=$(curl -X POST http://localhost:3000/bike-models \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "manufacturer": "KTM",
    "model": "EXC 300",
    "year": 2024
  }' | jq -r '.id')

# 2. Get existing parts
PART_IDS=$(curl http://localhost:3000/parts | jq -r '.data[0:3] | .[].id')

# 3. Assign bike model to parts
for PART_ID in $PART_IDS; do
  curl -X POST "http://localhost:3000/parts/$PART_ID/bike-models" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"bikeModelIds\": [\"$BIKE_ID\"]}"
done
```

### Example 2: Finding parts for a customer's bike

```bash
# 1. Get all manufacturers
curl http://localhost:3000/bike-models/manufacturers

# 2. Get all KTM models
curl "http://localhost:3000/bike-models?manufacturer=KTM"

# 3. Get parts for specific bike model
curl "http://localhost:3000/parts/with-stock?bikeModelId=bike-uuid-here&status=active"
```

---

## Database Schema

### bike_model Table

```prisma
model bike_model {
  id           String   @id @default(uuid())
  manufacturer String   @db.VarChar
  model        String   @db.VarChar
  year         Int?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime @updatedAt @db.Timestamptz(6)

  // Many-to-many relation with parts
  parts part[]

  @@unique([manufacturer, model, year])
  @@index([manufacturer])
  @@index([active])
}
```

### Relationship with Parts

The `part` model has been updated to include:

```prisma
model part {
  // ... other fields ...
  
  // Many-to-many relation with bike models
  bikeModels bike_model[]
  
  // ... other fields ...
}
```

This creates a many-to-many relationship through a join table, allowing:
- One bike model to be associated with multiple parts
- One part to be compatible with multiple bike models

---

## Notes

- The combination of `manufacturer`, `model`, and `year` must be unique
- When filtering parts by bike model, compatible parts always appear first in results
- Bike models can be deactivated without deleting them
- Assigning bike models to a part replaces all existing associations
- To clear all bike models from a part, send an empty array: `{"bikeModelIds": []}`
