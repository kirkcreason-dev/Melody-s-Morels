// Melody's Morels — Service Worker (Push Notifications)
// This file must stay at the root of your site.

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// PASTE YOUR FIREBASE CONFIG HERE (same as in index.html)
firebase.initializeApp({
  apiKey:            "AIzaSyDyJFh0wNs3CtuvCGcXA5DC42HIzO-fEfA",
  authDomain:        "melodys-morels.firebaseapp.com",
  databaseURL:       "https://melodys-morels-default-rtdb.firebaseio.com",
  projectId:         "melodys-morels",
  storageBucket:     "melodys-morels.firebasestorage.app",
  messagingSenderId: "912284861913",
  appId:             "1:912284861913:web:d8a7307626c6d68a6545c8"
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
