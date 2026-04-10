# Push Notifications - Quick Setup Guide

## ✅ What's Been Done

I've implemented a complete push notification system for your RevSticks backend that will send notifications to your iPhone when new orders are received.

### Backend Changes:

1. **New Notification Module** (`src/notifications/`)

   - `notification.service.ts` - Core service for managing push subscriptions and sending notifications
   - `notification.controller.ts` - API endpoints for subscription management
   - `notification.module.ts` - Module configuration
   - `dto/notification.dto.ts` - Data transfer objects

2. **Database Schema** (`prisma/schema.prisma`)

   - Added `push_subscription` table to store device subscriptions
   - Migration applied successfully with `prisma db push`

3. **Order Service Integration** (`src/orders/order.service.ts`)

   - Added `NotificationService` to constructor
   - Sends push notification to all admin users when a new order is created
   - Notification includes order details: customer name, total price, order ID

4. **Configuration Files**

   - Updated `env.example` with VAPID key placeholders
   - Created VAPID key generation script (`scripts/generate-vapid-keys.js`)

5. **Documentation**
   - Complete setup guide in `docs/push-notifications-setup.md`

### New API Endpoints:

- **GET** `/notifications/vapid-public-key` - Get public key for frontend (public)
- **POST** `/notifications/subscribe` - Subscribe to notifications (requires auth)
- **DELETE** `/notifications/unsubscribe` - Unsubscribe from notifications
- **POST** `/notifications/test` - Test notification (admin only)

## 🚀 Next Steps (What YOU Need to Do)

### 1. Add VAPID Keys to Your .env File

I generated VAPID keys for you. Add these to your `.env` file:

```env
VAPID_PUBLIC_KEY=BHZXaoWFvhudsv-CxIMufYK3Ap0RfVWYOEIu5ZG-QfTTolFcXFYmBHo6PwmtR8P7-kSlJ97s4vl8EAaTndzAFdI
VAPID_PRIVATE_KEY=KctPik9Uo9JxilWDBJyEMMMXjnFhijOc3L5MutcYuZI
VAPID_SUBJECT=mailto:your-email@revsticks.com
```

⚠️ **Important**: Change `VAPID_SUBJECT` to your actual email!

### 2. Restart Your Backend

```bash
npm run start:dev
```

### 3. Create a Frontend Subscription Page

You need to create a simple HTML page (or add to your existing frontend) that:

- Requests notification permission
- Subscribes to push notifications
- Sends the subscription to your backend

See the complete example in `docs/push-notifications-setup.md`

**Key files you need to create:**

- `push-subscribe.html` - Subscription interface
- `sw.js` - Service worker to handle notifications

### 4. Subscribe on Your iPhone

1. Open the subscription page in Safari on your iPhone
2. Log in and get your auth token
3. Update the `API_URL` and `AUTH_TOKEN` in the HTML
4. Tap "Enable Notifications"
5. **Important**: Add to home screen (Share → Add to Home Screen)
6. Open from home screen icon (not Safari)

### 5. Test It!

1. Use the "Send Test Notification" button to verify setup
2. Create a test order - you should receive a notification!

## 📱 How It Works

When someone places an order:

1. Order is created in `order.service.ts`
2. System finds all admin users
3. Gets their push subscriptions from database
4. Sends notification to each device
5. You see: "🛒 New Order Received! Order from [Name] - CHF[Price]"

## 🔧 Troubleshooting

**No notifications on iPhone?**

- Did you add the page to home screen?
- Are you opening from the home screen icon?
- Check notification permissions in iOS Settings
- Verify VAPID keys are in .env

**Backend errors?**

- Check logs: `npm run start:dev`
- Verify database migration: `npx prisma db push`
- Ensure NotificationModule is imported in AppModule ✅ (already done)

## 📄 Files Created/Modified

### New Files:

- `src/notifications/notification.service.ts`
- `src/notifications/notification.controller.ts`
- `src/notifications/notification.module.ts`
- `src/notifications/dto/notification.dto.ts`
- `scripts/generate-vapid-keys.js`
- `docs/push-notifications-setup.md`
- `docs/PUSH_NOTIFICATIONS_SUMMARY.md` (this file)

### Modified Files:

- `prisma/schema.prisma` (added push_subscription table)
- `src/orders/order.service.ts` (added notification sending)
- `src/orders/order.module.ts` (imported NotificationModule)
- `src/app.module.ts` (imported NotificationModule)
- `env.example` (added VAPID keys)
- `package.json` (added web-push dependency)

## 🎯 Summary

The backend is **100% ready**! Just add the VAPID keys to your `.env` file and create the frontend subscription page. Once you subscribe from your iPhone, you'll automatically receive push notifications whenever a new order comes in.

For detailed setup instructions, see: `docs/push-notifications-setup.md`
