# Parts with Powdercoat Colors Customization

This document shows how to create parts with powdercoat colors customization options.

## Example: Creating a Part with Powdercoat Colors Option

### API Endpoint

`POST /parts`

### Request Body (multipart/form-data)

```typescript
{
  "price": 25.50,
  "quantity": 100,
  "type": "brake-lever",
  "active": true,
  "sortingRank": 1,
  "customizationOptions": {
    "options": [
      {
        "type": "powdercoat",
        "translations": {
          "de": {
            "title": "Pulverbeschichtungsfarbe",
            "description": "Wählen Sie die gewünschte Pulverbeschichtungsfarbe"
          },
          "en": {
            "title": "Powdercoat Color",
            "description": "Choose your desired powdercoat color"
          },
          "fr": {
            "title": "Couleur de poudrage",
            "description": "Choisissez la couleur de poudrage désirée"
          },
          "it": {
            "title": "Colore verniciatura a polvere",
            "description": "Scegli il colore della verniciatura a polvere desiderato"
          }
        },
        "priceAdjustment": 5.00
      }
    ]
  },
  "translations": {
    "de": {
      "title": "Bremshebel",
      "description": "Hochwertige Bremshebel aus Aluminium"
    },
    "en": {
      "title": "Brake Lever",
      "description": "High-quality aluminum brake lever"
    },
    "fr": {
      "title": "Levier de frein",
      "description": "Levier de frein en aluminium de haute qualité"
    },
    "it": {
      "title": "Leva freno",
      "description": "Leva freno in alluminio di alta qualità"
    }
  },
  "groups": ["brake-parts-group-id"],
  "images": [/* uploaded files */]
}
```

### Available Powdercoat Colors

You can fetch the available powdercoat colors from:

- `GET /powdercoat-colors` - Get active colors only
- `GET /parts/powdercoat-colors` - Convenience endpoint (same as above)

### Frontend Integration

When the frontend encounters a customization option with `type: "powdercoat"`, it should:

1. Fetch available colors from `/powdercoat-colors`
2. Display them as selectable options
3. Apply any `priceAdjustment` specified in the option

### Expected Behavior

- The part will be created with the powdercoat customization option
- Customers can select from available powdercoat colors when ordering
- Price adjustments will be applied based on the customization option settings
- The customization options are stored as JSON in the database
