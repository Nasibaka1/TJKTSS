import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSy...your-actual-api-key...",
    authDomain: "tjktssv2.firebaseapp.com",
    projectId: "tjktssv2",
    storageBucket: "tjktssv2.appspot.com",
    messagingSenderId: "842333117452",
    appId: "1:842333117452:web:..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.currentUser = null;
window.currentUserEmail = null;
window.userRole = 'CUSTOMER';

const allowedAdmins = [
    "fadhilrandaputra@gmail.com",
    "nasibaka1@gmail.com",
    "tjktss@gmail.com"
];

window.loginWithGoogle = function() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Auth Error:", error);
        alert("Login Gagal: " + error.message);
    });
};

window.logoutUser = function() {
    signOut(auth).then(() => {
        location.reload();
    });
};

onAuthStateChanged(auth, (user) => {
    const authModal = document.getElementById('auth-modal');
    if (user) {
        window.currentUserEmail = user.email.toLowerCase().trim();
        const customUsername = localStorage.getItem('custom_username_' + window.currentUserEmail);
        window.currentUser = customUsername || user.displayName || user.email.split('@')[0];
        
        if (authModal) authModal.style.display = 'none';
        determineUserRole();
        window.updateUserInterface();
        window.renderGrid();
    } else {
        if (authModal) authModal.style.display = 'flex';
        window.currentUser = null;
        window.currentUserEmail = null;
        window.userRole = 'CUSTOMER';
        window.updateUserInterface();
    }
});

function determineUserRole() {
    if (allowedAdmins.includes(window.currentUserEmail)) {
        window.userRole = 'ADMIN';
    } else {
        window.userRole = 'CUSTOMER';
    }
}

window.updateUserInterface = function() {
    const userSpan = document.getElementById('user-display');
    const roleSpan = document.getElementById('role-display');
    if (userSpan) userSpan.innerText = window.currentUser || 'GUEST';
    if (roleSpan) roleSpan.innerText = window.userRole;
}

window.toggleSidebar = function() {
    const layout = document.getElementById('app-layout');
    if (layout) {
        layout.classList.toggle('sidebar-open');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};

// Safeguard against overlapping modal cascade
window.openModalSafely = function(modalId) {
    // Hide all modal overlays first
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.style.display = 'none';
    });
    // Show only the requested one
    const targetModal = document.getElementById(modalId);
    if (targetModal) {
        targetModal.style.display = 'flex';
    }
};

window.renderGrid = function() {
    console.log("Rendering grid data...");
};
