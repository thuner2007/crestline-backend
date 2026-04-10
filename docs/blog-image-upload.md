# Blog Image Upload API

## Upload Single Image

Upload a single image to the public MinIO bucket "blog" and get the public URL.

### Endpoint

```
POST /blog/upload-image
```

### Authentication

Requires authentication with ADMIN or MODERATOR role.

### Request

**Content-Type:** `multipart/form-data`

**Form Data:**

- `image`: The image file to upload

### Example using cURL

```bash
curl -X POST http://localhost:3000/blog/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

### Example using JavaScript Fetch

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/blog/upload-image', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const data = await response.json();
console.log('Image URL:', data.imageUrl);
```

### Response

**Success (200):**

```json
{
  "imageUrl": "http://your-minio-endpoint:9000/blog/1699632000000-abc123.jpg"
}
```

**Error (400):**

```json
{
  "statusCode": 400,
  "message": "Image file is required"
}
```

**Error (401):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Error (403):**

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

## Implementation Details

- The image is uploaded to the MinIO bucket named `blog`
- The bucket is automatically created if it doesn't exist
- The bucket is set to **public read** access, meaning anyone can access the images via their URL
- The filename is sanitized and includes a timestamp and random string to ensure uniqueness
- The returned URL is the full public URL that can be used directly in `<img>` tags or markdown
