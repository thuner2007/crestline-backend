# Push Notification Debugging Guide

## Current Issue: 401 Unauthorized Error

You're getting a **401 Unauthorized** error when trying to subscribe to push notifications. This means the authentication is failing.

## Enhanced Logging

I've added comprehensive logging to all notification endpoints. Here's what to look for:

### Subscribe Endpoint Logs

When you try to subscribe, check your backend logs for:

```
=== SUBSCRIBE REQUEST START ===
Method: POST /notifications/subscribe
Headers: {...}
User object: {...}
Body: {...}
User details - ID: ..., Role: ..., Email: ...
```

#### If Authentication Fails:

```
❌ Subscribe attempt without authenticated user
Request has user object: false/true
Request headers: {...}
Authorization header: MISSING or Bearer xxx...
```

#### If Authentication Succeeds:

```
✓ User authenticated: <userId>
✓ Subscription data valid
Subscription endpoint: ...
✅ Successfully subscribed user <userId>
=== SUBSCRIBE REQUEST END (SUCCESS) ===
```

## Common Issues & Solutions

### Issue 1: No Authorization Header

**What to check in logs:**

```
Authorization header: MISSING
```

**Solution in Frontend:**
Make sure you're sending the JWT token in the request:

```typescript
const response = await fetch(`${backendUrl}/notifications/subscribe`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${yourJwtToken}`, // ← Make sure this is included!
  },
  body: JSON.stringify(subscription),
});
```

### Issue 2: Invalid or Expired Token

**What to check in logs:**

```
Request has user object: false
Authorization header: Bearer eyJhbGc...
```

**Solution:**

1. Check if the token is expired
2. Try logging in again to get a fresh token
3. Verify the token is valid by checking `/auth/profile` or similar endpoint

### Issue 3: Token Not Being Parsed

**What to check in logs:**

```
User object: undefined
```

**Solution:**

1. Make sure your JWT auth guard is properly configured
2. Check if the token format is correct: `Bearer <token>`
3. Verify the JWT secret matches between token creation and validation

### Issue 4: Wrong User Role

**What to check in logs:**

```
User details - ID: xxx, Role: user, Email: ...
```

**Note:** Currently the controller has `@Public()` decorator, so it should work for any authenticated user. But if you need admin-only access, you need to remove `@Public()` and add `@Roles(UserRole.ADMIN)` to each endpoint.

## How to Debug Your Current Issue

### Step 1: Check Backend Logs

Start your backend with:

```bash
npm run start:dev
```

Watch the console output carefully.

### Step 2: Try to Subscribe from Frontend

When you click subscribe, immediately check the backend logs. You should see:

```
=== SUBSCRIBE REQUEST START ===
```

### Step 3: Identify the Problem

Look for the first `❌` (red X) in the logs. This tells you exactly what failed:

- `❌ Subscribe attempt without authenticated user` → No valid JWT token
- `❌ Invalid subscription data received` → Problem with the request body
- `❌ Failed to subscribe` → Database or service error

### Step 4: Check Request Headers

The logs will show you the full request headers. Look for:

```
Headers: {
  "authorization": "Bearer eyJhbGc...",  // ← Should be present
  "content-type": "application/json",
  ...
}
```

## Testing Authentication

### Test 1: Check if you can get the VAPID key

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/notifications/vapid-public-key
```

Expected response:

```json
{
  "publicKey": "BHZXaoWF..."
}
```

If this fails with 401, your token is invalid.

### Test 2: Try the test notification endpoint

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:4000/notifications/test
```

This will tell you if authentication is working.

## Frontend Checklist

Make sure your frontend code includes:

```typescript
// 1. Get the JWT token (from login, localStorage, context, etc.)
const token = localStorage.getItem('token'); // or however you store it

// 2. Include it in ALL notification requests
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
};

// 3. Check if token exists before making request
if (!token) {
  console.error('No authentication token found!');
  return;
}

// 4. Use the token in your request
const response = await fetch(`${API_URL}/notifications/subscribe`, {
  method: 'POST',
  headers,
  body: JSON.stringify(subscription),
});
```

## Next Steps

1. **Try subscribing again** and copy the backend logs
2. **Look for the `=== SUBSCRIBE REQUEST START ===` line**
3. **Check what the logs say about the User object and Authorization header**
4. **Share the logs** if you need more help

The enhanced logging will tell you exactly where the authentication is failing!
