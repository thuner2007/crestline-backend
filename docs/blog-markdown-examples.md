# Blog API - Markdown Examples

## Overview

The blog API now supports Markdown content instead of HTML. You can write blog posts in Markdown format and embed images directly within your text using standard Markdown image syntax.

## Uploading Images

Before creating a blog post with embedded images, you need to upload the images first:

```http
POST http://localhost:3000/blog/upload-images
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
Authorization: Bearer YOUR_AUTH_TOKEN

------WebKitFormBoundary
Content-Disposition: form-data; name="images"; filename="image1.jpg"
Content-Type: image/jpeg

< ./path/to/image1.jpg
------WebKitFormBoundary--
```

Response:

```json
{
  "imageUrls": ["https://your-minio-url.com/blog/image1.jpg"]
}
```

## Creating a Blog Post with Markdown

### Example 1: Simple Blog Post with Embedded Images

````http
POST http://localhost:3000/blog
Content-Type: application/json
Authorization: Bearer YOUR_AUTH_TOKEN

{
  "author": "John Doe",
  "writingDate": "2025-11-09T10:00:00.000Z",
  "active": false,
  "translations": [
    {
      "language": "en",
      "title": "Getting Started with RevSticks",
      "markdownContent": "# Welcome to RevSticks\n\nWe're excited to introduce our new product line!\n\n## What's New\n\n![Product Image](https://your-minio-url.com/blog/product1.jpg)\n\n### Features\n\n- **High Quality**: Made with premium materials\n- **Customizable**: Choose your own design\n- **Durable**: Built to last\n\n### How It Works\n\nHere's a step-by-step guide:\n\n1. Choose your base model\n2. Select your colors\n3. Add custom graphics\n4. Place your order\n\n![Process Diagram](https://your-minio-url.com/blog/process.jpg)\n\n### Pricing\n\nOur products start at **$99.99**. Check out our [pricing page](https://example.com/pricing) for more details.\n\n> \"Best sticks I've ever used!\" - Happy Customer\n\n#### Code Example\n\nIf you're integrating with our API:\n\n```javascript\nconst response = await fetch('/api/products');\nconst products = await response.json();\n```\n\n---\n\nVisit our [website](https://revsticks.com) for more information!"
    },
    {
      "language": "de",
      "title": "Erste Schritte mit RevSticks",
      "markdownContent": "# Willkommen bei RevSticks\n\nWir freuen uns, unsere neue Produktlinie vorzustellen!\n\n## Was ist neu\n\n![Produktbild](https://your-minio-url.com/blog/product1.jpg)\n\n### Eigenschaften\n\n- **Hohe Qualität**: Aus hochwertigen Materialien\n- **Anpassbar**: Wählen Sie Ihr eigenes Design\n- **Langlebig**: Gebaut für die Ewigkeit\n\n### Wie es funktioniert\n\n1. Wählen Sie Ihr Basismodell\n2. Wählen Sie Ihre Farben\n3. Fügen Sie benutzerdefinierte Grafiken hinzu\n4. Geben Sie Ihre Bestellung auf\n\n![Prozessdiagramm](https://your-minio-url.com/blog/process.jpg)\n\n> \"Die besten Sticks, die ich je benutzt habe!\" - Zufriedener Kunde"
    }
  ],
  "links": [
    {
      "url": "https://revsticks.com/pricing",
      "title": "Pricing Information"
    }
  ]
}
````

### Example 2: Blog Post with Multiple Images in Gallery Style

```http
POST http://localhost:3000/blog
Content-Type: application/json
Authorization: Bearer YOUR_AUTH_TOKEN

{
  "author": "Jane Smith",
  "writingDate": "2025-11-09T14:00:00.000Z",
  "active": true,
  "translations": [
    {
      "language": "en",
      "title": "Customer Showcase: Amazing Designs",
      "markdownContent": "# Customer Showcase\n\nCheck out these incredible custom designs from our community!\n\n## Featured Designs\n\n### Design #1: Sunset Theme\n\n![Sunset Design](https://your-minio-url.com/blog/design1.jpg)\n\nThis beautiful sunset theme features vibrant orange and purple gradients.\n\n### Design #2: Minimalist Black\n\n![Minimalist Design](https://your-minio-url.com/blog/design2.jpg)\n\nSometimes less is more. This sleek black design is perfect for professionals.\n\n### Design #3: Neon Explosion\n\n![Neon Design](https://your-minio-url.com/blog/design3.jpg)\n\nFor those who want to stand out, this neon design is sure to turn heads!\n\n## How to Submit Your Design\n\nWant to be featured? Follow these steps:\n\n1. Take a high-quality photo of your RevStick\n2. Email it to submissions@revsticks.com\n3. Include a brief description\n4. Wait for our team to review\n\n*Selected submissions receive a 20% discount on their next order!*\n\n---\n\n**Note**: All images should be in JPG or PNG format, minimum 1200x800 pixels."
    }
  ],
  "images": [
    {
      "url": "https://your-minio-url.com/blog/design1.jpg",
      "altText": "Sunset themed RevStick design"
    },
    {
      "url": "https://your-minio-url.com/blog/design2.jpg",
      "altText": "Minimalist black RevStick design"
    },
    {
      "url": "https://your-minio-url.com/blog/design3.jpg",
      "altText": "Neon explosion RevStick design"
    }
  ]
}
```

## Markdown Syntax Reference

### Headings

```markdown
# H1 Heading

## H2 Heading

### H3 Heading

#### H4 Heading
```

### Emphasis

```markdown
_italic_ or _italic_
**bold** or **bold**
**_bold italic_** or **_bold italic_**
~~strikethrough~~
```

### Lists

```markdown
- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2
   1. Nested ordered item
```

### Links

```markdown
[Link text](https://example.com)
[Link with title](https://example.com 'Title')
```

### Images

```markdown
![Alt text](https://example.com/image.jpg)
![Alt text](https://example.com/image.jpg 'Image title')
```

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

### Code

````markdown
Inline `code`

```javascript
// Code block
const example = 'code';
```
````

````

### Horizontal Rule
```markdown
---
or
***
or
___
````

### Tables

```markdown
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

## Retrieving Blog Posts

### Get All Posts (Public)

```http
GET http://localhost:3000/blog
```

### Get All Active Posts Only (Public)

```http
GET http://localhost:3000/blog?activeOnly=true
```

### Get Posts in Specific Language (Public)

```http
GET http://localhost:3000/blog?language=en
```

### Get Active Posts in Specific Language (Public)

```http
GET http://localhost:3000/blog?activeOnly=true&language=de
```

### Get Single Post (Public)

```http
GET http://localhost:3000/blog/{id}
```

### Get Single Post in Specific Language (Public)

```http
GET http://localhost:3000/blog/{id}?language=fr
```

## Updating a Blog Post

```http
PATCH http://localhost:3000/blog/{id}
Content-Type: application/json
Authorization: Bearer YOUR_AUTH_TOKEN

{
  "translations": [
    {
      "language": "en",
      "title": "Updated Title",
      "markdownContent": "# Updated Content\n\nThis is the updated markdown content with ![new image](https://your-minio-url.com/blog/new-image.jpg)"
    }
  ]
}
```

## Activating/Deactivating Posts

### Activate a Post

```http
PATCH http://localhost:3000/blog/{id}/activate
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Deactivate a Post

```http
PATCH http://localhost:3000/blog/{id}/deactivate
Authorization: Bearer YOUR_AUTH_TOKEN
```

## Deleting a Blog Post

```http
DELETE http://localhost:3000/blog/{id}
Authorization: Bearer YOUR_AUTH_TOKEN
```

## Best Practices

1. **Upload images first**: Always upload images using the `/blog/upload-images` endpoint before creating/updating a blog post
2. **Use descriptive alt text**: When adding images to the `images` array, provide meaningful alt text for accessibility
3. **Embed images in content**: Use the returned image URLs in your markdown content with `![alt text](url)` syntax
4. **Start inactive**: Create posts with `"active": false` and activate them only when ready to publish
5. **Multi-language support**: Always provide translations for all supported languages (de, en, fr, it) for better user experience
6. **Test markdown locally**: Test your markdown rendering locally before submitting to ensure it displays correctly

## Example Workflow

1. **Prepare images**: Upload all images you want to use

   ```
   POST /blog/upload-images
   ```

2. **Create draft**: Create blog post with `active: false`

   ```
   POST /blog
   ```

3. **Review**: Check the blog post in your frontend

4. **Publish**: Activate the blog post when ready

   ```
   PATCH /blog/{id}/activate
   ```

5. **Update**: Make changes as needed
   ```
   PATCH /blog/{id}
   ```
