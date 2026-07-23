// ======================================================
// AFRICART ADMIN ANALYTICS
// ======================================================

const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");

// ======================================================
// FETCH DASHBOARD SUMMARY
// ======================================================

async function loadDashboardSummary() {

    try {

        const response = await fetch(

            `${API_URL}/analytics/summary`,

            {

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }

        );

        const data = await response.json();

        if (!data.success) return;

        document.getElementById("totalUsers").textContent =
            data.summary.users;

        document.getElementById("totalVendors").textContent =
            data.summary.vendors;

        document.getElementById("totalProducts").textContent =
            data.summary.products;

        document.getElementById("totalOrders").textContent =
            data.summary.orders;

        document.getElementById("totalRevenue").textContent =
            "KSh " +
            Number(data.summary.revenue).toLocaleString();

    }

    catch (error) {

        console.log(error);

    }

}

// ======================================================
// LOAD MONTHLY SALES
// ======================================================

async function loadMonthlySales() {

    try {

        const response = await fetch(

            `${API_URL}/analytics/monthly-sales`,

            {

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }

        );

        const data = await response.json();

        console.log("Monthly Sales", data);

    }

    catch (error) {

        console.log(error);

    }

}

// ======================================================
// LOAD BEST PRODUCTS
// ======================================================

async function loadBestProducts() {

    try {

        const response = await fetch(

            `${API_URL}/analytics/best-products`,

            {

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }

        );

        const data = await response.json();

        console.log("Best Products", data);

    }

    catch (error) {

        console.log(error);

    }

}

// ======================================================
// INIT
// ======================================================

loadDashboardSummary();

loadMonthlySales();

loadBestProducts();