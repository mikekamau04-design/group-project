// ======================================================
// AFRICART ADMIN DASHBOARD
// ======================================================

const API = "http://localhost:5000/api";

// ======================================================
// GET TOKEN
// ======================================================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login.html";
}

// ======================================================
// AUTH HEADERS
// ======================================================

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
};

// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboard() {

    try {

        const res = await fetch(
            `${API}/admin/dashboard`,
            {
                headers
            }
        );

        const data = await res.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        document.getElementById("users").innerText =
            data.data.users;

        document.getElementById("vendors").innerText =
            data.data.vendors;

        document.getElementById("products").innerText =
            data.data.products;

        document.getElementById("orders").innerText =
            data.data.orders;

        document.getElementById("revenue").innerText =
            "KSh " +
            Number(data.data.revenue).toLocaleString();

        document.getElementById("withdrawals").innerText =
            data.data.pendingWithdrawals;

        loadRecentOrders(
            data.data.latestOrders || []
        );

    }

    catch(error){

        console.error(error);

        alert("Unable to load dashboard.");

    }

}

// ======================================================
// LOAD RECENT ORDERS
// ======================================================

function loadRecentOrders(orders){

    const tbody =
        document.getElementById("recentOrders");

    tbody.innerHTML = "";

    orders.forEach(order=>{

        tbody.innerHTML += `

        <tr>

            <td>${order.id}</td>

            <td>${order.customer}</td>

            <td>KSh ${Number(order.total_amount).toLocaleString()}</td>

            <td>${order.status}</td>

            <td>${new Date(order.created_at).toLocaleDateString()}</td>

        </tr>

        `;

    });

}

// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile(){

    try{

        const res = await fetch(

            `${API}/admin/profile`,

            {

                headers

            }

        );

        const data = await res.json();

        if(data.success){

            document.getElementById("adminName").innerHTML =
                data.admin.fullname;

        }

    }

    catch(error){

        console.error(error);

    }

}

// ======================================================
// LOGOUT
// ======================================================

document
.getElementById("logoutBtn")
.addEventListener("click",()=>{

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href="../login.html";

});

// ======================================================
// START
// ======================================================

loadProfile();

loadDashboard();