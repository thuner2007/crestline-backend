# Blog System Update - Markdown Support

## Summary of Changes

The blog system has been updated to support **Markdown** instead of HTML content. This allows for easier content creation and the ability to embed images directly within the text using standard Markdown syntax.

## What Changed

### 1. Database Schema

- Changed `htmlContent` field to `markdownContent` in `blog_post_translation` table
- Migration: `20251109202552_change_html_to_markdown`

### 2. API Changes

- **DTOs Updated**: `BlogTranslationDto` now uses `markdownContent` instead of `htmlContent`
- **Service Layer**: Updated to handle markdown content
- **Controller**: No breaking changes - same endpoints

### 3. Dependencies Added

- `marked` - Markdown parser (if you need to convert markdown to HTML in the frontend/backend)
- `@types/marked` - TypeScript definitions

## How to Use

### Writing Blog Posts

Instead of HTML:

```json
{
  "htmlContent": "<h1>Title</h1><p>Content</p>"
}
```

Now use Markdown:

```json
{
  "markdownContent": "# Title\n\nContent"
}
```

### Embedding Images

1. **Upload images first** using the upload endpoint
2. **Use the returned URLs** in your markdown:

```markdown
![Alt text](https://your-minio-url.com/blog/image.jpg)
```

### Example

```json
{
  "author": "John Doe",
  "writingDate": "2025-11-09T10:00:00.000Z",
  "active": false,
  "translations": [
    {
      "language": "en",
      "title": "My Blog Post",
      "markdownContent": "# Welcome\n\nThis is my blog post.\n\n![Hero Image](https://url.com/image.jpg)\n\n## Features\n\n- Easy to write\n- Images embedded\n- **Bold** and *italic* text"
    }
  ]
}
```

## Markdown Features Supported

- **Headings**: `# H1`, `## H2`, `### H3`, etc.
- **Emphasis**: `*italic*`, `**bold**`, `***bold italic***`
- **Lists**: Ordered and unordered
- **Links**: `[text](url)`
- **Images**: `![alt](url)`
- **Code**: Inline and blocks with syntax highlighting
- **Blockquotes**: `> quote`
- **Tables**: Full table support
- **Horizontal rules**: `---`

## Migration Notes

### For Existing Data

If you have existing blog posts with HTML content, you'll need to:

1. **Backup your data** before the migration
2. **Convert HTML to Markdown** using a tool like:

   - [Turndown](https://github.com/mixmark-io/turndown) (JavaScript)
   - [html2text](https://pypi.org/project/html2text/) (Python)
   - Online converters: https://www.browserling.com/tools/html-to-markdown

3. **Update your posts** with the new markdown content

### Example Conversion

**Before (HTML):**

```html
<h1>Title</h1>
<p>This is <strong>bold</strong> text.</p>
<img src="url.jpg" alt="image" />
```

**After (Markdown):**

```markdown
# Title

This is **bold** text.

![image](url.jpg)
```

## Frontend Integration

### Option 1: Render Markdown Client-Side

Use a library like:

- [marked](https://marked.js.org/) - JavaScript
- [react-markdown](https://github.com/remarkjs/react-markdown) - React
- [markdown-it](https://github.com/markdown-it/markdown-it) - JavaScript

Example with React:

```jsx
import ReactMarkdown from 'react-markdown';

function BlogPost({ post }) {
  return (
    <div>
      <h1>{post.translations[0].title}</h1>
      <ReactMarkdown>{post.translations[0].markdownContent}</ReactMarkdown>
    </div>
  );
}
```

### Option 2: Convert Server-Side (Optional)

If you want to convert markdown to HTML on the backend, you can add an endpoint:

```typescript
// blog.service.ts
import { marked } from 'marked';

async findOneAsHtml(id: string, language?: string) {
  const blog = await this.findOne(id, language);

  return {
    ...blog,
    translations: blog.translations.map(trans => ({
      ...trans,
      htmlContent: marked(trans.markdownContent)
    }))
  };
}
```

## Testing

### 1. Upload an Image

```bash
curl -X POST http://localhost:3000/blog/upload-images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@./image.jpg"
```

### 2. Create a Blog Post

```bash
curl -X POST http://localhost:3000/blog \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "Test Author",
    "writingDate": "2025-11-09T10:00:00.000Z",
    "translations": [{
      "language": "en",
      "title": "Test Post",
      "markdownContent": "# Test\n\n![Image](https://url.com/image.jpg)"
    }]
  }'
```

### 3. Retrieve the Blog Post

```bash
curl http://localhost:3000/blog?language=en
```

## Documentation

- **Full Examples**: See `docs/blog-markdown-examples.md`
- **HTTP Requests**: See `docs/blog-markdown-examples.http`
- **Markdown Syntax**: Included in the examples file

## Benefits of Markdown

1. **Easier to Write**: No HTML tags to worry about
2. **More Readable**: Plain text is easier to edit
3. **Portable**: Markdown is a standard format
4. **Images in Text**: Embed images anywhere in your content
5. **Better Version Control**: Easier to see changes in git diffs
6. **Less Error-Prone**: No unclosed tags or malformed HTML

## Troubleshooting

### Issue: Images not showing

- Verify the image URL is correct and accessible
- Check that images were uploaded successfully
- Ensure proper Markdown syntax: `![alt](url)`

### Issue: Markdown not rendering

- Check your frontend markdown parser is installed
- Verify the markdown syntax is correct
- Test markdown in an online editor first

### Issue: Migration failed

- Backup your database first
- Check for database drift with `prisma migrate status`
- Contact dev team if issues persist

## Support

For questions or issues:

1. Check the example files in `docs/`
2. Review the Markdown syntax guide
3. Test with the provided HTTP examples
4. Contact the development team
