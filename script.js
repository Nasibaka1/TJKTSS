import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateid } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialize authentication and listeners
window.toggleSidebar = function() {
document.getElementById('app-layout').classList.toggle('sidebar-open');
};

window.closeModal = function(modalId) {
document.getElementById(modalId).style.display = 'none';
};

window.openCustomRequestModal = function() {
document.getElementById('custom-modal').style.display = 'flex';
};

window.switchTab = function(tabName) {
document.querySelectorAll('.sidebar-nav-group button').forEach(b => b.classList.remove('active'));
if(tabName === 'FEED') document.getElementById('tab-feed').classList.add('active');
if(tabName === 'CUSTOM') document.getElementById('tab-custom').classList.add('active');
if(tabName === 'ORDERS') document.getElementById('tab-orders').classList.add('active');
window.toggleSidebar();
};