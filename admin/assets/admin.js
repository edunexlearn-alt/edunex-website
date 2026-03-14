/* ============================================================
   ADMIN GLOBAL JS (admin/assets/admin.js)
   Shared utilities: auth guard, toast, sidebar, API calls
   ============================================================ */
const API_BASE = 'https://edunex-website-1.onrender.com/api';

/* ---- Auth Guard ---- */
function requireAdmin() {
    const token = localStorage.getItem('adminToken');
    if (!token) { window.location.href = 'index.html'; return null; }
    return token;
}

function getAdminUser() {
    try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; }
}

function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

/* ---- API Helper ---- */
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('adminToken');
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json();

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) logout();
        throw new Error(data.message || 'Request failed');
    }
    return data;
}

/* ---- Toast Notifications ---- */
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info} toast-icon"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

/* ---- Modal Helpers ---- */
function openModal(id) {
    document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
}

/* ---- Set Sidebar Active ---- */
function setActive(page) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const el = document.querySelector(`[data-page="${page}"]`);
    if (el) el.classList.add('active');
}

/* ---- Render Sidebar User ---- */
function renderSidebarUser() {
    const user = getAdminUser();
    const nameEl = document.getElementById('sidebarUserName');
    const initEl = document.getElementById('sidebarUserInitial');
    if (nameEl) nameEl.textContent = user.name || 'Admin';
    if (initEl) initEl.textContent = (user.name || 'A').charAt(0).toUpperCase();
}

/* ---- Format Currency ---- */
function formatCurrency(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
}

/* ---- Format Date ---- */
function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---- Format Time Ago ---- */
function timeAgo(d) {
    if (!d) return '—';
    const diff = Date.now() - new Date(d);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return formatDate(d);
}

/* ---- Badge HTML ---- */
function statusBadge(status) {
    const map = {
        'active': 'badge-success', 'paid': 'badge-success', 'enrolled': 'badge-success',
        'pending': 'badge-warning', 'partial': 'badge-warning', 'interested': 'badge-warning',
        'overdue': 'badge-danger', 'not-interested': 'badge-danger', 'dropped': 'badge-danger',
        'new': 'badge-info', 'contacted': 'badge-info',
        'inactive': 'badge-muted', 'closed': 'badge-muted',
        'in-progress': 'badge-primary', 'submitted': 'badge-success'
    };
    const cls = map[status] || 'badge-muted';
    return `<span class="badge ${cls}">${status}</span>`;
}

/* ---- Debounce ---- */
function debounce(fn, delay = 400) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

/* ---- Pagination Helper ---- */
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let html = '';
    for (let i = 1; i <= Math.min(totalPages, 8); i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="(${onPageChange})(${i})">${i}</button>`;
    }
    el.innerHTML = html;
}
