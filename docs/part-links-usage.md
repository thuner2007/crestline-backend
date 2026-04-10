# Part Links Feature - Usage Guide

## Overview

Parts now support multilingual links! You can add links with titles translated in 4 languages (de, en, fr, it). Each link can have a different URL and title for each language.

## Database Structure

### Tables Created

- `part_link`: Main link table connected to parts
- `part_link_translation`: Stores URL and title for each language

### Relationships

- Each `part` can have multiple `part_link` entries
- Each `part_link` must have translations for each language you want to support
- Cascade delete: When a part is deleted, all its links are automatically deleted

## API Usage

### Creating a Part with Links

When creating a part, you can include links in the request body:

```json
{
  "price": 29.99,
  "quantity": 100,
  "translations": {
    "de": { "title": "Mein Teil", "description": "Beschreibung" },
    "en": { "title": "My Part", "description": "Description" },
    "fr": { "title": "Ma Pièce", "description": "Description" },
    "it": { "title": "La Mia Parte", "description": "Descrizione" }
  },
  "links": [
    {
      "translations": {
        "de": {
          "title": "Installationsanleitung",
          "url": "https://example.com/de/installation"
        },
        "en": {
          "title": "Installation Guide",
          "url": "https://example.com/en/installation"
        },
        "fr": {
          "title": "Guide d'installation",
          "url": "https://example.com/fr/installation"
        },
        "it": {
          "title": "Guida all'installazione",
          "url": "https://example.com/it/installation"
        }
      }
    },
    {
      "translations": {
        "de": {
          "title": "Produktvideo",
          "url": "https://youtube.com/watch?v=de_video"
        },
        "en": {
          "title": "Product Video",
          "url": "https://youtube.com/watch?v=en_video"
        },
        "fr": {
          "title": "Vidéo du produit",
          "url": "https://youtube.com/watch?v=fr_video"
        },
        "it": {
          "title": "Video del prodotto",
          "url": "https://youtube.com/watch?v=it_video"
        }
      }
    }
  ]
}
```

### Creating a Part with Links (FormData)

When using FormData (with file uploads), stringify the links:

```javascript
const formData = new FormData();
formData.append('price', '29.99');
formData.append('quantity', '100');
formData.append(
  'translations',
  JSON.stringify({
    de: { title: 'Mein Teil', description: 'Beschreibung' },
    en: { title: 'My Part', description: 'Description' },
    // ... other languages
  }),
);
formData.append(
  'links',
  JSON.stringify([
    {
      translations: {
        de: {
          title: 'Installationsanleitung',
          url: 'https://example.com/de/installation',
        },
        en: {
          title: 'Installation Guide',
          url: 'https://example.com/en/installation',
        },
        fr: {
          title: "Guide d'installation",
          url: 'https://example.com/fr/installation',
        },
        it: {
          title: "Guida all'installazione",
          url: 'https://example.com/it/installation',
        },
      },
    },
  ]),
);
// Add images
formData.append('images', imageFile1);
formData.append('images', imageFile2);
```

### Updating a Part's Links

To update links, send the complete new set of links. The system will:

1. Delete all existing links for the part
2. Create the new links you provide

```json
{
  "links": [
    {
      "translations": {
        "de": { "title": "Neuer Link", "url": "https://example.com/de/new" },
        "en": { "title": "New Link", "url": "https://example.com/en/new" },
        "fr": { "title": "Nouveau lien", "url": "https://example.com/fr/new" },
        "it": { "title": "Nuovo link", "url": "https://example.com/it/new" }
      }
    }
  ]
}
```

To remove all links, send an empty array:

```json
{
  "links": []
}
```

### Getting Parts with Links

All endpoints that retrieve parts now include links:

#### Get Single Part

```http
GET /parts/:id
```

Response includes:

```json
{
  "id": "uuid",
  "price": 29.99,
  "translations": [...],
  "links": [
    {
      "id": "link-uuid",
      "partId": "part-uuid",
      "createdAt": "2025-11-11T20:00:00Z",
      "translations": [
        {
          "id": "translation-uuid",
          "partLinkId": "link-uuid",
          "language": "de",
          "title": "Installationsanleitung",
          "url": "https://example.com/de/installation"
        },
        {
          "id": "translation-uuid",
          "partLinkId": "link-uuid",
          "language": "en",
          "title": "Installation Guide",
          "url": "https://example.com/en/installation"
        },
        // ... other languages
      ]
    }
  ]
}
```

#### Get All Parts

```http
GET /parts
GET /parts?status=active&amount=20
GET /parts/with-stock
```

All these endpoints now include links in the response.

## Frontend Integration Example

### Display Links in Your Frontend

```javascript
// Assuming you have the part data
const part = await fetchPart(partId);
const userLanguage = 'en'; // Get from user settings or browser

// Filter links for the user's language
const linksForLanguage = part.links.map((link) => {
  const translation = link.translations.find(
    (t) => t.language === userLanguage,
  );
  return {
    id: link.id,
    title: translation?.title || '',
    url: translation?.url || '',
  };
});

// Render links
linksForLanguage.forEach((link) => {
  console.log(`<a href="${link.url}">${link.title}</a>`);
});
```

### React Component Example

```jsx
function PartLinks({ part, language }) {
  return (
    <div className="part-links">
      <h3>Related Links</h3>
      {part.links.map((link) => {
        const translation = link.translations.find(
          (t) => t.language === language,
        );
        if (!translation) return null;

        return (
          <a
            key={link.id}
            href={translation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="part-link"
          >
            {translation.title}
          </a>
        );
      })}
    </div>
  );
}
```

## Use Cases

1. **Installation Guides**: Link to language-specific installation instructions
2. **Product Videos**: YouTube or Vimeo videos in different languages
3. **Documentation**: Technical documentation in multiple languages
4. **Support Pages**: Customer support pages in the user's language
5. **Related Products**: Links to related parts or accessories
6. **Warranty Information**: Warranty terms and conditions by region

## Notes

- You must provide translations for all languages you want to support (de, en, fr, it)
- URLs can be different for each language (e.g., different YouTube videos)
- Links are automatically deleted when the part is deleted (cascade delete)
- The order of links is preserved as you submit them
- Maximum flexibility: Each language can have completely different URLs and titles
