// ======================================================
// AFRICART VENDOR DASHBOARD
// ======================================================

const API = "http://localhost:5000/api";

const token = localStorage.getItem("token");

const user = JSON.parse(
    localStorage.getItem("user")
);

// ======================================================
// AUTH CHECK
// ======================================================

if (!token || !user) {

    window.location.href = "login.html";

}

if (user.role !== "vendor") {

    alert("Access denied.");

    window.location.href = "login.html";

}

// ======================================================
// LOAD DASHBOARD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    loadSummary();

    loadProducts();

});

// ======================================================
// API REQUEST
// ======================================================

async function request(url, method = "GET", body = null) {

    const options = {

        method,

        headers: {

            Authorization: `Bearer ${token}`

        }

    };

    if (body) {

        options.body = body;

    }

    const response = await fetch(

        API + url,

        options

    );

    return response.json();

} // ======================================================
// LOAD DASHBOARD SUMMARY
// ======================================================

async function loadSummary() {

    try {

        const data = await request(
            "/vendors/dashboard"
        );

        if (!data.success) {

            return;

        }

        const stats = data.stats;

        setValue("totalProducts", stats.totalProducts);

        setValue("totalOrders", stats.totalOrders);

        setValue("totalSales", "KSh " +
            Number(stats.totalSales).toLocaleString());

        setValue("pendingOrders", stats.pendingOrders);

    }

    catch(error){

        console.log(error);

    }

}

// ======================================================
// UPDATE DASHBOARD CARD
// ======================================================

function setValue(id, value){

    const element = document.getElementById(id);

    if(element){

        element.innerHTML = value;

    }

}