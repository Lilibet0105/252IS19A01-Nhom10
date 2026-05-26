// cart.js - Quản lý giỏ hàng (đồng bộ với key "daoTruyenCart")

const CART_KEY = 'daoTruyenCart';

// Khởi tạo giỏ hàng từ localStorage hoặc tạo mới nếu chưa có
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

// Hàm lưu giỏ hàng vào localStorage + phát sự kiện storage
function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Phát sự kiện storage để các tab/page khác cập nhật
    window.dispatchEvent(new StorageEvent('storage', {
        key: CART_KEY,
        newValue: JSON.stringify(cart)
    }));
}

// Hàm thêm truyện vào giỏ hàng
function addToCart(product) {
    const existingProductIndex = cart.findIndex(item => item.id === product.id);

    if (existingProductIndex >= 0) {
        // Nếu sản phẩm đã tồn tại trong giỏ hàng, tăng số lượng
        cart[existingProductIndex].qty += product.qty || 1;
    } else {
        // Nếu sản phẩm chưa tồn tại, thêm mới vào giỏ hàng
        cart.push({
            id: product.id,
            name: product.name,
            category: product.category || 'Truyện tranh',
            price: product.price,
            originalPrice: product.originalPrice || null,
            qty: product.qty || 1,
            image: (product.image || product.img || '').replace(/^\.?\/?\.{0,2}\/?/, '')
        });
    }

    saveCart();
    updateCartBadge();
    showCustomToast(product);
}

// Hàm cập nhật badge giỏ hàng trên header
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    // Cập nhật tất cả badge trên trang
    const badges = document.querySelectorAll('[id^="cart-badge"]');
    badges.forEach(badge => {
        badge.textContent = totalItems;
    });
    // Cũng cập nhật badge dùng class nếu có
    const classBadges = document.querySelectorAll('.cart-badge-count');
    classBadges.forEach(badge => {
        badge.textContent = totalItems;
    });
    return totalItems;
}

// Hàm hiển thị thông báo tùy biến khi thêm truyện vào giỏ hàng
function showCustomToast(product) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;background:#1a1a1a;color:white;padding:0.75rem 1.25rem;border-radius:0.75rem;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;opacity:0;transform:translateY(-10px);transition:opacity 0.3s,transform 0.3s;';
    toast.innerHTML = `
        <svg style="width:1rem;height:1rem;color:#d97706;flex-shrink:0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Đã thêm "${product.name}" vào giỏ hàng!
    `;

    toastContainer.appendChild(toast);

    // Hiệu ứng hiện
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Tự động xóa thông báo sau 2.5 giây
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Hàm cập nhật số lượng sản phẩm trong giỏ hàng
function updateQuantity(productId, qty) {
    const productIndex = cart.findIndex(item => item.id === productId);
    if (productIndex >= 0) {
        if (qty <= 0) {
            cart.splice(productIndex, 1);
        } else {
            cart[productIndex].qty = qty;
        }
        saveCart();
        updateCartBadge();
    }
}

// Hàm xóa sản phẩm khỏi giỏ hàng
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
}

// Hàm lấy danh sách sản phẩm trong giỏ hàng
function getCart() {
    return cart;
}

// Hàm tính tổng số lượng sản phẩm
function getTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

// Hàm tính tổng tiền trong giỏ hàng
function getTotal() {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
}

// Hàm xóa tất cả sản phẩm
function clearCart() {
    cart = [];
    saveCart();
    updateCartBadge();
}

// Lắng nghe thay đổi từ localStorage (từ tab/page khác)
window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
        cart = JSON.parse(e.newValue || '[]');
        updateCartBadge();
    }
});

// Khởi tạo badge khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});