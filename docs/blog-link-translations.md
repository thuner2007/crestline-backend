# Blog API - Link Translations Update

## Overview

Blog posts now support **translated links** where each link can have different URLs and titles for each language. This is useful for linking to language-specific pages or resources.

## Link Structure

Each link in a blog post now contains an array of translations, where each translation has:

- `language`: The language code (de, en, fr, it)
- `url`: The URL for that specific language
- `title`: The link title/text for that specific language

## Example: Creating a Blog Post with Translated Links

### Request

**POST** `/blog`

```json
{
  "author": "John Doe",
  "writingDate": "2025-11-10",
  "active": true,
  "translations": [
    {
      "language": "de",
      "title": "Deutscher Titel",
      "markdownContent": "# Deutscher Inhalt\n\nMarkdown text auf Deutsch..."
    },
    {
      "language": "en",
      "title": "English Title",
      "markdownContent": "# English Content\n\nMarkdown text in English..."
    }
  ],
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "altText": "Image description"
    }
  ],
  "links": [
    {
      "translations": [
        {
          "language": "de",
          "url": "https://revsticks.ch/de/produkt",
          "title": "Zu unserem Produkt"
        },
        {
          "language": "en",
          "url": "https://revsticks.ch/en/product",
          "title": "Visit our product"
        }
      ]
    },
    {
      "translations": [
        {
          "language": "de",
          "url": "https://revsticks.ch/de/kontakt",
          "title": "Kontaktiere uns"
        },
        {
          "language": "en",
          "url": "https://revsticks.ch/en/contact",
          "title": "Contact us"
        },
        {
          "language": "fr",
          "url": "https://revsticks.ch/fr/contact",
          "title": "Contactez-nous"
        }
      ]
    }
  ]
}
```

### Response

```json
{
  "id": "blog-post-uuid",
  "author": "John Doe",
  "writingDate": "2025-11-10T00:00:00.000Z",
  "active": true,
  "translations": [
    {
      "id": "trans-1",
      "language": "de",
      "title": "Deutscher Titel",
      "markdownContent": "# Deutscher Inhalt\n\nMarkdown text auf Deutsch..."
    },
    {
      "id": "trans-2",
      "language": "en",
      "title": "English Title",
      "markdownContent": "# English Content\n\nMarkdown text in English..."
    }
  ],
  "images": [...],
  "links": [
    {
      "id": "link-1",
      "translations": [
        {
          "id": "link-trans-1",
          "language": "de",
          "url": "https://revsticks.ch/de/produkt",
          "title": "Zu unserem Produkt"
        },
        {
          "id": "link-trans-2",
          "language": "en",
          "url": "https://revsticks.ch/en/product",
          "title": "Visit our product"
        }
      ]
    },
    {
      "id": "link-2",
      "translations": [...]
    }
  ]
}
```

## Getting Blog Posts with Language Filter

When you request blog posts with a specific language, only the translations for that language will be returned:

### Request

**GET** `/blog?language=de`

### Response

```json
[
  {
    "id": "blog-post-uuid",
    "author": "John Doe",
    "writingDate": "2025-11-10T00:00:00.000Z",
    "active": true,
    "translations": [
      {
        "id": "trans-1",
        "language": "de",
        "title": "Deutscher Titel",
        "markdownContent": "# Deutscher Inhalt\n\nMarkdown text auf Deutsch..."
      }
    ],
    "images": [...],
    "links": [
      {
        "id": "link-1",
        "translations": [
          {
            "id": "link-trans-1",
            "language": "de",
            "url": "https://revsticks.ch/de/produkt",
            "title": "Zu unserem Produkt"
          }
        ]
      },
      {
        "id": "link-2",
        "translations": [
          {
            "id": "link-trans-3",
            "language": "de",
            "url": "https://revsticks.ch/de/kontakt",
            "title": "Kontaktiere uns"
          }
        ]
      }
    ]
  }
]
```

## Migration Required

To apply these changes to your database:

1. **Development:**

   ```bash
   npx prisma migrate dev --name add_link_translations
   ```

2. **Production:**
   ```bash
   npx prisma migrate deploy
   ```

## Database Schema Changes

### New Table: `blog_link_translation`

Stores the translated versions of each link:

- `id`: UUID
- `blogLinkId`: Foreign key to `blog_link`
- `language`: Language code (de, en, fr, it)
- `url`: The URL for this language
- `title`: The link title for this language

### Updated Table: `blog_link`

Now only contains:

- `id`: UUID
- `blogPostId`: Foreign key to `blog_post`
- `createdAt`: Timestamp

The `url` and `title` fields have been moved to `blog_link_translation`.

## Benefits

1. **Language-specific URLs**: Link to different pages for different languages (e.g., `/de/produkt` vs `/en/product`)
2. **Localized link text**: Display link titles in the appropriate language
3. **Flexible content**: Add or remove link translations without affecting other languages
4. **Consistent API**: Follows the same pattern as blog post translations

## Important Notes

- Each link must have at least one translation
- You can have different numbers of translations for different links
- When filtering by language, only links with that language translation will be shown
- Deleting a link will cascade delete all its translations
