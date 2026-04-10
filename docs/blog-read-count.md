# Blog Read Count Feature

## Overview

This feature tracks how many times each blog post has been read by incrementing a counter each time a blog post is accessed.

## Database Changes

- Added `readCount` field to `blog_post` table (integer, default: 0)

## API Endpoints

### Increment Read Count

**Endpoint:** `PATCH /blog/:id/read`  
**Access:** Public  
**Description:** Increments the read count for a specific blog post by 1.

**Example Request:**

```http
PATCH http://localhost:3000/blog/YOUR_BLOG_ID/read
```

**Example Response:**

```json
{
  "id": "blog-uuid",
  "author": "John Doe",
  "writingDate": "2025-11-11T00:00:00.000Z",
  "active": true,
  "readCount": 5,
  "createdAt": "2025-11-11T09:30:00.000Z",
  "updatedAt": "2025-11-11T09:35:00.000Z",
  "translations": [...],
  "images": [...],
  "links": [...]
}
```

## Usage

### Frontend Integration

When a user views a blog post, call the increment endpoint:

```javascript
// When blog post is loaded/viewed
async function trackBlogRead(blogId) {
  try {
    await fetch(`/blog/${blogId}/read`, {
      method: 'PATCH',
    });
  } catch (error) {
    console.error('Failed to track blog read:', error);
    // Don't interrupt user experience if tracking fails
  }
}
```

### Retrieving Read Count

The `readCount` field is automatically included when fetching blog posts:

```javascript
// Get single blog post (includes readCount)
GET /blog/:id

// Get all blog posts (includes readCount for each)
GET /blog
```

## Implementation Details

### Service Method

```typescript
async incrementReadCount(id: string) {
  await this.findOne(id); // Verify blog exists
  return this.prisma.blog_post.update({
    where: { id },
    data: {
      readCount: { increment: 1 }
    },
    include: { translations, images, links }
  });
}
```

### Controller Method

```typescript
@Patch(':id/read')
@Public()
incrementReadCount(@Param('id') id: string) {
  return this.blogService.incrementReadCount(id);
}
```

## Notes

- The endpoint is public (no authentication required)
- Each call increments the counter by 1
- The counter starts at 0 for new blog posts
- Read count persists across server restarts (stored in database)
- Consider implementing client-side debouncing to avoid multiple increments from the same user
- For more accurate tracking, consider implementing IP-based or session-based tracking in the future
