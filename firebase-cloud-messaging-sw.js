importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBQkMZywL-ZrMndY8KibCEnMmVcboC699o",
  authDomain: "tjktssv2.firebaseapp.com",
  projectId: "tjktssv2",
  storageBucket: "tjktssv2.firebasestorage.app",
  messagingSenderId: "842333117452",
  appId: "1:842333117452:web:ea45034d64f0e03895e229",
  measurementId: "G-07HX39S99Y"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || 'Joki Fadhil';
  const notificationOptions = {
    body: payload.notification.body || 'New order or request update received!',
    icon: 'https://i.imgur.com/BpmjWkZ.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
