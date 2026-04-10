# Blog API Quick Reference - Multi-Language

## 📝 Create Blog Post (All 4 Languages)

```json
POST /blog
Authorization: Bearer YOUR_TOKEN

{
  "author": "Your Name",
  "writingDate": "2025-11-06T10:00:00Z",
  "active": false,
  "translations": [
    {
      "language": "en",
      "title": "English Title",
      "htmlContent": "<h1>English Content</h1>"
    },
    {
      "language": "de",
      "title": "Deutscher Titel",
      "htmlContent": "<h1>Deutscher Inhalt</h1>"
    },
    {
      "language": "fr",
      "title": "Titre français",
      "htmlContent": "<h1>Contenu français</h1>"
    },
    {
      "language": "it",
      "title": "Titolo italiano",
      "htmlContent": "<h1>Contenuto italiano</h1>"
    }
  ]
}
```

## 🔍 Get Blogs by Language

| Endpoint                                | Description                 |
| --------------------------------------- | --------------------------- |
| `GET /blog`                             | All blogs, all languages    |
| `GET /blog?activeOnly=true`             | Active blogs, all languages |
| `GET /blog?language=de`                 | All German blogs            |
| `GET /blog?language=en&activeOnly=true` | Active English blogs        |
| `GET /blog/:id`                         | Single blog, all languages  |
| `GET /blog/:id?language=fr`             | Single blog, French only    |

## 🌍 Supported Languages

| Code | Language           |
| ---- | ------------------ |
| `de` | German (Deutsch)   |
| `en` | English            |
| `fr` | French (Français)  |
| `it` | Italian (Italiano) |

## ✏️ Update Blog (Partial Update)

```json
PATCH /blog/:id
Authorization: Bearer YOUR_TOKEN

{
  "active": true,
  "translations": [
    {
      "language": "en",
      "title": "Updated English Title",
      "htmlContent": "<p>Updated English content</p>"
    },
    {
      "language": "de",
      "title": "Aktualisierter deutscher Titel",
      "htmlContent": "<p>Aktualisierter deutscher Inhalt</p>"
    }
  ]
}
```

## 🎬 Quick Actions

| Action          | Endpoint               | Method |
| --------------- | ---------------------- | ------ |
| Upload Images   | `/blog/upload-images`  | POST   |
| Create Blog     | `/blog`                | POST   |
| Get All Blogs   | `/blog`                | GET    |
| Get Single Blog | `/blog/:id`            | GET    |
| Update Blog     | `/blog/:id`            | PATCH  |
| Delete Blog     | `/blog/:id`            | DELETE |
| Activate Blog   | `/blog/:id/activate`   | PATCH  |
| Deactivate Blog | `/blog/:id/deactivate` | PATCH  |

## 🔐 Authentication

- **Public:** GET endpoints (view blogs)
- **Protected:** POST, PATCH, DELETE (Admin/Moderator only)

## 💡 Tips

1. **Not all languages required** - You can create a blog with just 1 language
2. **Cascade delete** - Deleting a blog removes all translations
3. **Replace on update** - When updating translations, provide all you want to keep
4. **Filter for performance** - Use `?language=xx` to reduce payload size
5. **Images & links** - Work the same way, attached to the blog post (not per language)

## 📊 Response Structure

```json
{
  "id": "uuid",
  "author": "Name",
  "writingDate": "2025-11-06T10:00:00Z",
  "active": true,
  "createdAt": "2025-11-06T10:00:00Z",
  "updatedAt": "2025-11-06T10:00:00Z",
  "translations": [
    {
      "id": "uuid",
      "language": "en",
      "title": "Title",
      "htmlContent": "<p>Content</p>",
      "blogPostId": "uuid"
    }
  ],
  "images": [...],
  "links": [...]
}
```
