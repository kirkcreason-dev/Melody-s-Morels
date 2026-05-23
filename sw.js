// Melody's Morels — Service Worker (Push Notifications)
// This file must stay at the root of your site.

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// PASTE YOUR FIREBASE CONFIG HERE (same as in index.html)
firebase.initializeApp({
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage(function(payload) {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Morels are popping! 🍄", {
    body:  body  || "Someone reported a find near you.",
    icon:  icon  || "/icon-192.png",
    badge: "/icon-192.png",
    data:  payload.data || {}
  });
});

// Click notification → open app
self.addEventListener("notificationclick", function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || "/"));
});
