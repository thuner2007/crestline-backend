# Push Notifications Setup

This guide will help you set up push notifications for your RevSticks backend to receive notifications on your iPhone when new orders are placed.

## Backend Setup

### 1. Generate VAPID Keys

VAPID keys are required for Web Push notifications. Run the following command:

```bash
node scripts/generate-vapid-keys.js
```

This will generate a public and private key pair. Add them to your `.env` file:

```env
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_SUBJECT=mailto:your-email@revsticks.com
```

### 2. Database Migration

The database schema has already been updated with the `push_subscription` table. If you need to run migrations manually:

```bash
npx prisma migrate dev
```

### 3. API Endpoints

The following endpoints are now available:

- **GET** `/notifications/vapid-public-key` - Get the public VAPID key (public endpoint)
- **POST** `/notifications/subscribe` - Subscribe to push notifications (requires authentication)
- **DELETE** `/notifications/unsubscribe` - Unsubscribe from push notifications
- **POST** `/notifications/test` - Send a test notification (admin only)

## Frontend Setup (iOS/Safari)

To receive push notifications on your iPhone, you'll need to create a simple web app that:

1. Requests notification permission
2. Subscribes to push notifications using the VAPID public key
3. Sends the subscription to the backend

### Example Frontend Code

Create an HTML file (e.g., `push-subscribe.html`):

```html
<!DOCTYPE html>
<html>
  <head>
    <title>RevSticks Push Notifications</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
      }
      button {
        background: #007bff;
        color: white;
        border: none;
        padding: 15px 30px;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
        margin: 10px 0;
      }
      button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      .status {
        padding: 15px;
        margin: 15px 0;
        border-radius: 5px;
      }
      .success {
        background: #d4edda;
        color: #155724;
      }
      .error {
        background: #f8d7da;
        color: #721c24;
      }
      .info {
        background: #d1ecf1;
        color: #0c5460;
      }
    </style>
  </head>
  <body>
    <h1>🔔 RevSticks Push Notifications</h1>
    <p>Subscribe to receive notifications when new orders are placed.</p>

    <div id="status"></div>

    <button id="subscribeBtn" onclick="subscribeToPush()">
      Enable Notifications
    </button>

    <button
      id="unsubscribeBtn"
      onclick="unsubscribeFromPush()"
      style="display:none; background: #dc3545;"
    >
      Disable Notifications
    </button>

    <button
      id="testBtn"
      onclick="testNotification()"
      style="display:none; background: #28a745;"
    >
      Send Test Notification
    </button>

    <script>
      // Configuration
      const API_URL = 'https://your-backend-url.com'; // Change this to your backend URL
      const AUTH_TOKEN = 'your_auth_token_here'; // Get this from your login

      // Convert VAPID key from base64 to Uint8Array
      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      function showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
      }

      async function subscribeToPush() {
        try {
          // Check if service worker is supported
          if (!('serviceWorker' in navigator)) {
            throw new Error('Service workers are not supported');
          }

          // Check if push notifications are supported
          if (!('PushManager' in window)) {
            throw new Error('Push notifications are not supported');
          }

          // Request notification permission
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            throw new Error('Notification permission denied');
          }

          // Register service worker
          const registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;

          // Get VAPID public key from backend
          const response = await fetch(
            `${API_URL}/notifications/vapid-public-key`,
          );
          const { publicKey } = await response.json();

          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });

          // Send subscription to backend
          const subscribeResponse = await fetch(
            `${API_URL}/notifications/subscribe`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${AUTH_TOKEN}`,
              },
              body: JSON.stringify(subscription),
            },
          );

          if (!subscribeResponse.ok) {
            throw new Error('Failed to subscribe on backend');
          }

          showStatus('✅ Successfully subscribed to notifications!', 'success');
          document.getElementById('subscribeBtn').style.display = 'none';
          document.getElementById('unsubscribeBtn').style.display = 'block';
          document.getElementById('testBtn').style.display = 'block';

          // Save subscription to localStorage
          localStorage.setItem(
            'pushSubscription',
            JSON.stringify(subscription),
          );
        } catch (error) {
          showStatus(`❌ Error: ${error.message}`, 'error');
          console.error('Subscribe error:', error);
        }
      }

      async function unsubscribeFromPush() {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            await subscription.unsubscribe();

            await fetch(`${API_URL}/notifications/unsubscribe`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ endpoint: subscription.endpoint }),
            });

            localStorage.removeItem('pushSubscription');
          }

          showStatus(
            '✅ Successfully unsubscribed from notifications',
            'success',
          );
          document.getElementById('subscribeBtn').style.display = 'block';
          document.getElementById('unsubscribeBtn').style.display = 'none';
          document.getElementById('testBtn').style.display = 'none';
        } catch (error) {
          showStatus(`❌ Error: ${error.message}`, 'error');
          console.error('Unsubscribe error:', error);
        }
      }

      async function testNotification() {
        try {
          const response = await fetch(`${API_URL}/notifications/test`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to send test notification');
          }

          showStatus('✅ Test notification sent!', 'success');
        } catch (error) {
          showStatus(`❌ Error: ${error.message}`, 'error');
          console.error('Test error:', error);
        }
      }

      // Check if already subscribed on page load
      window.addEventListener('load', async () => {
        try {
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            const subscription =
              await registration.pushManager.getSubscription();

            if (subscription) {
              document.getElementById('subscribeBtn').style.display = 'none';
              document.getElementById('unsubscribeBtn').style.display = 'block';
              document.getElementById('testBtn').style.display = 'block';
              showStatus('✅ You are subscribed to notifications', 'success');
            }
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      });
    </script>
  </body>
</html>
```

### Service Worker (`sw.js`)

Create a service worker file in your public directory:

```javascript
// sw.js
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: data.badge || '/badge.png',
      data: data.data,
      vibrate: [200, 100, 200],
      tag: data.data?.orderId || 'revsticks-notification',
      requireInteraction: true,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Open the order details page or dashboard
  const orderId = event.notification.data?.orderId;
  const url = orderId
    ? `https://your-frontend-url.com/orders/${orderId}`
    : 'https://your-frontend-url.com/orders';

  event.waitUntil(clients.openWindow(url));
});
```

## iOS Setup Instructions

1. Open Safari on your iPhone
2. Navigate to your push notification subscription page (the HTML file above)
3. Log in to get your authentication token
4. Update the `API_URL` and `AUTH_TOKEN` in the HTML file
5. Tap "Enable Notifications"
6. Allow notifications when prompted
7. **Important**: Add the page to your home screen:
   - Tap the Share button
   - Select "Add to Home Screen"
   - Tap "Add"
8. Open the app from your home screen (notifications only work in standalone mode on iOS)

## Testing

1. Subscribe to notifications using the frontend
2. Test the integration using the "Send Test Notification" button
3. Create a test order to verify you receive a notification

## Troubleshooting

### Notifications not working on iOS?

- Make sure you added the web app to your home screen
- Open the app from the home screen icon (not Safari)
- Check that notification permissions are granted in iOS Settings
- Verify VAPID keys are correctly set in `.env`

### Backend errors?

- Check that the NotificationModule is imported in AppModule
- Verify the database migration was successful
- Check logs for any error messages

## Security Notes

- Keep your `VAPID_PRIVATE_KEY` secret
- Never commit it to version control
- The authentication token should be stored securely
- Use HTTPS for all communication
