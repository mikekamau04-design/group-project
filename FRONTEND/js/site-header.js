// ======================================================
// AFRICART SHARED SITE HEADER
// Handles: login-state nav, cart count, add-to-cart, logout
// Include this on every customer-facing page so the header
// behaves the same everywhere.
// ======================================================

(function () {

    const API = "http://localhost:5000/api";

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    window.AFRICART_API = API;

    // ==================================================
    // BUILD USER MENU (login state)
    // ==================================================

    const userMenu = document.getElementById("userMenu");

    if (userMenu) {

        if (token && user) {

            const dashboardLink =
                user.role === "customer"
                    ? `<a href="customer-dashboard-modern.html">📊 Dashboard</a>`
                    : user.role === "vendor"
                    ? `<a href="vendor-dashboard.html">📊 Dashboard</a>`
                    : user.role === "admin"
                    ? `<a href="admin/admin.html">📊 Dashboard</a>`
                    : "";

            userMenu.innerHTML = `
                <span style="font-weight:600">Welcome ${user.fullname}</span>
                ${dashboardLink}
                <a href="cart.html">🛒 Cart <span id="cartCount">(0)</span></a>
                <a href="#" id="logoutLink">Logout</a>
            `;

            const logoutLink = document.getElementById("logoutLink");

            if (logoutLink) {
                logoutLink.addEventListener("click", function (e) {
                    e.preventDefault();
                    logout();
                });
            }

        } else {

            userMenu.innerHTML = `
                <a href="login.html">Login</a>
                <a href="register.html">Register</a>
                <a href="cart.html">🛒 Cart <span id="cartCount">(0)</span></a>
            `;

        }

    }

    // ==================================================
    // LOGOUT
    // ==================================================

    window.logout = function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    };

    // ==================================================
    // CART COUNT (real backend cart)
    // ==================================================

    async function updateCartCount() {

        const el = document.getElementById("cartCount");

        if (!el) return;

        if (!token) {
            el.innerHTML = "(0)";
            return;
        }

        try {

            const res = await fetch(API + "/cart", {
                headers: { Authorization: "Bearer " + token }
            });

            const data = await res.json();

            if (data.success) {
                const count = data.cart.reduce(
                    (sum, item) => sum + Number(item.quantity), 0
                );
                el.innerHTML = "(" + count + ")";
            }

        } catch (err) {
            console.log(err);
        }

    }

    window.AFRICART_updateCartCount = updateCartCount;

    // ==================================================
    // ADD TO CART (real backend cart, requires login)
    // ==================================================

    window.addToCart = async function (productId, quantity) {

        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            alert("Please login to add items to your cart.");
            window.location.href = "login.html";
            return;
        }

        try {

            const res = await fetch(API + "/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + currentToken
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity || 1
                })
            });

            const data = await res.json();

            if (data.success) {
                alert("Product added to cart.");
                updateCartCount();
            } else {
                alert(data.message || "Could not add product to cart.");
            }

        } catch (err) {
            console.log(err);
            alert("Failed to add product to cart.");
        }

    };

    updateCartCount();

})();
