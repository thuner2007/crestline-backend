# Part Links - Quick Example

## Example JSON Structure

### Creating a Part with Links

```json
{
  "price": 29.99,
  "quantity": 50,
  "active": true,
  "type": "accessory",
  "groups": ["group-uuid-1", "group-uuid-2"],
  "translations": {
    "de": {
      "title": "Premium Griff",
      "description": "Hochwertiger ergonomischer Griff"
    },
    "en": {
      "title": "Premium Grip",
      "description": "High-quality ergonomic grip"
    },
    "fr": {
      "title": "Poignée Premium",
      "description": "Poignée ergonomique de haute qualité"
    },
    "it": {
      "title": "Impugnatura Premium",
      "description": "Impugnatura ergonomica di alta qualità"
    }
  },
  "links": [
    {
      "translations": {
        "de": {
          "title": "Montage-Video ansehen",
          "url": "https://youtube.com/watch?v=de_assembly"
        },
        "en": {
          "title": "Watch Assembly Video",
          "url": "https://youtube.com/watch?v=en_assembly"
        },
        "fr": {
          "title": "Voir la vidéo de montage",
          "url": "https://youtube.com/watch?v=fr_assembly"
        },
        "it": {
          "title": "Guarda il video di montaggio",
          "url": "https://youtube.com/watch?v=it_assembly"
        }
      }
    },
    {
      "translations": {
        "de": {
          "title": "PDF-Anleitung herunterladen",
          "url": "https://revsticks.com/docs/de/grip-guide.pdf"
        },
        "en": {
          "title": "Download PDF Guide",
          "url": "https://revsticks.com/docs/en/grip-guide.pdf"
        },
        "fr": {
          "title": "Télécharger le guide PDF",
          "url": "https://revsticks.com/docs/fr/grip-guide.pdf"
        },
        "it": {
          "title": "Scarica la guida PDF",
          "url": "https://revsticks.com/docs/it/grip-guide.pdf"
        }
      }
    },
    {
      "translations": {
        "de": {
          "title": "Kompatible Produkte",
          "url": "https://revsticks.com/de/compatible-products"
        },
        "en": {
          "title": "Compatible Products",
          "url": "https://revsticks.com/en/compatible-products"
        },
        "fr": {
          "title": "Produits compatibles",
          "url": "https://revsticks.com/fr/compatible-products"
        },
        "it": {
          "title": "Prodotti compatibili",
          "url": "https://revsticks.com/it/compatible-products"
        }
      }
    }
  ]
}
```

## Response Format

When you GET a part, you'll receive:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "price": "29.99",
  "quantity": 50,
  "active": true,
  "translations": [
    {
      "id": "trans-uuid",
      "partId": "550e8400-e29b-41d4-a716-446655440000",
      "language": "en",
      "title": "Premium Grip",
      "description": "High-quality ergonomic grip"
    }
    // ... other languages
  ],
  "links": [
    {
      "id": "link-uuid-1",
      "partId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-11-11T20:00:00Z",
      "translations": [
        {
          "id": "link-trans-uuid-1-de",
          "partLinkId": "link-uuid-1",
          "language": "de",
          "title": "Montage-Video ansehen",
          "url": "https://youtube.com/watch?v=de_assembly"
        },
        {
          "id": "link-trans-uuid-1-en",
          "partLinkId": "link-uuid-1",
          "language": "en",
          "title": "Watch Assembly Video",
          "url": "https://youtube.com/watch?v=en_assembly"
        },
        {
          "id": "link-trans-uuid-1-fr",
          "partLinkId": "link-uuid-1",
          "language": "fr",
          "title": "Voir la vidéo de montage",
          "url": "https://youtube.com/watch?v=fr_assembly"
        },
        {
          "id": "link-trans-uuid-1-it",
          "partLinkId": "link-uuid-1",
          "language": "it",
          "title": "Guarda il video di montaggio",
          "url": "https://youtube.com/watch?v=it_assembly"
        }
      ]
    }
    // ... more links
  ]
}
```

## Quick Frontend Helper

```javascript
/**
 * Extract links for a specific language from a part
 */
function getLinksForLanguage(part, language) {
  return part.links.map(link => {
    const translation = link.translations.find(t => t.language === language);
    return translation ? {
      title: translation.title,
      url: translation.url
    } : null;
  }).filter(Boolean);
}

// Usage
const part = await fetch('/parts/some-uuid').then(r => r.json());
const englishLinks = getLinksForLanguage(part, 'en');
console.log(englishLinks);
// [
//   { title: "Watch Assembly Video", url: "https://youtube.com/..." },
//   { title: "Download PDF Guide", url: "https://revsticks.com/..." }
// ]
```

## Update Example

To update only the links (leave everything else unchanged):

```json
{
  "links": [
    {
      "translations": {
        "de": {
          "title": "Neues Video",
          "url": "https://youtube.com/watch?v=new_video_de"
        },
        "en": {
          "title": "New Video",
          "url": "https://youtube.com/watch?v=new_video_en"
        },
        "fr": {
          "title": "Nouvelle vidéo",
          "url": "https://youtube.com/watch?v=new_video_fr"
        },
        "it": {
          "title": "Nuovo video",
          "url": "https://youtube.com/watch?v=new_video_it"
        }
      }
    }
  ]
}
```

## Remove All Links

```json
{
  "links": []
}
```
