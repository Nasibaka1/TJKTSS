import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    onSnapshot,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBQkMZywL-ZrMndY8KibCEnMmVcboC699o",
    authDomain: "tjktssv2.firebaseapp.com",
    projectId: "tjktssv2",
    storageBucket: "tjktssv2.firebasestorage.app",
    messagingSenderId: "842333117452",
    appId: "1:842333117452:web:ea45034d64f0e03895e229",
    measurementId: "G-07HX39S99Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = 'muhammadfadhilrandaputra@gmail.com';
const CUSTOMER_CANCEL_WINDOW_MINUTES = 15;

// Drop previously installed push-notification workers.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => registrations.forEach(registration => registration.unregister()))
    .catch(() => {});
}

// Handle mobile redirect login results automatically on page load
getRedirectResult(auth).catch((error) => {
    console.error("Redirect sign-in error:", error);
    alert("Google Sign-In Error: " + error.message);
});

async function sendOrderEmail(order) {
  const recipients = [ADMIN_EMAIL, ...(window.authorizedEmployees || [])];
  try {
    const response = await fetch('/api/notify-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txId: order.id,
        jobTitle: order.jobTitle,
        customerName: order.customerName,
        customerEmail: window.currentUserEmail,
        phone: order.phone,
        taskLink: order.taskLink,
        totalPrice: order.totalPrice,
        kind: order.kind,
        recipients
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Order email failed:', error);
    return false;
  }
}

window.currentUser = null;
window.currentUserEmail = null;
window.userRole = 'CUSTOMER';
window.currentTab = 'FEED';
window.currentLang = 'id';
window.sortNewest = true;

window.jobsList = [];
window.transactionsList = [];
window.authorizedEmployees = [];
window.collapsedProofs = {};

const translations = {
    id: {
        authTitle: "[ AUTENTIKASI DIPERLUKAN ]",
        authDesc: "MASUK DENGAN GOOGLE UNTUK MENGAKSES TJKTSS",
        logout: "[X] KELUAR",
        statActive: "LAYANAN AKTIF",
        statCustom: "PERMINTAAN KUSTOM",
        statOrders: "TOTAL TRANSAKSI",
        roleTitle: "ROLE",
        sortTitle: "[ SORT ]:",
        sortNewest: "[ TERBARU ]",
        sortOldest: "[ TERLAMA ]",
        filterTitle: "[ FILTER ]:",
        optAllStatus: "SEMUA STATUS",
        optPendingDp: "PENDING DP (BELUM LUNAS)",
        optCompleted: "SELESAI",
        optPending: "BELUM SELESAI",
        optAllStaff: "SEMUA PEKERJA",
        filterCustPlaceholder: "Cari customer...",
        tabFeed: "[1] FEED LAYANAN",
        tabCustom: "[2] REQUEST KUSTOM",
        tabOrders: "[3] TRANSAKSI SAYA",
        tabAllOrders: "[4] SEMUA TRANSAKSI",
        navNav: "[ NAVIGASI ]",
        navActions: "[ AKSI / MENU ]",
        manageEmp: "+ KELOLA PEGAWAI",
        postJoki: "+ POST JOKI",
        reqCustom: "+ AJUKAN KUSTOM",
        noTrans: "[ TIDAK ADA TRANSAKSI DITEMUKAN ]",
        noFeed: "[ TIDAK ADA LISTING FEED DITEMUKAN ]",
        noCustom: "[ TIDAK ADA LISTING KUSTOM DITEMUKAN ]",
        mUserTitle: "UBAH NAMA TAMPILAN PENGGUNA",
        mUserLabel: "MASUKKAN USERNAME BARU",
        btnBatal: "BATAL",
        btnSimpan: "SIMPAN",
        mEmpTitle: "[ ADMIN ] OTORISASI AKUN GOOGLE PEGAWAI",
        mEmpLabel: "TAMBAHKAN ALAMAT EMAIL GOOGLE",
        btnOtorisasi: "OTORISASI",
        mEmpListLabel: "DAFTAR STAFF TEROTORISASI:",
        btnTutup: "TUTUP",
        mPostTitle: "BUAT LAYANAN JOKI",
        mPostLblTitle: "JUDUL",
        mPostLblPrice: "HARGA (cth: 15000, 15rb, 15k)",
        mPostLblDesc: "DESKRIPSI & CAKUPAN",
        mPostLblImg: "LAMPIRKAN GAMBAR / PREVIEW",
        btnPublikasikan: "PUBLIKASIKAN",
        mCustTitle: "AJUKAN PERMINTAAN TUGAS KUSTOM",
        mCustLblTitle: "JUDUL TUGAS",
        mCustLblBudget: "TAWARAN BUDGET / HARGA",
        mCustLblDeadline: "TENGGAK WAKTU (DEADLINE)",
        mCustLblDesc: "DETAIL / INSTRUKSI TUGAS",
        mCustLblPhone: "NOMOR TELEPON / WHATSAPP",
        mCustLblLink: "LINK / FILE TUGAS (Opsional)",
        btnAjukan: "AJUKAN TUGAS",
        mFeedOrderTitle: "[ PESAN LAYANAN JOKI ]",
        mFeedOrderPhone: "NOMOR TELEPON / WHATSAPP",
        mFeedOrderLink: "LINK ATAU CATATAN FILE TUGAS (OPSIONAL)",
        btnKirimPesan: "KIRIM PESANAN",
        mImgViewerTitle: "[ PREVIEW LAMPIRAN ]",
        mPayTitle: "PEMBAYARAN PESANAN",
        mPayPhone: "NOMOR TELEPON / WHATSAPP",
        mPayLink: "LINK ATAU CATATAN FILE TUGAS (OPSIONAL)",
        mPayType: "PILIH METODE PEMBAYARAN / DP",
        optPayDp50: "Down Payment (DP) 50%",
        optPayCustom: "Custom DP (Nominal Bebas)",
        optPayFull: "Bayar Penuh (Full Payment)",
        mPayCustomAmt: "MASUKKAN NOMINAL CUSTOM DP",
        mPayMethod: "METODE PEMBAYARAN",
        optPayEwallet: "Transfer Langsung E-Wallet",
        qrisScanTxt: "[ SCAN QRIS UNTUK MEMBAYAR ]",
        ewalletTitleTxt: "[ TRANSFER LANGSUNG GOPAY / DANA ]",
        btnCopyNum: "[SALIN NOMOR]",
        mPayProof: "LAMPIRKAN BUKTI SCREENSHOT PEMBAYARAN",
        btnKonfirmasi: "KONFIRMASI",
        pelunasanTitle: "PELUNASAN SISA PEMBAYARAN"
    },
    en: {
        authTitle: "[ AUTHENTICATION REQUIRED ]",
        authDesc: "SIGN IN WITH GOOGLE TO ACCESS TJKTSS",
        logout: "[X] LOGOUT",
        statActive: "ACTIVE LISTINGS",
        statCustom: "CUSTOM REQUESTS",
        statOrders: "TOTAL ORDERS",
        roleTitle: "ROLE",
        sortTitle: "[ SORT ]:",
        sortNewest: "[ NEWEST ]",
        sortOldest: "[ OLDEST ]",
        filterTitle: "[ FILTER ]:",
        optAllStatus: "ALL STATUSES",
        optPendingDp: "PENDING DP (UNPAID)",
        optCompleted: "COMPLETED",
        optPending: "INCOMPLETE",
        optAllStaff: "ALL WORKERS",
        filterCustPlaceholder: "Search customer...",
        tabFeed: "[1] SERVICE FEED",
        tabCustom: "[2] CUSTOM REQUESTS",
        tabOrders: "[3] MY TRANSACTIONS",
        tabAllOrders: "[4] ALL TRANSACTIONS",
        navNav: "[ NAVIGATION ]",
        navActions: "[ ACTIONS / MENU ]",
        manageEmp: "+ MANAGE EMPLOYEES",
        postJoki: "+ POST A JOKI",
        reqCustom: "+ SUBMIT CUSTOM",
        noTrans: "[ NO TRANSACTIONS FOUND ]",
        noFeed: "[ NO FEED LISTINGS FOUND ]",
        noCustom: "[ NO CUSTOM REQUESTS FOUND ]",
        mUserTitle: "EDIT DISPLAY USERNAME",
        mUserLabel: "ENTER NEW USERNAME",
        btnBatal: "CANCEL",
        btnSimpan: "SAVE",
        mEmpTitle: "[ ADMIN ] AUTHORIZE GOOGLE EMPLOYEE ACCOUNTS",
        mEmpLabel: "ADD GOOGLE EMAIL ADDRESS",
        btnOtorisasi: "AUTHORIZE",
        mEmpListLabel: "AUTHORIZED STAFF LIST:",
        btnTutup: "CLOSE",
        mPostTitle: "CREATE SERVICE LISTING",
        mPostLblTitle: "TITLE",
        mPostLblPrice: "PRICE (e.g., 15000, 15rb, 15k)",
        mPostLblDesc: "DESCRIPTION & SCOPE",
        mPostLblImg: "ATTACH IMAGE / PREVIEW",
        btnPublikasikan: "PUBLISH",
        mCustTitle: "SUBMIT CUSTOM TASK REQUEST",
        mCustLblTitle: "TASK TITLE",
        mCustLblBudget: "BUDGET / OFFER PRICE",
        mCustLblDeadline: "DEADLINE",
        mCustLblDesc: "TASK DETAILS / INSTRUCTIONS",
        mCustLblPhone: "PHONE NUMBER / WHATSAPP",
        mCustLblLink: "TASK LINK / FILE (Optional)",
        btnAjukan: "SUBMIT TASK",
        mFeedOrderTitle: "[ ORDER JOKI SERVICE ]",
        mFeedOrderPhone: "PHONE NUMBER / WHATSAPP",
        mFeedOrderLink: "TASK LINK OR FILE NOTES (OPTIONAL)",
        btnKirimPesan: "SEND ORDER",
        mImgViewerTitle: "[ ATTACHMENT PREVIEW ]",
        mPayTitle: "ORDER PAYMENT",
        mPayPhone: "PHONE NUMBER / WHATSAPP",
        mPayLink: "TASK LINK OR FILE NOTES (OPTIONAL)",
        mPayType: "SELECT PAYMENT METHOD / DP",
        optPayDp50: "Down Payment (DP) 50%",
        optPayCustom: "Custom DP (Free Amount)",
        optPayFull: "Full Payment",
        mPayCustomAmt: "ENTER CUSTOM DP AMOUNT",
        mPayMethod: "PAYMENT METHOD",
        optPayEwallet: "Direct E-Wallet Transfer",
        qrisScanTxt: "[ SCAN QRIS TO PAY ]",
        ewalletTitleTxt: "[ DIRECT GOPAY / DANA TRANSFER ]",
        btnCopyNum: "[COPY NUMBER]",
        mPayProof: "ATTACH PAYMENT SCREENSHOT PROOF",
        btnKonfirmasi: "CONFIRM",
        pelunasanTitle: "REMAINING BALANCE PAYMENT"
    }
};

window.toggleSidebar = function() {
    const layout = document.getElementById('app-layout');
    const toggleLabel = document.getElementById('toggle-label');
    layout.classList.toggle('sidebar-open');
    const isOpen = layout.classList.contains('sidebar-open');
    toggleLabel.innerText = isOpen ? '[HIDE MENU]' : '[SHOW MENU]';
};

window.toggleLanguage = function() {
    window.currentLang = window.currentLang === 'id' ? 'en' : 'id';
    document.getElementById('lang-btn').innerText = window.currentLang === 'id' ? '[EN]' : '[ID]';
    document.documentElement.lang = window.currentLang;
    updateStaticTexts();
    window.renderGrid();
};

function updateStaticTexts() {
    const t = translations[window.currentLang];
    document.getElementById('txt-auth-title').innerText = t.authTitle;
    document.getElementById('txt-auth-desc').innerText = t.authDesc;
    document.getElementById('logout-btn').innerText = t.logout;
    document.getElementById('label-stat-active').innerText = t.statActive;
    document.getElementById('label-stat-custom').innerText = t.statCustom;
    document.getElementById('label-stat-orders').innerText = t.statOrders;
    document.getElementById('label-stat-role-title').innerText = t.roleTitle;
    document.getElementById('label-sort-title').innerText = t.sortTitle;
    document.getElementById('sort-toggle-btn').innerText = window.sortNewest ? t.sortNewest : t.sortOldest;
    document.getElementById('label-filter-title').innerText = t.filterTitle;
    document.getElementById('opt-filter-all').innerText = t.optAllStatus;
    document.getElementById('opt-filter-dp').innerText = t.optPendingDp;
    document.getElementById('opt-filter-completed').innerText = t.optCompleted;
    document.getElementById('opt-filter-pending').innerText = t.optPending;
    document.getElementById('opt-filter-staff').innerText = t.optAllStaff;
    document.getElementById('filter-customer-input').placeholder = t.filterCustPlaceholder;

    document.getElementById('tab-feed').innerText = t.tabFeed;
    document.getElementById('tab-custom').innerText = t.tabCustom;
    document.getElementById('tab-orders').innerText = t.tabOrders;
    document.getElementById('tab-all-orders').innerText = t.tabAllOrders;
    document.getElementById('nav-title-nav').innerText = t.navNav;
    document.getElementById('nav-title-actions').innerText = t.navActions;
    document.getElementById('btn-action-manage-emp').innerText = t.manageEmp;
    document.getElementById('btn-action-post').innerText = t.postJoki;
    document.getElementById('btn-action-request').innerText = t.reqCustom;

    document.getElementById('m-title-user').innerText = t.mUserTitle;
    document.getElementById('m-label-user').innerText = t.mUserLabel;
    document.getElementById('btn-user-cancel').innerText = t.btnBatal;
    document.getElementById('btn-user-save').innerText = t.btnSimpan;

    document.getElementById('m-title-emp').innerText = t.mEmpTitle;
    document.getElementById('m-label-emp').innerText = t.mEmpLabel;
    document.getElementById('btn-emp-auth').innerText = t.btnOtorisasi;
    document.getElementById('m-label-emp-list').innerText = t.mEmpListLabel;
    document.getElementById('btn-emp-close').innerText = t.btnTutup;

    document.getElementById('m-title-post').innerText = t.mPostTitle;
    document.getElementById('m-label-title').innerText = t.mPostLblTitle;
    document.getElementById('m-label-price').innerText = t.mPostLblPrice;
    document.getElementById('m-label-desc').innerText = t.mPostLblDesc;
    document.getElementById('m-label-img').innerText = t.mPostLblImg;
    document.getElementById('btn-post-cancel').innerText = t.btnBatal;
    document.getElementById('btn-post-submit').innerText = t.btnPublikasikan;

    document.getElementById('m-title-cust').innerText = t.mCustTitle;
    document.getElementById('m-label-cust-title').innerText = t.mCustLblTitle;
    document.getElementById('m-label-cust-budget').innerText = t.mCustLblBudget;
    document.getElementById('m-label-cust-deadline').innerText = t.mCustLblDeadline;
    document.getElementById('m-label-cust-desc').innerText = t.mCustLblDesc;
    document.getElementById('m-label-cust-phone').innerText = t.mCustLblPhone;
    document.getElementById('m-label-cust-link').innerText = t.mCustLblLink;
    document.getElementById('btn-cust-cancel').innerText = t.btnBatal;
    document.getElementById('btn-cust-submit').innerText = t.btnAjukan;

    document.getElementById('m-title-feed-order').innerText = t.mFeedOrderTitle;
    document.getElementById('m-label-feed-phone').innerText = t.mFeedOrderPhone;
    document.getElementById('m-label-feed-link').innerText = t.mFeedOrderLink;
    document.getElementById('btn-feed-cancel').innerText = t.btnBatal;
    document.getElementById('btn-feed-submit').innerText = t.btnKirimPesan;

    document.getElementById('m-title-img-viewer').innerText = t.mImgViewerTitle;
    document.getElementById('btn-img-close').innerText = t.btnTutup;

    document.getElementById('checkout-modal-title').innerText = t.mPayTitle;
    document.getElementById('m-label-pay-phone').innerText = t.mPayPhone;
    document.getElementById('m-label-pay-link').innerText = t.mPayLink;
    document.getElementById('m-label-pay-type').innerText = t.mPayType;
    document.getElementById('opt-pay-dp50').innerText = t.optPayDp50;
    document.getElementById('opt-pay-custom').innerText = t.optPayCustom;
    document.getElementById('opt-pay-full').innerText = t.optPayFull;
    document.getElementById('m-label-pay-custom-amt').innerText = t.mPayCustomAmt;
    document.getElementById('m-label-pay-method').innerText = t.mPayMethod;
    document.getElementById('opt-pay-ewallet').innerText = t.optPayEwallet;
    document.getElementById('txt-qris-scan').innerText = t.qrisScanTxt;
    document.getElementById('txt-ewallet-title').innerText = t.ewalletTitleTxt;
    document.getElementById('btn-copy-num').innerText = t.btnCopyNum;
    document.getElementById('m-label-pay-proof').innerText = t.mPayProof;
    document.getElementById('btn-pay-cancel').innerText = t.btnBatal;
    document.getElementById('btn-pay-confirm').innerText = t.btnKonfirmasi;
}

window.toggleSortingOrder = function() {
    window.sortNewest = !window.sortNewest;
    const t = translations[window.currentLang];
    document.getElementById('sort-toggle-btn').innerText = window.sortNewest ? t.sortNewest : t.sortOldest;
    window.renderGrid();
};

onSnapshot(collection(db, "joki"), (snapshot) => {
    window.jobsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    window.renderGrid();
});

onSnapshot(collection(db, "transactions"), (snapshot) => {
    window.transactionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    window.updateStaffFilterDropdown();
    window.renderGrid();
});

onSnapshot(collection(db, "settings"), (snapshot) => {
    const empDoc = snapshot.docs.find(d => d.id === 'employees');
    if (empDoc) { window.authorizedEmployees = empDoc.data().list || []; }
    window.updateStaffFilterDropdown();
    determineUserRole();
    window.updateUserInterface();
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUserEmail = user.email.toLowerCase().trim();
        const customUsername = localStorage.getItem('custom_username_' + window.currentUserEmail);
        window.currentUser = customUsername || user.displayName || user.email.split('@')[0];
        document.getElementById('auth-modal').style.display = 'none';
        determineUserRole();
        window.updateUserInterface();
        window.renderGrid();
    } else {
        document.getElementById('auth-modal').style.display = 'flex';
        window.currentUser = null;
        window.currentUserEmail = null;
    }
});

window.loginWithGoogle = async function() {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Google Sign-In Popup Error:", error);
        alert("Google Sign-In Error: " + error.message);
    }
};

window.logoutSession = async function() { await signOut(auth); location.reload(); };

function determineUserRole() {
    if (window.currentUserEmail === ADMIN_EMAIL.toLowerCase()) { window.userRole = 'ADMIN'; }
    else if (window.authorizedEmployees.includes(window.currentUserEmail)) { window.userRole = 'EMPLOYEE'; }
    else { window.userRole = 'CUSTOMER'; }
}

window.openUsernameModal = function() {
    document.getElementById('new-username-input').value = window.currentUser || '';
    document.getElementById('username-modal').style.display = 'flex';
};

window.saveCustomUsername = function() {
    const input = document.getElementById('new-username-input').value.trim();
    if (!input) { alert('Username cannot be empty!'); return; }
    window.currentUser = input;
    if (window.currentUserEmail) { localStorage.setItem('custom_username_' + window.currentUserEmail, input); }
    window.updateUserInterface();
    window.closeModal('username-modal');
};

window.parseAmountToNumber = function(amountStr) {
    if (!amountStr) return 0;
    let cleaned = String(amountStr).toLowerCase().trim();
    let isThousands = cleaned.includes('rb') || cleaned.includes('k');
    let numStr = cleaned.replace(/[^0-9.]/g, '');
    if ((numStr.match(/\./g) || []).length > 1) { numStr = numStr.replace(/\./g, ''); }
    let num = parseFloat(numStr) || 0;
    return isThousands ? num * 1000 : num;
};

window.getCurrentFormattedTimestamp = function() {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' WITA';
};

window.updateUserInterface = function() {
    document.getElementById('sys-user').innerText = `${window.currentUser || 'guest'}@tjkt`;
    document.getElementById('sys-role').innerText = window.userRole;
    document.getElementById('stat-role-text').innerText = window.userRole;

    const isStaff = window.userRole === 'ADMIN' || window.userRole === 'EMPLOYEE';
    document.getElementById('btn-action-post').style.display = isStaff ? 'block' : 'none';
    document.getElementById('btn-action-manage-emp').style.display = window.userRole === 'ADMIN' ? 'block' : 'none';
    document.getElementById('tab-all-orders').style.display = isStaff ? 'block' : 'none';
    document.getElementById('btn-action-request').style.display = 'block';

    const showTransactionFilters = (window.currentTab === 'ALL_ORDERS' || window.currentTab === 'ORDERS');
    document.getElementById('filter-container').style.display = showTransactionFilters ? 'flex' : 'none';
};

window.updateStaffFilterDropdown = function() {
    const select = document.getElementById('filter-staff-select');
    if (!select) return;
    const currentVal = select.value;
    
    const staffSet = new Set();
    window.transactionsList.forEach(tx => {
        if (tx.acceptedBy) staffSet.add(tx.acceptedBy);
        if (tx.completedBy) staffSet.add(tx.completedBy);
    });
    window.authorizedEmployees.forEach(email => {
        let namePart = email.split('@')[0];
        staffSet.add(namePart);
    });
    staffSet.add('Randa');

    const t = translations[window.currentLang];
    select.innerHTML = `<option value="ALL">${t.optAllStaff}</option>`;
    staffSet.forEach(staff => {
        const opt = document.createElement('option');
        opt.value = staff;
        opt.innerText = staff;
        select.appendChild(opt);
    });

    if (staffSet.has(currentVal)) {
        select.value = currentVal;
    }
};

window.toggleRole = function() {
    if (window.userRole === 'ADMIN') window.userRole = 'EMPLOYEE';
    else if (window.userRole === 'EMPLOYEE') window.userRole = 'CUSTOMER';
    else determineUserRole();
    window.updateUserInterface();
    window.renderGrid();
};

window.openEmployeeManageModal = function() {
    window.renderEmployeeList();
    document.getElementById('employee-modal').style.display = 'flex';
};

window.renderEmployeeList = function() {
    const container = document.getElementById('employee-list-container');
    container.innerHTML = '';
    if (window.authorizedEmployees.length === 0) {
        container.innerHTML = `<div style="color: #9ca3af; font-size: 12px;">No employees added yet.</div>`;
        return;
    }
    window.authorizedEmployees.forEach((email) => {
        const div = document.createElement('div');
        div.className = 'employee-list-item';
        div.innerHTML = `<span style="color:#f3f4f6;">${escapeHtml(email)}</span><button class="btn-del" onclick="removeEmployeeEmail('${email}')" style="cursor: pointer;">REVOKE</button>`;
        container.appendChild(div);
    });
};

window.addEmployeeEmail = async function() {
    const input = document.getElementById('new-employee-email');
    const email = input.value.toLowerCase().trim();
    if (!email || !email.includes('@')) { alert('Please enter a valid email address!'); return; }
    if (!window.authorizedEmployees.includes(email)) {
        window.authorizedEmployees.push(email);
        await setDoc(doc(db, "settings", "employees"), { list: window.authorizedEmployees });
        window.renderEmployeeList();
        input.value = '';
    }
};

window.removeEmployeeEmail = async function(email) {
    window.authorizedEmployees = window.authorizedEmployees.filter(e => e !== email);
    await setDoc(doc(db, "settings", "employees"), { list: window.authorizedEmployees });
    window.renderEmployeeList();
};

window.switchTab = function(tab) {
    window.currentTab = tab;
    document.getElementById('tab-feed').classList.toggle('active', tab === 'FEED');
    document.getElementById('tab-custom').classList.toggle('active', tab === 'CUSTOM');
    document.getElementById('tab-orders').classList.toggle('active', tab === 'ORDERS');
    const tabAll = document.getElementById('tab-all-orders');
    if (tabAll) tabAll.classList.toggle('active', tab === 'ALL_ORDERS');
    window.updateUserInterface();
    window.renderGrid();
};

window.deleteJoki = async function(jobId) {
    if (confirm('Are you sure you want to delete this listing?')) {
        await deleteDoc(doc(db, "joki", jobId));
    }
};

window.deleteTransaction = async function(txId) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        await deleteDoc(doc(db, "transactions", txId));
    }
};

window.acceptTransactionStaff = async function(txId) {
    await updateDoc(doc(db, "transactions", txId), { 
        status: 'ACCEPTED_WAITING_PAYMENT',
        acceptedBy: window.currentUser 
    });
};

window.toggleTaskCompletion = async function(txId, isChecked) {
    const staffName = window.currentUser;
    await updateDoc(doc(db, "transactions", txId), {
        isCompleted: isChecked,
        completedBy: isChecked ? staffName : null,
        completedAt: isChecked ? window.getCurrentFormattedTimestamp() : null
    });
};


let activeStaffEditTxId = null;

window.openStaffEditModal = function(txId) {
    const tx = window.transactionsList.find(t => t.id === txId);
    if (!tx) return;
    activeStaffEditTxId = txId;

    document.getElementById('staff-edit-status').value = tx.status || '';
    document.getElementById('staff-edit-amount').value = '';
    document.getElementById('staff-edit-proof-file').value = '';
    document.getElementById('staff-edit-modal').style.display = 'flex';
};

window.submitStaffEdit = async function() {
    const tx = window.transactionsList.find(t => t.id === activeStaffEditTxId);
    if (!tx) return;

    const newStatus = document.getElementById('staff-edit-status').value.trim();
    const amountToAdd = window.parseAmountToNumber(document.getElementById('staff-edit-amount').value);
    const fileInput = document.getElementById('staff-edit-proof-file');

    const updateData = { status: newStatus };

    const processUpdate = async (proofData) => {
        if (amountToAdd > 0 && proofData) {
            let existingProofs = tx.proofs || [];
            existingProofs.push({
                title: 'Staff Added Payment',
                image: proofData,
                amount: amountToAdd,
                time: window.getCurrentFormattedTimestamp()
            });
            
            let newTotalPaid = (tx.amountPaid || 0) + amountToAdd;
            updateData.amountPaid = newTotalPaid;
            updateData.proofs = existingProofs;
            if (newTotalPaid >= tx.totalPrice) {
                updateData.status = 'PAID_FULL';
            }
        }

        await updateDoc(doc(db, "transactions", activeStaffEditTxId), updateData);
        window.closeModal('staff-edit-modal');
        alert('Transaction updated successfully!');
    };

    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 800; 
                canvas.height = 800 * (img.height / img.width);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                processUpdate(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        await processUpdate(null);
    }
};


window.cancelTransactionCustomer = async function(txId) {
    const tx = window.transactionsList.find(t => t.id === txId);
    if (!tx) return;
    if ((Date.now() - (tx.createdAt || 0)) / (1000 * 60) > CUSTOMER_CANCEL_WINDOW_MINUTES) {
        alert('Cancellation window (15 mins) has expired.');
        return;
    }
    if (confirm('Cancel this transaction?')) {
        await deleteDoc(doc(db, "transactions", txId));
    }
};

window.viewFullImage = function(imgData) {
    document.getElementById('img-viewer-src').src = imgData;
    document.getElementById('img-viewer-modal').style.display = 'flex';
};

window.toggleProofCollapse = function(txId) {
    window.collapsedProofs[txId] = !window.collapsedProofs[txId];
    window.renderGrid();
};

function formatShortLink(urlStr) {
    if (!urlStr) return '';
    let clean = urlStr.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
    }
    try {
        const u = new URL(clean);
        return `<a href="${u.href}" target="_blank" style="color: #00ffcc; text-decoration: underline;" title="${escapeHtml(urlStr)}">[🔗 Lihat File]</a>`;
    } catch {
        return `<a href="${escapeHtml(clean)}" target="_blank" style="color: #00ffcc; text-decoration: underline;" title="${escapeHtml(urlStr)}">[🔗 Lihat File]</a>`;
    }
}

function renderProofsHtml(tx) {
    let proofs = tx.proofs || [];
    if (proofs.length === 0 && tx.proofImage) {
        proofs = [{ title: tx.paymentMethod || 'Payment Proof', image: tx.proofImage, amount: tx.amountPaid || 0, time: tx.requestedAt || '' }];
    }
    if (proofs.length === 0) return '';

    const isCollapsed = !!window.collapsedProofs[tx.id];
    const arrowSymbol = isCollapsed ? '[▶]' : '[▼]';

    let html = `
        <div style="margin-top: 10px; border: 1px solid #4b5563; background: #111318; padding: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleProofCollapse('${tx.id}')">
                <span style="font-size: 11px; color: #00ffcc; font-weight: bold;">PAYMENT PROOFS (${proofs.length})</span>
                <button style="background: transparent; border: none; color: #00ffcc; font-size: 12px; cursor: pointer; padding: 0;">${arrowSymbol}</button>
            </div>
    `;

    if (!isCollapsed) {
        html += `<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">`;
        proofs.forEach((p, idx) => {
            html += `
                <div style="border-top: 1px dashed #374151; padding-top: 6px;">
                    <div style="font-size: 10px; color: #f3f4f6; font-weight: bold;">#${idx + 1} - ${escapeHtml(p.title || 'Payment')} (${formatRupiah(p.amount || 0)})</div>
                    <div style="font-size: 9px; color: #9ca3af; margin-bottom: 4px;">${escapeHtml(p.time || '')}</div>
                    <img src="${p.image}" class="card-img-preview" onclick="viewFullImage('${p.image}')" alt="Proof">
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

window.renderGrid = function() {
    const grid = document.getElementById('feed-grid');
    grid.innerHTML = '';
    const isStaff = window.userRole === 'ADMIN' || window.userRole === 'EMPLOYEE';
    
    let activeServices = window.jobsList.filter(j => j.type === 'marketplace' && (isStaff || j.status === 'open' || j.status === 'accepted' || j.authorName === window.currentUser));
    let customRequests = window.jobsList.filter(j => j.type === 'custom_request' && (isStaff || j.status === 'open' || j.status === 'accepted' || j.authorName === window.currentUser));
    let allTransactions = [...window.transactionsList];

    const sortFn = (a, b) => {
        let timeA = a.createdAt || parseInt((a.id || '').replace(/[^0-9]/g, '')) || 0;
        let timeB = b.createdAt || parseInt((b.id || '').replace(/[^0-9]/g, '')) || 0;
        return window.sortNewest ? (timeB - timeA) : (timeA - timeB);
    };

    activeServices.sort(sortFn);
    customRequests.sort(sortFn);
    allTransactions.sort(sortFn);

    document.getElementById('stat-active').innerText = activeServices.length;
    document.getElementById('stat-custom').innerText = customRequests.length;
    document.getElementById('stat-orders').innerText = window.transactionsList.length;

    const filterTransactions = (list) => {
        const statusFilter = document.getElementById('filter-status-select').value;
        const staffFilter = document.getElementById('filter-staff-select').value;
        const customerSearch = (document.getElementById('filter-customer-input').value || '').toLowerCase().trim();

        return list.filter(tx => {
            if (statusFilter === 'DP') {
                if (!(tx.status === 'PENDING_DP' || (tx.amountPaid > 0 && tx.amountPaid < tx.totalPrice))) return false;
            } else if (statusFilter === 'COMPLETED') {
                if (!tx.isCompleted) return false;
            } else if (statusFilter === 'PENDING') {
                if (tx.isCompleted) return false;
            }

            if (staffFilter && staffFilter !== 'ALL') {
                if (tx.acceptedBy !== staffFilter && tx.completedBy !== staffFilter) return false;
            }

            if (customerSearch) {
                const custName = (tx.customerName || '').toLowerCase();
                if (!custName.includes(customerSearch)) return false;
            }

            return true;
        });
    };

    if (window.currentTab === 'ALL_ORDERS' && isStaff) {
        let filteredTrans = filterTransactions(allTransactions);
        if (filteredTrans.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #f3f4f6; padding: 40px; font-weight: bold;">${translations[window.currentLang].noTrans}</div>`;
            return;
        }
        filteredTrans.forEach(tx => {
            const card = document.createElement('div');
            const isFullyPaid = tx.amountPaid >= tx.totalPrice || tx.status === 'PAID_FULL';
            card.className = `card ${isFullyPaid ? 'fully-paid-card' : ''}`;
            
            let proofsHtml = renderProofsHtml(tx);
            
            let taskCheckboxHtml = `
                <div class="task-status-box">
                    <input type="checkbox" ${tx.isCompleted ? 'checked' : ''} onchange="toggleTaskCompletion('${tx.id}', this.checked)">
                    <div>
                        <span style="color:#f3f4f6; font-weight:bold;">${tx.isCompleted ? 'COMPLETED' : 'MARK AS COMPLETED'}</span>
                        ${tx.completedBy ? `<div style="font-size:10px; color:#00ffcc;">By: ${escapeHtml(tx.completedBy)} (${tx.completedAt || ''})</div>` : ''}
                    </div>
                </div>
            `;

            let actionStaffBtn = '';
            if (tx.status === 'ORDERED_WAITING_WORKER') {
                actionStaffBtn = `<button onclick="acceptTransactionStaff('${tx.id}')" style="border-color: #00ffcc; color: #00ffcc; background: #132223; cursor: pointer; padding: 6px 10px; font-size:11px;">[ACCEPT ORDER]</button>`;
            } else {
                actionStaffBtn = `<span style="color: #00ffcc; font-size: 12px; font-weight: bold;">✓ Accepted by ${escapeHtml(tx.acceptedBy || 'Staff')}</span>`;
            }

            const staffEditBtn = `<button onclick="openStaffEditModal('${tx.id}')" style="border-color: #00ffcc; color: #00ffcc; background: #132223; cursor: pointer; padding: 6px 10px; font-size:11px; margin-right: 6px;">[EDIT / ADD PROOF]</button>`;
            const priceDisplay = tx.amountPaid > 0 ? `<div class="card-price">${formatRupiah(tx.amountPaid)} Paid (Total: ${formatRupiah(tx.totalPrice)})</div>` : `<div style="color: #fbbf24; font-size: 13px; font-weight: bold;">Total: ${formatRupiah(tx.totalPrice || 0)}</div>`;

            card.innerHTML = `
                <div>
                    <div class="card-title">${escapeHtml(tx.jobTitle)}</div>
                    ${priceDisplay}
                    <p class="card-desc" style="margin-top:4px;">Status: <span style="color:#00ffcc; font-weight:bold;">${escapeHtml(tx.status)}</span></p>
                    <div style="margin-top: 8px;">${actionStaffBtn}</div>
                    ${tx.status !== 'ORDERED_WAITING_WORKER' ? taskCheckboxHtml : ''}
                    ${proofsHtml}
                </div>
                <div>
                    <div class="card-meta">
                        <span><span class="meta-label">BUYER:</span> ${escapeHtml(tx.customerName)}</span>
                        <span><span class="meta-label">PHONE/WA:</span> <b style="color:#00ffcc;">${escapeHtml(tx.phone || 'N/A')}</b></span>
                        ${tx.taskLink ? '<span><span class="meta-label">FILE/LINK:</span> ' + formatShortLink(tx.taskLink) + '</span>' : ''}
                        <span><span class="meta-label">REQUESTED:</span> ${escapeHtml(tx.requestedAt || 'N/A')}</span>
                        <span><span class="meta-label">TX ID:</span> ${escapeHtml(tx.id)}</span>
                    </div>
                    <div style="margin-top: 12px; text-align: right; display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                        ${staffEditBtn}
                        <button class="btn-del" onclick="deleteTransaction('${tx.id}')" style="cursor: pointer;">DEL TX</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        return;
    }

    if (window.currentTab === 'ORDERS') {
        let userTransactions = window.transactionsList.filter(t => t.customerName === window.currentUser);
        userTransactions.sort(sortFn);
        let filteredUserTrans = filterTransactions(userTransactions);

        if (filteredUserTrans.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #f3f4f6; padding: 40px; font-weight: bold;">${translations[window.currentLang].noTrans}</div>`;
            return;
        }
        filteredUserTrans.forEach(tx => {
            const card = document.createElement('div');
            const isFullyPaid = tx.amountPaid >= tx.totalPrice || tx.status === 'PAID_FULL';
            card.className = `card ${isFullyPaid ? 'fully-paid-card' : ''}`;
            
            let proofsHtml = renderProofsHtml(tx);
            let cancelBtn = Math.ceil(CUSTOMER_CANCEL_WINDOW_MINUTES - (Date.now() - (tx.createdAt || 0)) / (1000 * 60)) > 0 ? `<button class="btn-del" onclick="cancelTransactionCustomer('${tx.id}')" style="cursor: pointer;">CANCEL</button>` : '';

            let statusInfoBox = '';
            if (tx.status === 'ORDERED_WAITING_WORKER') {
                statusInfoBox = `<div style="background:#27272a; border:1px solid #4b5563; padding:6px; margin-top:8px; font-size:12px; color:#fbbf24;">⏳ Waiting for worker to accept</div>`;
            } else if (tx.status === 'ACCEPTED_WAITING_PAYMENT' && tx.amountPaid === 0) {
                statusInfoBox = `<div style="background:#132223; border:1px solid #00ffcc; padding:8px; margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; color:#00ffcc; font-weight:bold;">✓ Accepted! Please Pay</span>
                    <button onclick="openCheckoutModal('${tx.id}', false)" style="border-color: #00ffcc; color: #00ffcc; background: #111318; padding: 6px 10px; font-size: 11px; cursor: pointer;">[PAY NOW]</button>
                </div>`;
            } else if (tx.status === 'PENDING_DP' && tx.amountPaid < tx.totalPrice) {
                const sisa = tx.totalPrice - tx.amountPaid;
                statusInfoBox = `<div style="background:#132223; border:1px solid #00ffcc; padding:8px; margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                    <span style="font-size:11px; color:#00ffcc; font-weight:bold;">Remaining: ${formatRupiah(sisa)}</span>
                    <button onclick="openCheckoutModal('${tx.id}', true)" style="border-color: #00ffcc; color: #00ffcc; background: #111318; padding: 6px 10px; font-size: 11px; cursor: pointer;">[PAY REMAINING]</button>
                </div>`;
            } else if (tx.isCompleted) {
                statusInfoBox = `<div style="background:#132223; border:1px solid #00ffcc; padding:6px; margin-top:8px; font-size:12px; color:#00ffcc; font-weight:bold;">✓ TASK COMPLETED</div>`;
            } else {
                statusInfoBox = `<div style="background:#27272a; border:1px solid #4b5563; padding:6px; margin-top:8px; font-size:12px; color:#f3f4f6;">⏳ In Progress</div>`;
            }

            const priceDisplay = tx.amountPaid > 0 ? `<div class="card-price">${formatRupiah(tx.amountPaid)} Paid (Total: ${formatRupiah(tx.totalPrice)})</div>` : `<div style="color: #fbbf24; font-size: 13px; font-weight: bold;">Est. Price: ${formatRupiah(tx.totalPrice || 0)}</div>`;

            card.innerHTML = `
                <div>
                    <div class="card-title">${escapeHtml(tx.jobTitle)}</div>
                    ${priceDisplay}
                    <p class="card-desc" style="margin-top:4px;">Status: <span style="color:#00ffcc; font-weight:bold;">${escapeHtml(tx.status)}</span></p>
                    ${statusInfoBox}
                    ${proofsHtml}
                </div>
                <div>
                    <div class="card-meta">
                        <span><span class="meta-label">BUYER:</span> ${escapeHtml(tx.customerName)}</span>
                        <span><span class="meta-label">PHONE/WA:</span> ${escapeHtml(tx.phone || 'N/A')}</span>
                        ${tx.acceptedBy ? '<span><span class="meta-label">WORKER:</span> <b style="color:#00ffcc;">' + escapeHtml(tx.acceptedBy) + '</b></span>' : ''}
                        ${tx.taskLink ? '<span><span class="meta-label">FILE/LINK:</span> ' + formatShortLink(tx.taskLink) + '</span>' : ''}
                        <span><span class="meta-label">REQUESTED:</span> ${escapeHtml(tx.requestedAt || 'N/A')}</span>
                        <span><span class="meta-label">TX ID:</span> ${escapeHtml(tx.id)}</span>
                    </div>
                    <div style="margin-top: 12px; text-align: right; display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                        ${cancelBtn}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        return;
    }

    const targetList = window.currentTab === 'FEED' ? activeServices : customRequests;
    if (targetList.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #f3f4f6; padding: 40px; font-weight: bold;">${window.currentTab === 'FEED' ? translations[window.currentLang].noFeed : translations[window.currentLang].noCustom}</div>`;
        return;
    }

    targetList.forEach((job) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let actionBtn = `<button onclick="openOrderModalFromFeed('${job.id}')" style="border-color: #00ffcc; color: #00ffcc; background: #132223; cursor: pointer;">[ORDER NOW]</button>`;
        let delBtn = isStaff || job.authorName === window.currentUser ? `<button class="btn-del" onclick="deleteJoki('${job.id}')" style="cursor: pointer;">DEL</button>` : '';

        card.innerHTML = `
            <div>
                <div class="card-title">${escapeHtml(job.title)}</div>
                <div class="card-price">${formatRupiah(job.price)}</div>
                <p class="card-desc" style="margin-top:6px;">${escapeHtml(job.description || '')}</p>
                ${job.image ? `<img src="${job.image}" class="card-img-preview" onclick="viewFullImage('${job.image}')">` : ''}
            </div>
            <div>
                <div class="card-meta">
                    <span><span class="meta-label">BY:</span> ${escapeHtml(job.authorName)}</span>
                    ${job.phone ? '<span><span class="meta-label">PHONE/WA:</span> <b style="color: #00ffcc;">' + escapeHtml(job.phone) + '</b></span>' : ''}
                    ${job.taskLink ? '<span><span class="meta-label">FILE/LINK:</span> ' + formatShortLink(job.taskLink) + '</span>' : ''}
                    <span><span class="meta-label">STATUS:</span> <b style="color: #00ffcc;">AVAILABLE</b></span>
                    <span><span class="meta-label">REQUESTED:</span> ${escapeHtml(job.requestedAt || 'N/A')}</span>
                </div>
                <div style="margin-top: 12px; text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 6px; flex-wrap: wrap;">
                    ${actionBtn}
                    ${delBtn}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};

window.openPostModal = function() { document.getElementById('post-modal').style.display = 'flex'; };
window.openCustomRequestModal = function() { document.getElementById('custom-modal').style.display = 'flex'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

window.submitCustomRequestOnly = async function() {
    const title = document.getElementById('custom-title').value.trim();
    const budget = window.parseAmountToNumber(document.getElementById('custom-budget').value);
    const phone = document.getElementById('custom-phone').value.trim();
    if (!title || !budget) { alert('Title and Budget are required!'); return; }
    if (!phone) { alert('Phone number / WhatsApp is required!'); return; }

    const txId = 'tx-' + Math.floor(Math.random() * 9000 + 1000);
    await setDoc(doc(db, "transactions", txId), {
        id: txId,
        jobTitle: title,
        customerName: window.currentUser,
        phone,
        taskLink: document.getElementById('custom-file-link').value.trim(),
        totalPrice: budget,
        paymentMethod: 'WAITING ACCEPT',
        amountPaid: 0,
        proofs: [],
        status: 'ORDERED_WAITING_WORKER',
        isCompleted: false,
        completedBy: null,
        customerEmail: window.currentUserEmail,
        createdAt: Date.now(),
        requestedAt: window.getCurrentFormattedTimestamp()
    });

    const emailed = await sendOrderEmail({
        id: txId,
        jobTitle: title,
        customerName: window.currentUser,
        phone,
        taskLink: document.getElementById('custom-file-link').value.trim(),
        totalPrice: budget,
        kind: 'custom'
    });

    window.closeModal('custom-modal');
    window.switchTab('ORDERS');
    if (!emailed) alert('Pesanan tersimpan, tetapi email notifikasi gagal dikirim.');
};

window.submitPost = function() {
    const title = document.getElementById('post-title').value.trim();
    const price = window.parseAmountToNumber(document.getElementById('post-price').value);
    if (!title || !price) { alert('Title and Price required!'); return; }
    
    const fileInput = document.getElementById('post-img');
    const process = async (imgStr) => {
        const jobId = 'job-' + Date.now();
        await setDoc(doc(db, "joki", jobId), { 
            id: jobId, title, price, 
            description: document.getElementById('post-desc').value.trim(), 
            image: imgStr, type: 'marketplace', status: 'open', 
            authorName: window.currentUser, createdAt: Date.now(), requestedAt: window.getCurrentFormattedTimestamp() 
        });
        window.closeModal('post-modal');
    };

    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 800; canvas.height = 800 * (img.height / img.width);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                process(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else { process(null); }
};

let selectedFeedJob = null;
window.openOrderModalFromFeed = function(jobId) {
    selectedFeedJob = window.jobsList.find(j => j.id === jobId);
    if (!selectedFeedJob) return;

    if (window.transactionsList.some(t => t.customerName === window.currentUser && t.jobTitle === selectedFeedJob.title)) {
        alert('You have already ordered this service!');
        return;
    }

    document.getElementById('feed-order-title').innerText = selectedFeedJob.title;
    document.getElementById('feed-order-price').innerText = `PRICE: ${formatRupiah(selectedFeedJob.price)}`;
    document.getElementById('feed-order-phone').value = selectedFeedJob.phone || '';
    document.getElementById('feed-order-link').value = selectedFeedJob.taskLink || '';
    document.getElementById('feed-order-modal').style.display = 'flex';
};

window.submitOrderFromFeed = async function() {
    const phone = document.getElementById('feed-order-phone').value.trim();
    if (!phone) { alert('Phone number is required!'); return; }
    const taskLink = document.getElementById('feed-order-link').value.trim();

    const txId = 'tx-' + Math.floor(Math.random() * 9000 + 1000);
    await setDoc(doc(db, "transactions", txId), {
        id: txId,
        jobTitle: selectedFeedJob.title,
        customerName: window.currentUser,
        phone,
        taskLink,
        totalPrice: selectedFeedJob.price,
        paymentMethod: 'WAITING ACCEPT',
        amountPaid: 0,
        proofs: [],
        status: 'ORDERED_WAITING_WORKER',
        isCompleted: false,
        completedBy: null,
        customerEmail: window.currentUserEmail,
        createdAt: Date.now(),
        requestedAt: window.getCurrentFormattedTimestamp()
    });

    const emailed = await sendOrderEmail({
        id: txId,
        jobTitle: selectedFeedJob.title,
        customerName: window.currentUser,
        phone,
        taskLink,
        totalPrice: selectedFeedJob.price,
        kind: 'service'
    });

    window.closeModal('feed-order-modal');
    window.switchTab('ORDERS');
    if (!emailed) alert('Pesanan tersimpan, tetapi email notifikasi gagal dikirim.');
};

let activeCheckoutTx = null;
let isRemainingPayment = false;

window.openCheckoutModal = function(txId, remaining = false) {
    activeCheckoutTx = window.transactionsList.find(t => t.id === txId);
    if (!activeCheckoutTx) return;
    isRemainingPayment = remaining;

    document.getElementById('checkout-item-title').innerText = activeCheckoutTx.jobTitle;
    document.getElementById('order-phone').value = activeCheckoutTx.phone || '';
    document.getElementById('order-task-link').value = activeCheckoutTx.taskLink || '';
    document.getElementById('pay-proof-img').value = '';

    const t = translations[window.currentLang];
    if (isRemainingPayment) {
        document.getElementById('checkout-modal-title').innerText = t.pelunasanTitle;
        document.getElementById('pay-type-wrapper').style.display = 'none';
        document.getElementById('custom-dp-field').style.display = 'none';
    } else {
        document.getElementById('checkout-modal-title').innerText = t.mPayTitle;
        document.getElementById('pay-type-wrapper').style.display = 'block';
        document.getElementById('pay-type').value = 'DP50';
        document.getElementById('custom-dp-amount').value = '';
    }
    
    updatePaymentAmounts();
    document.getElementById('checkout-modal').style.display = 'flex';
};

window.updatePaymentAmounts = function() {
    const totalPrice = activeCheckoutTx ? activeCheckoutTx.totalPrice : 0;
    let calculatedAmount = totalPrice;

    if (isRemainingPayment) {
        const alreadyPaid = activeCheckoutTx.amountPaid || 0;
        calculatedAmount = Math.max(0, totalPrice - alreadyPaid);
        document.getElementById('checkout-item-price').innerText = `REMAINING BALANCE: ${formatRupiah(calculatedAmount)} (Total: ${formatRupiah(totalPrice)})`;
    } else {
        const payType = document.getElementById('pay-type').value;
        const customField = document.getElementById('custom-dp-field');
        if (payType === 'DP50') {
            customField.style.display = 'none';
            calculatedAmount = totalPrice / 2;
        } else if (payType === 'CUSTOM') {
            customField.style.display = 'block';
            calculatedAmount = window.parseAmountToNumber(document.getElementById('custom-dp-amount').value) || 0;
        } else {
            customField.style.display = 'none';
            calculatedAmount = totalPrice;
        }
        document.getElementById('checkout-item-price').innerText = `TOTAL TO PAY: ${formatRupiah(calculatedAmount)} (From Total: ${formatRupiah(totalPrice)})`;
    }

    document.getElementById('qris-amount').innerText = formatRupiah(calculatedAmount);
    document.getElementById('ewallet-amount').innerText = formatRupiah(calculatedAmount);
};

window.togglePaymentInstructions = function() {
    const method = document.getElementById('pay-method').value;
    document.getElementById('qris-display').style.display = method === 'QRIS' ? 'block' : 'none';
    document.getElementById('ewallet-display').style.display = method === 'EWALLET' ? 'block' : 'none';
};

window.copyNumber = function(text) {
    navigator.clipboard.writeText(text);
    alert('Copied: ' + text);
};

window.confirmOrderPayment = function() {
    const phone = document.getElementById('order-phone').value.trim();
    if (!phone) { alert('Phone number is required!'); return; }

    let amountToPay = activeCheckoutTx.totalPrice;
    let payTypeDesc = 'FULL';

    if (isRemainingPayment) {
        amountToPay = Math.max(0, activeCheckoutTx.totalPrice - (activeCheckoutTx.amountPaid || 0));
        payTypeDesc = 'Balance Payment';
    } else {
        const payType = document.getElementById('pay-type').value;
        if (payType === 'DP50') { amountToPay = activeCheckoutTx.totalPrice / 2; payTypeDesc = 'DP 50%'; }
        else if (payType === 'CUSTOM') { amountToPay = window.parseAmountToNumber(document.getElementById('custom-dp-amount').value) || 0; payTypeDesc = 'Custom DP'; }
        else { amountToPay = activeCheckoutTx.totalPrice; payTypeDesc = 'Full Payment'; }
    }

    const proofInput = document.getElementById('pay-proof-img');
    if (!proofInput.files[0]) {
        alert('Payment screenshot proof is required!');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 800 * (img.height / img.width);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            finalizePayment(amountToPay, payTypeDesc, canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(proofInput.files[0]);
};

async function finalizePayment(amountPaidNow, payTypeDesc, proofData) {
    let existingProofs = activeCheckoutTx.proofs || [];
    if (existingProofs.length === 0 && activeCheckoutTx.proofImage) {
        existingProofs.push({ title: activeCheckoutTx.paymentMethod || 'Payment', image: activeCheckoutTx.proofImage, amount: activeCheckoutTx.amountPaid || 0, time: activeCheckoutTx.requestedAt || '' });
    }

    existingProofs.push({
        title: payTypeDesc,
        image: proofData,
        amount: amountPaidNow,
        time: window.getCurrentFormattedTimestamp()
    });

    let newTotalPaid = (activeCheckoutTx.amountPaid || 0) + amountPaidNow;
    let newStatus = (newTotalPaid >= activeCheckoutTx.totalPrice) ? 'PAID_FULL' : 'PENDING_DP';

    await updateDoc(doc(db, "transactions", activeCheckoutTx.id), {
        phone: document.getElementById('order-phone').value.trim(),
        taskLink: document.getElementById('order-task-link').value.trim(),
        paymentMethod: document.getElementById('pay-method').value + ` (${payTypeDesc})`,
        amountPaid: newTotalPaid,
        proofs: existingProofs,
        status: newStatus,
    });

    window.closeModal('checkout-modal');
    window.switchTab('ORDERS');
}

function formatRupiah(num) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num) + " Rp"; }
function escapeHtml(text) { return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    const particles = Array.from({length: 45}, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1, alpha: Math.random() * 0.3 + 0.2
    }));
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(243, 244, 246, ${p.alpha})`; ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}
initParticles();
