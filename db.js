// ========================================
// db.js - Shared MongoDB API for all pages
// Include this script in every HTML page
// ========================================

const API_URL = 'http://localhost:5000'; // Change this to your live server URL when deployed

// ✅ Load shared header (school name, affiliation) from MongoDB
async function loadSharedHeader() {
    try {
        const res = await fetch(`${API_URL}/api/content`);
        const data = await res.json();
        if (data.schoolName && document.getElementById('schoolName'))
            document.getElementById('schoolName').innerHTML = data.schoolName;
        if (data.affiliation && document.getElementById('affiliation'))
            document.getElementById('affiliation').innerHTML = data.affiliation;
    } catch (e) { console.log('Header load failed:', e); }
}

// ✅ Load shared footer from MongoDB
async function loadSharedFooter() {
    try {
        const res = await fetch(`${API_URL}/api/content`);
        const data = await res.json();
        if (data.address && document.getElementById('address'))
            document.getElementById('address').innerHTML = data.address;
        if (data.email && document.getElementById('email'))
            document.getElementById('email').innerHTML = data.email;
        if (data.phone && document.getElementById('phone'))
            document.getElementById('phone').innerHTML = data.phone;
    } catch (e) { console.log('Footer load failed:', e); }
}

// ✅ Save content to MongoDB
async function saveToMongo(key, value) {
    try {
        await fetch(`${API_URL}/api/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
    } catch (e) { console.log('Save failed:', e); }
}

// ✅ Save multiple content at once to MongoDB
async function saveBulkToMongo(data) {
    try {
        const res = await fetch(`${API_URL}/api/content/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        });
        const result = await res.json();
        return result.success;
    } catch (e) {
        console.log('Bulk save failed:', e);
        return false;
    }
}

// ✅ Upload image to Cloudinary via backend
async function uploadImageToMongo(file, key) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', key);
    try {
        const res = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        return result.success ? result.imageUrl : null;
    } catch (e) {
        console.log('Image upload failed:', e);
        return null;
    }
}

// ✅ Universal editImage function (file upload → Cloudinary)
async function editImage(elementId) {
    if (typeof isAdmin !== 'undefined' && !isAdmin) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        showMessage('Uploading image...', 'info');
        const url = await uploadImageToMongo(file, elementId);
        if (url) {
            document.getElementById(elementId).src = url;
            showMessage('✅ Image uploaded permanently!', 'success');
        } else {
            showMessage('❌ Upload failed. Is the server running?', 'error');
        }
    };
    input.click();
}

// ✅ Universal showMessage function
function showMessage(text, type = 'success') {
    const existing = document.getElementById('_flashMsg');
    if (existing) existing.remove();
    const msg = document.createElement('div');
    msg.id = '_flashMsg';
    msg.textContent = text;
    let bg = type === 'error' ? 'background:#ef4444' : type === 'info' ? 'background:#3b82f6' : 'background:#22c55e';
    msg.style.cssText = `position:fixed;bottom:20px;right:20px;${bg};color:white;padding:12px 20px;border-radius:8px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2)`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}
