#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications
 * Run: node scripts/generate-vapid-keys.js
 */

import pkg from 'web-push';
const { generateVAPIDKeys } = pkg;

const vapidKeys = generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log('\n');
console.log(
  '⚠️  Keep the VAPID_PRIVATE_KEY secret and never commit it to version control!',
);
console.log(
  '📱 Share the VAPID_PUBLIC_KEY with your frontend to subscribe to notifications.',
);
console.log('\n');
