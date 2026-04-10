# Blog API Documentation

## Overview

The Blog API allows you to create, read, update, delete, activate, and deactivate blog posts with **multi-language support**. Each blog post can have translations in 4 languages (de, fr, it, en), along with author, writing date, images, and related links.

## Supported Languages

- `de` - German (Deutsch)
- `en` - English
- `fr` - French (Français)
- `it` - Italian (Italiano)

## Endpoints

### 1. Upload Blog Images

**POST** `/blog/upload-images`

Upload images for use in blog posts.

**Authentication:** Required (Admin/Moderator only)

**Body:** `multipart/form-data`

- `images`: File[] (one or more image files)

**Response:**

```json
{
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

---

### 2. Create Blog Post

**POST** `/blog`

Create a new blog post with translations in multiple languages.

**Authentication:** Required (Admin/Moderator only)

**Body:**

```json
{
  "author": "John Doe",
  "writingDate": "2025-11-06T10:00:00Z",
  "active": false,
  "translations": [
    {
      "language": "en",
      "title": "My Blog Post Title",
      "htmlContent": "<p>This is the blog content with <strong>HTML</strong> formatting.</p>"
    },
    {
      "language": "de",
      "title": "Mein Blog-Post-Titel",
      "htmlContent": "<p>Dies ist der Blog-Inhalt mit <strong>HTML</strong>-Formatierung.</p>"
    },
    {
      "language": "fr",
      "title": "Mon titre de publication de blog",
      "htmlContent": "<p>Ceci est le contenu du blog avec formatage <strong>HTML</strong>.</p>"
    },
    {
      "language": "it",
      "title": "Il mio titolo del post del blog",
      "htmlContent": "<p>Questo è il contenuto del blog con formattazione <strong>HTML</strong>.</p>"
    }
  ],
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "altText": "Description of image 1"
    }
  ],
  "links": [
    {
      "url": "https://example.com/related-article",
      "title": "Related Article Title"
    }
  ]
}
```

**Response:** Returns the created blog post with ID and all translations

---

### 3. Get All Blog Posts

**GET** `/blog`

Retrieve all blog posts or filter by active status and/or language.

**Authentication:** Public

**Query Parameters:**

- `activeOnly`: boolean (optional) - Set to `true` to get only active blog posts
- `language`: string (optional) - Filter by language (`de`, `en`, `fr`, `it`)

**Examples:**

- `/blog` - Get all blog posts with all translations
- `/blog?activeOnly=true` - Get only active blog posts
- `/blog?language=de` - Get all blog posts with German translations only
- `/blog?activeOnly=true&language=en` - Get active blog posts with English translations

**Response:**

```json
[
  {
    "id": "uuid",
    "author": "Author Name",
    "writingDate": "2025-11-06T10:00:00Z",
    "active": true,
    "createdAt": "2025-11-06T10:00:00Z",
    "updatedAt": "2025-11-06T10:00:00Z",
    "translations": [
      {
        "id": "uuid",
        "language": "en",
        "title": "Blog Title",
        "htmlContent": "<p>Content</p>",
        "blogPostId": "uuid"
      }
    ],
    "images": [...],
    "links": [...]
  }
]
```

---

### 4. Get Single Blog Post

**GET** `/blog/:id`

Retrieve a specific blog post by ID, optionally filtered by language.

**Authentication:** Public

**Query Parameters:**

- `language`: string (optional) - Get only a specific language translation (`de`, `en`, `fr`, `it`)

**Examples:**

- `/blog/abc123` - Get blog post with all translations
- `/blog/abc123?language=de` - Get blog post with only German translation

**Response:** Returns the blog post with all details including translations, images and links

---

### 5. Update Blog Post

**PATCH** `/blog/:id`

Update an existing blog post. All fields are optional.

**Authentication:** Required (Admin/Moderator only)

**Body:**

```json
{
  "author": "Updated Author",
  "writingDate": "2025-11-07T10:00:00Z",
  "active": true,
  "translations": [
    {
      "language": "en",
      "title": "Updated Title",
      "htmlContent": "<p>Updated content</p>"
    },
    {
      "language": "de",
      "title": "Aktualisierter Titel",
      "htmlContent": "<p>Aktualisierter Inhalt</p>"
    }
  ],
  "images": [
    {
      "url": "https://example.com/new-image.jpg",
      "altText": "New image"
    }
  ],
  "links": [
    {
      "url": "https://example.com/new-link",
      "title": "New Link"
    }
  ]
}
```

**Note:** When updating translations, images, or links, the entire collection is replaced. Include all items you want to keep.

**Response:** Returns the updated blog post

---

### 6. Delete Blog Post

**DELETE** `/blog/:id`

Permanently delete a blog post and all its translations.

**Authentication:** Required (Admin/Moderator only)

**Response:** Returns the deleted blog post

---

### 7. Activate Blog Post

**PATCH** `/blog/:id/activate`

Set a blog post to active status (makes it visible to public).

**Authentication:** Required (Admin/Moderator only)

**Response:** Returns the updated blog post with `active: true`

---

### 8. Deactivate Blog Post

**PATCH** `/blog/:id/deactivate`

Set a blog post to inactive status (hides it from public view).

**Authentication:** Required (Admin/Moderator only)

**Response:** Returns the updated blog post with `active: false`

---

## Data Models

### BlogPost

```typescript
{
  id: string;
  author: string;
  writingDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations: BlogPostTranslation[];
  images: BlogImage[];
  links: BlogLink[];
}
```

### BlogPostTranslation

```typescript
{
  id: string;
  blogPostId: string;
  language: string; // "de" | "en" | "fr" | "it"
  title: string;
  htmlContent: string;
}
```

### BlogImage

```typescript
{
  id: string;
  url: string;
  altText?: string;
  blogPostId: string;
  createdAt: Date;
}
```

### BlogLink

```typescript
{
  id: string;
  url: string;
  title: string;
  blogPostId: string;
  createdAt: Date;
}
```

## Usage Examples

### Creating a Multi-Language Blog Post Workflow

1. **Upload images first:**

```bash
curl -X POST http://localhost:3000/blog/upload-images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

2. **Create blog post with translations in multiple languages:**

```bash
curl -X POST http://localhost:3000/blog \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "John Doe",
    "writingDate": "2025-11-06T10:00:00Z",
    "active": false,
    "translations": [
      {
        "language": "en",
        "title": "My First Blog",
        "htmlContent": "<p>Content in English</p>"
      },
      {
        "language": "de",
        "title": "Mein erster Blog",
        "htmlContent": "<p>Inhalt auf Deutsch</p>"
      },
      {
        "language": "fr",
        "title": "Mon premier blog",
        "htmlContent": "<p>Contenu en français</p>"
      },
      {
        "language": "it",
        "title": "Il mio primo blog",
        "htmlContent": "<p>Contenuto in italiano</p>"
      }
    ],
    "images": [{"url": "https://...", "altText": "Image"}]
  }'
```

3. **Activate when ready:**

```bash
curl -X PATCH http://localhost:3000/blog/{id}/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Get blogs in a specific language:**

```bash
# Get all active German blogs
curl http://localhost:3000/blog?activeOnly=true&language=de

# Get a specific blog in French
curl http://localhost:3000/blog/{id}?language=fr
```

## Notes

- Blog posts support 4 languages: German (de), English (en), French (fr), Italian (it)
- You can provide translations for any combination of languages (not all 4 are required)
- Blog posts are sorted by `writingDate` in descending order by default
- Translations, images, and links are cascade deleted when a blog post is deleted
- Only Admin and Moderator roles can create, update, delete, activate, or deactivate blog posts
- Public users can view active blog posts without authentication
- The `htmlContent` field supports full HTML formatting
- Use the `language` query parameter to filter results by a specific language
