# Bike Models - Quick Reference Guide

## Quick Start

### 1. Create a Bike Model
```bash
POST /bike-models
{
  "manufacturer": "KTM",
  "model": "EXC 125",
  "year": 2023
}
```

### 2. Get All Bike Models
```bash
GET /bike-models
GET /bike-models?status=active
GET /bike-models?manufacturer=KTM
```

### 3. Assign Bike Models to a Part
```bash
POST /parts/{partId}/bike-models
{
  "bikeModelIds": ["uuid1", "uuid2"]
}
```

### 4. Get Parts for a Specific Bike
```bash
GET /parts?bikeModelId={bikeModelId}
GET /parts/with-stock?bikeModelId={bikeModelId}
```

## Key Features

✅ **Bike Model Management**
- Create, read, update, delete bike models
- Filter by manufacturer and status
- Get list of all manufacturers

✅ **Part Compatibility**
- Assign multiple bike models to parts
- Parts can be compatible with multiple bikes
- Many-to-many relationship

✅ **Smart Filtering**
- Compatible parts appear first
- Then all other parts
- Maintains pagination and sorting

## Database

**Table:** `bike_model`
- `id`: UUID (primary key)
- `manufacturer`: String (e.g., "KTM", "YAMAHA")
- `model`: String (e.g., "EXC 125", "DT 200")
- `year`: Integer (optional)
- `active`: Boolean
- Unique constraint on (manufacturer, model, year)

**Relationship:** Many-to-many with `part` table

## Sample Bike Models Created

- KTM EXC 125 (2023)
- KTM EXC 250 (2023)
- KTM EXC 300 (2023)
- YAMAHA DT 200 (2022)
- YAMAHA WR 250 (2023)
- YAMAHA YZ 450F (2023)
- HONDA CRF 250R (2023)
- HONDA CRF 450R (2023)
- HUSQVARNA TE 250 (2023)
- HUSQVARNA FE 350 (2023)
- SUZUKI RM-Z 250 (2022)
- SUZUKI DR-Z 400 (2022)
- KAWASAKI KX 250 (2023)
- KAWASAKI KLX 300R (2023)
- BETA RR 300 (2023)

## Common Use Cases

### Use Case 1: Customer browsing parts for their bike
```bash
# 1. Get manufacturers
GET /bike-models/manufacturers

# 2. Get models for selected manufacturer
GET /bike-models?manufacturer=KTM

# 3. Get compatible parts (sorted with compatible first)
GET /parts/with-stock?bikeModelId={selectedBikeId}&status=active
```

### Use Case 2: Admin adding compatibility to parts
```bash
# 1. Get bike model ID
GET /bike-models?manufacturer=YAMAHA&model=DT%20200

# 2. Assign to multiple parts
POST /parts/{partId1}/bike-models
POST /parts/{partId2}/bike-models
POST /parts/{partId3}/bike-models
```

### Use Case 3: Finding all parts for a bike model
```bash
# Get bike model with all compatible parts
GET /bike-models/{bikeModelId}
```

## Technical Implementation

### Files Created/Modified

**New Files:**
- `/src/bikeModels/bike-models.service.ts`
- `/src/bikeModels/bike-models.controller.ts`
- `/src/bikeModels/bike-models.module.ts`
- `/src/bikeModels/dto/bike-model.dto.ts`
- `/docs/BIKE_MODELS_API.md`
- `/docs/BIKE_MODELS_QUICK_REF.md`

**Modified Files:**
- `/prisma/schema.prisma` - Added bike_model table and relationship
- `/src/parts/parts.service.ts` - Added bike model filtering logic
- `/src/parts/parts.controller.ts` - Added bikeModelId query param
- `/prisma/seeds/parts.seed.ts` - Added bike model seeding
- `/src/app.module.ts` - Added BikeModelsModule

### Migration
- Migration file: `20260206092137_add_bike_models`
- Created bike_model table
- Created join table for part-bike_model relationship

## Testing

```bash
# Test bike model creation
curl -X POST http://localhost:3000/bike-models \
  -H "Content-Type: application/json" \
  -d '{"manufacturer":"TEST","model":"TEST 123","year":2023}'

# Test filtering
curl "http://localhost:3000/parts?bikeModelId=YOUR_BIKE_ID&amount=5"

# Verify compatible parts appear first
```

For full API documentation, see [BIKE_MODELS_API.md](./BIKE_MODELS_API.md)
