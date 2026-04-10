# Migration Steps for Blog Link Translations

## What Changed

Blog links now support translations, allowing different URLs and titles for each language.

### Schema Changes

- **Old structure**: Each `blog_link` had one `url` and one `title`
- **New structure**: Each `blog_link` has multiple `blog_link_translation` entries with language-specific URLs and titles

### Files Modified

1. **`prisma/schema.prisma`**

   - Updated `blog_link` model to remove `url` and `title` fields
   - Added new `blog_link_translation` model with `language`, `url`, and `title` fields

2. **`src/blog/dto/blog.dto.ts`**

   - Added `BlogLinkTranslationDto` class for link translation data
   - Updated `BlogLinkDto` to contain an array of translations instead of direct url/title

3. **`src/blog/blog.service.ts`**
   - Updated all methods to handle nested link translations
   - Added translation filtering for links based on language parameter

## Steps to Apply Changes

### 1. Generate Prisma Client (Already Done ✓)

```bash
npx prisma generate
```

### 2. Create and Apply Migration

**For Development (with database reset if needed):**

```bash
# Option A: Create and apply migration
npx prisma migrate dev --name add_link_translations

# Option B: If you have drift, you may need to reset first
npx prisma migrate reset
npm run seed:all  # Re-seed your data
```

**For Production:**

```bash
npx prisma migrate deploy
```

### 3. Update Existing Data (if any)

If you already have blog posts with links in your database, you'll need to migrate the data:

```sql
-- Example migration query to convert existing links to the new structure
-- This is a manual step you'll need to run if you have existing data

-- For each existing link, create translations for all languages
INSERT INTO blog_link_translation (id, "blogLinkId", language, url, title)
SELECT
  gen_random_uuid(),
  bl.id,
  lang.code,
  bl.url,
  bl.title
FROM blog_link bl
CROSS JOIN (
  VALUES ('de'), ('en'), ('fr'), ('it')
) AS lang(code)
WHERE NOT EXISTS (
  SELECT 1 FROM blog_link_translation
  WHERE "blogLinkId" = bl.id
);
```

**Note:** After the migration, the old `url` and `title` columns will be removed from `blog_link`.

### 4. Update Frontend/Client Code

If you have a frontend consuming this API, update it to:

1. Send links with translations array:

   ```javascript
   links: [
     {
       translations: [
         { language: 'de', url: '...', title: '...' },
         { language: 'en', url: '...', title: '...' },
       ],
     },
   ];
   ```

2. Handle the new response structure where links have nested translations

### 5. Update Seeds (if applicable)

Update `prisma/seeds/blog.seed.ts` to use the new structure:

```typescript
links: {
  create: [
    {
      translations: {
        create: [
          { language: 'de', url: '...', title: '...' },
          { language: 'en', url: '...', title: '...' },
        ],
      },
    },
  ];
}
```

## Testing

1. **Create a new blog post** with translated links
2. **Get all blog posts** without language filter - should return all translations
3. **Get blog posts with language filter** (`?language=de`) - should return only German translations
4. **Update a blog post** with new link translations
5. **Verify cascade delete** - deleting a blog post should delete all links and their translations

## Example API Requests

See the following files for complete examples:

- `docs/blog-link-translations-example.json` - Full request body example
- `docs/blog-link-translations.md` - Complete API documentation

## Rollback (if needed)

If you need to rollback:

```bash
# Revert the schema changes in prisma/schema.prisma
git checkout HEAD -- prisma/schema.prisma src/blog/

# Reset to previous migration
npx prisma migrate reset

# Re-apply old migrations
npx prisma migrate deploy
```
