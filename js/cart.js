/**
 * ═══════════════════════════════════════════════════════════════════
 * cart.js — Module Quản lý Giỏ hàng
 * ═══════════════════════════════════════════════════════════════════
 *
 * Mục đích:
 *   - Quản lý toàn bộ logic giỏ hàng cho website bán truyện tranh.
 *   - Đồng bộ dữ liệu giỏ hàng giữa các tab/trang thông qua localStorage
 *     và sự kiện StorageEvent.
 *   - Cung cấp các hàm: thêm, sửa, xóa sản phẩm, tính tổng tiền,
 *     cập nhật badge, hiển thị thông báo toast.
 *
 * Key lưu trữ localStorage: "daoTruyenCart"
 * Định dạng dữ liệu: Mảng JSON các đối tượng sản phẩm
 *   {
 *     id: string,
 *     name: string,
 *     category: string,
 *     price: number,
 *     originalPrice: number | null,
 *     qty: number,
 *     image: string
 *   }
 *
 * Phụ thuộc: Không yêu cầu thư viện bên ngoài (vanilla JS)
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════
// HẰNG SỐ & KHỞI TẠO GIỎ HÀNG
// ═══════════════════════════════════════════

/**
 * CART_KEY — Key dùng để lưu/truy xuất giỏ hàng trong localStorage.
 * @type {string}
 */
const CART_KEY = 'daoTruyenCart';

/**
 * Biến toàn cục `cart` — Mảng chứa danh sách sản phẩm trong giỏ hàng.
 * Được khởi tạo từ localStorage; nếu chưa có dữ liệu thì tạo mảng rỗng.
 * @type {Array<Object>}
 */
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

// ═══════════════════════════════════════════
// LƯU TRỮ & ĐỒNG BỘ GIỎ HÀNG
// ═══════════════════════════════════════════

/**
 * saveCart — Lưu giỏ hàng hiện tại vào localStorage và phát sự kiện
 * StorageEvent để các tab/trang khác cùng cập nhật.
 *
 * @returns {void}
 */
// ─────────────────────────────────────────
function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Phát sự kiện storage để các tab/page khác cập nhật
    window.dispatchEvent(new StorageEvent('storage', {
        key: CART_KEY,
        newValue: JSON.stringify(cart)
    }));
}

// ═══════════════════════════════════════════
// THÊM & CẬP NHẬT SẢN PHẨM
// ═══════════════════════════════════════════

/**
 * addToCart — Thêm một truyện vào giỏ hàng.
 *   - Nếu truyện đã tồn tại → tăng số lượng (qty).
 *   - Nếu truyện chưa có → thêm mới vào mảng cart.
 *   - Sau đó lưu, cập nhật badge và hiển thị toast thông báo.
 *
 * @param {Object} product — Đối tượng sản phẩm cần thêm
 * @param {string}  product.id            — Mã định danh duy nhất của truyện
 * @param {string}  product.name          — Tên truyện
 * @param {string}  [product.category]    — Thể loại truyện (mặc định: 'Truyện tranh')
 * @param {number}  product.price         — Giá bán hiện tại
 * @param {number}  [product.originalPrice] — Giá gốc (nếu có giảm giá)
 * @param {number}  [product.qty=1]      — Số lượng muốn thêm
 * @param {string}  [product.image]       — Đường dẫn ảnh bìa
 * @returns {void}
 */
// ─────────────────────────────────────────
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

// ═══════════════════════════════════════════
// HIỂN THỊ & GIAO DIỆN
// ═══════════════════════════════════════════

/**
 * updateCartBadge — Cập nhật số hiển thị trên badge giỏ hàng ở header.
 *   - Tính tổng số lượng tất cả sản phẩm trong giỏ.
 *   - Cập nhật tất cả phần tử có id bắt đầu bằng "cart-badge"
 *     và class "cart-badge-count".
 *
 * @returns {number} Tổng số lượng sản phẩm trong giỏ hàng
 */
// ─────────────────────────────────────────
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

/**
 * showCustomToast — Hiển thị thông báo toast khi người dùng thêm truyện
 * vào giỏ hàng. Toast xuất hiện ở góc trên bên phải với hiệu ứng
 * fade-in/fade-out và tự động biến mất sau 2.5 giây.
 *
 * @param {Object} product       — Đối tượng sản phẩm vừa được thêm
 * @param {string}  product.name  — Tên truyện (hiển thị trong toast)
 * @returns {void}
 */
// ─────────────────────────────────────────
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

// ═══════════════════════════════════════════
// CHỈNH SỬA & XÓA SẢN PHẨM
// ═══════════════════════════════════════════

/**
 * updateQuantity — Cập nhật số lượng của một sản phẩm trong giỏ hàng.
 *   - Nếu qty <= 0 → tự động xóa sản phẩm khỏi giỏ.
 *   - Nếu qty > 0 → gán số lượng mới cho sản phẩm.
 *
 * @param {string} productId — Mã định danh của sản phẩm cần cập nhật
 * @param {number} qty      — Số lượng mới (≤ 0 sẽ xóa sản phẩm)
 * @returns {void}
 */
// ─────────────────────────────────────────
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

/**
 * removeFromCart — Xóa hoàn toàn một sản phẩm khỏi giỏ hàng dựa trên id.
 *
 * @param {string} productId — Mã định danh của sản phẩm cần xóa
 * @returns {void}
 */
// ─────────────────────────────────────────
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
}

// ═══════════════════════════════════════════
// TRUY VẤN & THỐNG KÊ GIỎ HÀNG
// ═══════════════════════════════════════════

/**
 * getCart — Trả về danh sách tất cả sản phẩm trong giỏ hàng.
 *
 * @returns {Array<Object>} Mảng chứa các đối tượng sản phẩm hiện có trong giỏ
 */
// ─────────────────────────────────────────
function getCart() {
    return cart;
}

/**
 * getTotalItems — Tính tổng số lượng (qty) của tất cả sản phẩm trong giỏ.
 *
 * @returns {number} Tổng số lượng sản phẩm
 */
// ─────────────────────────────────────────
function getTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * getTotal — Tính tổng thành tiền của tất cả sản phẩm trong giỏ hàng.
 *   Công thức: Σ(price × qty) cho mỗi sản phẩm.
 *
 * @returns {number} Tổng thành tiền (VNĐ)
 */
// ─────────────────────────────────────────
function getTotal() {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
}

/**
 * clearCart — Xóa toàn bộ sản phẩm trong giỏ hàng và cập nhật lại badge.
 *
 * @returns {void}
 */
// ─────────────────────────────────────────
function clearCart() {
    cart = [];
    saveCart();
    updateCartBadge();
}

// ═══════════════════════════════════════════
// SỰ KIỆN & KHỞI TẠO
// ═══════════════════════════════════════════

/**
 * Lắng nghe sự kiện 'storage' từ localStorage.
 * Khi người dùng thay đổi giỏ hàng ở tab/trang khác,
 * dữ liệu sẽ được đồng bộ sang tab hiện tại.
 */
// ─────────────────────────────────────────
window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
        cart = JSON.parse(e.newValue || '[]');
        updateCartBadge();
    }
});

/**
 * Khởi tạo badge giỏ hàng khi DOM đã tải xong.
 * Đảm bảo số lượng hiển thị trên header luôn chính xác
 * ngay khi trang vừa mở.
 */
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});