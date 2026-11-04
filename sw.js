// sw.js
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Order Received!';
  const options = {
    body: data.body || 'A new task or order has been placed.',
    icon: 'https://i.imgur.com/BpmjWkZ.png',
    badge: 'https://i.imgur.com/BpmjWkZ.png'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Opens your app dashboard when clicked
  );
});
