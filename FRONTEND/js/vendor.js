// ======================================================
// AFRICART VENDOR DASHBOARD
// vendor.js
// PART 1 - INITIALIZATION & AUTHENTICATION
// ======================================================

// ======================================================
// API URL
// ======================================================

const API_URL = "http://localhost:5000/api";

// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentUser = null;

let vendorProducts = [];

let vendorOrders = [];

let vendorProfile = null;

// ======================================================
// GET TOKEN
// ======================================================

function getToken() {

    return localStorage.getItem("token");

}

// ======================================================
// GET LOGGED USER
// ======================================================

function getUser() {

    const user = localStorage.getItem("user");

    if (!user) {

        return null;

    }

    return JSON.parse(user);

}

// ======================================================
// API HELPER
// ======================================================

async function api(endpoint, method = "GET", body = null) {

    const options = {

        method,

        headers: {

            "Content-Type": "application/json"

        }

    };

    const token = getToken();

    if (token) {

        options.headers.Authorization = `Bearer ${token}`;

    }

    if (body) {

        options.body = JSON.stringify(body);

    }

    const response = await fetch(API_URL + endpoint, options);

    return await response.json();

}

// ======================================================
// AUTHENTICATION CHECK
// ======================================================

function checkLogin() {

    currentUser = getUser();

    if (!currentUser) {

        alert("Please login first.");

        window.location.href = "login.html";

        return false;

    }

    if (currentUser.role !== "vendor") {

        alert("Access denied.");

        window.location.href = "login.html";

        return false;

    }

    return true;

}

// ======================================================
// SET VENDOR DETAILS
// ======================================================

function loadVendorHeader() {

    if (!currentUser) return;

    const name = document.getElementById("vendorName");

    if (name) {

        name.innerHTML = currentUser.fullname;

    }

    const image = document.getElementById("vendorImage");

    if (image) {

        image.src =
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.fullname)}`;

    }

}

// ======================================================
// PAGE TITLES
// ======================================================

const pageTitles = {

    dashboard: {

        title: "Dashboard",

        subtitle: "Welcome back to your store"

    },

    products: {

        title: "Products",

        subtitle: "Manage your products"

    },

    orders: {

        title: "Orders",

        subtitle: "Manage customer orders"

    },

    earnings: {

        title: "Earnings",

        subtitle: "Track your income"

    },

    profile: {

        title: "Profile",

        subtitle: "Manage your account"

    }

};

// ======================================================
// UPDATE PAGE HEADER
// ======================================================

function updatePage(title) {

    document.getElementById("pageTitle").innerHTML =
    pageTitles[title].title;

    document.getElementById("pageSubtitle").innerHTML =
    pageTitles[title].subtitle;

}

// ======================================================
// START APPLICATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    if (!checkLogin()) {

        return;

    }

    loadVendorHeader();

});

// ======================================================
// PART 2 - NAVIGATION & UTILITIES
// ======================================================

// ======================================================
// SECTION NAVIGATION
// ======================================================

const sections = document.querySelectorAll(".section");

const menuLinks = document.querySelectorAll(".menu a[data-target]");

menuLinks.forEach(link => {

    link.addEventListener("click", function (e) {

        e.preventDefault();

        const target = this.dataset.target;

        menuLinks.forEach(item => {

            item.classList.remove("active");

        });

        this.classList.add("active");

        sections.forEach(section => {

            section.classList.remove("active");

        });

        const page = document.getElementById(target);

        if (page) {

            page.classList.add("active");

        }

        updatePage(target);

        switch (target) {

            case "dashboard":

                loadDashboard();

                break;

            case "products":

                loadProducts();

                break;

            case "orders":

                loadOrders();

                break;

            case "earnings":

                loadEarnings();

                break;

            case "profile":

                loadProfile();

                break;

        }

    });

});

// ======================================================
// LOGOUT
// ======================================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function (e) {

        e.preventDefault();

        if (!confirm("Are you sure you want to logout?")) {

            return;

        }

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href = "login.html";

    });

}

// ======================================================
// TOAST NOTIFICATION
// ======================================================

function toast(message, type = "success") {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.innerHTML = message;

    if (type === "success") {

        toast.style.background = "#0b8f4d";

    }

    if (type === "error") {

        toast.style.background = "#d32f2f";

    }

    if (type === "warning") {

        toast.style.background = "#ff9800";

    }

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

// ======================================================
// LOADING HELPERS
// ======================================================

function showLoading(elementId) {

    const el = document.getElementById(elementId);

    if (!el) return;

    el.innerHTML = `
        <tr>
            <td colspan="10" style="text-align:center;padding:30px;">
                Loading...
            </td>
        </tr>
    `;

}

function showEmpty(elementId, message) {

    const el = document.getElementById(elementId);

    if (!el) return;

    el.innerHTML = `
        <tr>
            <td colspan="10" style="text-align:center;padding:30px;color:#777;">
                ${message}
            </td>
        </tr>
    `;

}

// ======================================================
// FORMAT CURRENCY
// ======================================================

function formatMoney(value) {

    return "KSh " +

    Number(value).toLocaleString();

}

// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date) {

    return new Date(date).toLocaleDateString();

}

// ======================================================
// BADGE COLORS
// ======================================================

function statusBadge(status) {

    status = status.toLowerCase();

    let cls = "badge-processing";

    if (status === "pending") cls = "badge-pending";

    if (status === "processing") cls = "badge-processing";

    if (status === "shipped") cls = "badge-shipped";

    if (status === "delivered") cls = "badge-delivered";

    if (status === "cancelled") cls = "badge-cancelled";

    return `<span class="badge ${cls}">
        ${status.toUpperCase()}
    </span>`;

}

// ======================================================
// STOCK BADGE
// ======================================================

function stockBadge(stock) {

    if (stock <= 0) {

        return '<span class="badge badge-outstock">Out of Stock</span>';

    }

    if (stock <= 5) {

        return '<span class="badge badge-lowstock">Low Stock</span>';

    }

    return '<span class="badge badge-instock">In Stock</span>';

}

// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(() => {

    loadDashboard();

}, 30000);

// ======================================================
// PART 3 - DASHBOARD & PRODUCTS
// ======================================================

// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboard() {

    await loadProducts();

    document.getElementById("totalProducts").innerHTML =
        vendorProducts.length;

    let totalStock = 0;

    vendorProducts.forEach(product => {

        totalStock += Number(product.stock);

    });

    document.getElementById("pendingOrders").innerHTML =
        vendorProducts.filter(product => product.stock <= 5).length;

}

// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {

    try {

        showLoading("productsTableBody");

        const result = await api("/products/vendor/my-products");

        if (!result.success) {

            showEmpty(
                "productsTableBody",
                "No products found."
            );

            return;

        }

        vendorProducts = result.products;

        renderProducts();

        loadLowStock();

    }

    catch (error) {

        console.log(error);

        showEmpty(
            "productsTableBody",
            "Unable to load products."
        );

    }

}

// ======================================================
// RENDER PRODUCTS
// ======================================================

function renderProducts() {

    const table =
        document.getElementById("productsTableBody");

    table.innerHTML = "";

    if (vendorProducts.length === 0) {

        document.getElementById("productsEmpty").style.display =
            "block";

        return;

    }

    document.getElementById("productsEmpty").style.display =
        "none";

    vendorProducts.forEach(product => {

        let image = "images/no-image.png";

        if (product.image) {

            image =
                "http://localhost:5000/uploads/" +
                product.image;

        }

        table.innerHTML += `

<tr>

<td>

<img
src="${image}"
class="prod-thumb">

${product.name}

</td>

<td>

${product.category}

</td>

<td>

${formatMoney(product.price)}

</td>

<td>

${product.stock}

</td>

<td>

${stockBadge(product.stock)}

</td>

<td>

<button
class="btn btn-outline btn-sm"
onclick="editProduct(${product.id})">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteProduct(${product.id})">

Delete

</button>

</td>

</tr>

`;

    });

}

// ======================================================
// LOW STOCK PANEL
// ======================================================

function loadLowStock() {

    const body =
        document.querySelector("#lowStockTable tbody");

    body.innerHTML = "";

    const lowStock =
        vendorProducts.filter(product => product.stock <= 5);

    if (lowStock.length === 0) {

        document.getElementById("lowStockEmpty")
            .style.display = "block";

        return;

    }

    document.getElementById("lowStockEmpty")
        .style.display = "none";

    lowStock.forEach(product => {

        body.innerHTML += `

<tr>

<td>

${product.name}

</td>

<td>

${product.stock}

</td>

</tr>

`;

    });

}

// ======================================================
// SEARCH PRODUCTS
// ======================================================

function searchProducts(keyword) {

    keyword = keyword.toLowerCase();

    const filtered =
        vendorProducts.filter(product =>

            product.name.toLowerCase().includes(keyword) ||

            product.category.toLowerCase().includes(keyword)

        );

    const oldProducts = vendorProducts;

    vendorProducts = filtered;

    renderProducts();

    vendorProducts = oldProducts;

}
// ======================================================
// PART 4 - ADD, EDIT & DELETE PRODUCTS
// ======================================================

// ======================================================
// MODAL
// ======================================================

const productModal =
    document.getElementById("productModalOverlay");

const productForm =
    document.getElementById("productForm");

let editingProductId = null;

// ======================================================
// OPEN MODAL
// ======================================================

function openProductModal() {

    editingProductId = null;

    productForm.reset();

    document.querySelector("#productModalOverlay h3").innerHTML =
        "Add Product";

    productModal.classList.add("active");

}

// ======================================================
// CLOSE MODAL
// ======================================================

function closeProductModal() {

    productModal.classList.remove("active");

    productForm.reset();

    editingProductId = null;

}

// ======================================================
// BUTTONS
// ======================================================

document.getElementById("addProductBtn")
.addEventListener("click", openProductModal);

document.getElementById("addProductBtnEmpty")
.addEventListener("click", openProductModal);

document.getElementById("cancelProductBtn")
.addEventListener("click", closeProductModal);

productModal.addEventListener("click", function(e){

    if(e.target===productModal){

        closeProductModal();

    }

});

// ======================================================
// SAVE PRODUCT
// ======================================================

productForm.addEventListener("submit", saveProduct);

async function saveProduct(e){

    e.preventDefault();

    const data = {

        name:
        document.getElementById("prodName").value,

        category:
        document.getElementById("prodCategory").value,

        price:
        document.getElementById("prodPrice").value,

        stock:
        document.getElementById("prodStock").value,

        description:""

    };

    try{

        let result;

        if(editingProductId===null){

            result = await api(

                "/products",

                "POST",

                data

            );

        }

        else{

            result = await api(

                "/products/"+editingProductId,

                "PUT",

                data

            );

        }

        if(result.success){

            toast("Product saved successfully.");

            closeProductModal();

            loadProducts();

            loadDashboard();

        }

        else{

            toast(result.message,"error");

        }

    }

    catch(error){

        console.log(error);

        toast("Server Error","error");

    }

}

// ======================================================
// EDIT PRODUCT
// ======================================================

function editProduct(id){

    const product = vendorProducts.find(

        p=>p.id===id

    );

    if(!product){

        return;

    }

    editingProductId=id;

    document.querySelector("#productModalOverlay h3").innerHTML =
    "Edit Product";

    document.getElementById("prodName").value =
    product.name;

    document.getElementById("prodCategory").value =
    product.category;

    document.getElementById("prodPrice").value =
    product.price;

    document.getElementById("prodStock").value =
    product.stock;

    productModal.classList.add("active");

}

// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(id){

    if(!confirm("Delete this product?")){

        return;

    }

    try{

        const result = await api(

            "/products/"+id,

            "DELETE"

        );

        if(result.success){

            toast("Product deleted.");

            loadProducts();

            loadDashboard();

        }

        else{

            toast(result.message,"error");

        }

    }

    catch(error){

        console.log(error);

        toast("Server Error","error");

    }

}

// ======================================================
// REFRESH PRODUCTS
// ======================================================

async function refreshProducts(){

    await loadProducts();

    await loadDashboard();

}

// ======================================================
// PART 5 - ORDERS & DASHBOARD STATISTICS
// ======================================================

// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders() {

    try {

        showLoading("ordersTableBody");

        const result = await api("/orders/vendor");

        if (!result.success) {

            showEmpty(
                "ordersTableBody",
                "No orders found."
            );

            return;

        }

        vendorOrders = result.orders;

        renderOrders();

        renderRecentOrders();

        calculateDashboard();

    }

    catch (error) {

        console.log(error);

        showEmpty(
            "ordersTableBody",
            "Unable to load orders."
        );

    }

}

// ======================================================
// RENDER ORDERS
// ======================================================

function renderOrders() {

    const table =
        document.getElementById("ordersTableBody");

    table.innerHTML = "";

    if (vendorOrders.length === 0) {

        document.getElementById("ordersEmpty").style.display =
            "block";

        return;

    }

    document.getElementById("ordersEmpty").style.display =
        "none";

    vendorOrders.forEach(order => {

        table.innerHTML += `

<tr>

<td>${order.id}</td>

<td>${order.customer_name || "Customer"}</td>

<td>${order.items || 1}</td>

<td>${formatMoney(order.total_amount)}</td>

<td>${formatDate(order.created_at)}</td>

<td>

<select
onchange="changeOrderStatus(${order.id},this.value)"
class="status-select">

<option value="pending"
${order.status==="pending"?"selected":""}>

Pending

</option>

<option value="processing"
${order.status==="processing"?"selected":""}>

Processing

</option>

<option value="shipped"
${order.status==="shipped"?"selected":""}>

Shipped

</option>

<option value="delivered"
${order.status==="delivered"?"selected":""}>

Delivered

</option>

<option value="cancelled"
${order.status==="cancelled"?"selected":""}>

Cancelled

</option>

</select>

</td>

</tr>

`;

    });

}

// ======================================================
// RECENT ORDERS
// ======================================================

function renderRecentOrders() {

    const table =
        document.querySelector(
            "#recentOrdersTable tbody"
        );

    table.innerHTML = "";

    const latest =
        vendorOrders.slice(0,5);

    latest.forEach(order => {

        table.innerHTML += `

<tr>

<td>${order.id}</td>

<td>${order.customer_name || "Customer"}</td>

<td>${formatMoney(order.total_amount)}</td>

<td>

${statusBadge(order.status)}

</td>

</tr>

`;

    });

}

// ======================================================
// CHANGE STATUS
// ======================================================

async function changeOrderStatus(id,status){

    try{

        const result = await api(

            "/orders/"+id+"/status",

            "PUT",

            {

                status

            }

        );

        if(result.success){

            toast("Order updated.");

            loadOrders();

        }

        else{

            toast(result.message,"error");

        }

    }

    catch(error){

        console.log(error);

        toast("Server Error","error");

    }

}

// ======================================================
// DASHBOARD NUMBERS
// ======================================================

function calculateDashboard(){

    document.getElementById("totalOrders").innerHTML =
    vendorOrders.length;

    const pending =
        vendorOrders.filter(

            order=>order.status==="pending"

        ).length;

    document.getElementById("pendingOrders").innerHTML =
    pending;

    let sales = 0;

    vendorOrders.forEach(order=>{

        if(order.status==="delivered"){

            sales += Number(order.total_amount);

        }

    });

    document.getElementById("totalSales").innerHTML =
    formatMoney(sales);

}

// ======================================================
// INITIAL DATA LOAD
// ======================================================

document.addEventListener("DOMContentLoaded",async()=>{

    if(!checkLogin()){

        return;

    }

    loadVendorHeader();

    await loadProducts();

    await loadOrders();

    await loadDashboard();

}); 
// ======================================================
// PART 6 - PROFILE & EARNINGS
// ======================================================

// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile(){

    try{

        const result = await api("/vendors/profile");

        if(!result.success){

            return;

        }

        const vendor = result.vendor;

        document.getElementById("vendorName").innerHTML =
            vendor.store_name;

        document.getElementById("profileStoreName").value =
            vendor.store_name || "";

        document.getElementById("profileOwnerName").value =
            vendor.owner_name || "";

        document.getElementById("profileEmail").value =
            vendor.email || "";

        document.getElementById("profilePhone").value =
            vendor.phone || "";

        document.getElementById("profileLocation").value =
            vendor.location || "";

        document.getElementById("profileDescription").value =
            vendor.description || "";

    }

    catch(error){

        console.log(error);

    }

}

// ======================================================
// SAVE PROFILE
// ======================================================

document.getElementById("profileForm")
.addEventListener("submit",saveProfile);

async function saveProfile(e){

    e.preventDefault();

    const data={

        store_name:
        document.getElementById("profileStoreName").value,

        owner_name:
        document.getElementById("profileOwnerName").value,

        email:
        document.getElementById("profileEmail").value,

        phone:
        document.getElementById("profilePhone").value,

        location:
        document.getElementById("profileLocation").value,

        description:
        document.getElementById("profileDescription").value

    };

    try{

        const result=await api(

            "/vendors/profile",

            "PUT",

            data

        );

        if(result.success){

            toast("Profile updated.");

            loadProfile();

        }

        else{

            toast(result.message,"error");

        }

    }

    catch(error){

        console.log(error);

        toast("Server Error","error");

    }

}

// ======================================================
// LOAD EARNINGS
// ======================================================

async function loadEarnings(){

    let total=0;

    let pending=0;

    let withdrawn=0;

    vendorOrders.forEach(order=>{

        if(order.status==="delivered"){

            total+=Number(order.total_amount);

        }

        else if(

            order.status==="pending" ||

            order.status==="processing" ||

            order.status==="shipped"

        ){

            pending+=Number(order.total_amount);

        }

    });

    try{

        const result=await api(

            "/withdrawals/vendor"

        );

        if(result.success){

            withdrawn=result.totalWithdrawn || 0;

        }

    }

    catch(error){

        console.log(error);

    }

    document.getElementById("earnTotal").innerHTML=
        formatMoney(total);

    document.getElementById("earnPending").innerHTML=
        formatMoney(pending);

    document.getElementById("earnWithdrawn").innerHTML=
        formatMoney(withdrawn);

    renderEarningsTable();

}

// ======================================================
// EARNINGS TABLE
// ======================================================

function renderEarningsTable(){

    const table=
        document.getElementById(
            "earningsTableBody"
        );

    table.innerHTML="";

    if(vendorOrders.length===0){

        document.getElementById(
            "earningsEmpty"
        ).style.display="block";

        return;

    }

    document.getElementById(
        "earningsEmpty"
    ).style.display="none";

    vendorOrders.forEach(order=>{

        table.innerHTML+=`

<tr>

<td>

${order.id}

</td>

<td>

${formatDate(order.created_at)}

</td>

<td>

${formatMoney(order.total_amount)}

</td>

<td>

${statusBadge(order.status)}

</td>

</tr>

`;

    });

}

// ======================================================
// REFRESH PROFILE
// ======================================================

async function refreshProfile(){

    await loadProfile();

    await loadEarnings();

}  
// ======================================================
// PART 7 - UTILITIES & INITIALIZATION
// ======================================================

// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(amount){

    amount = Number(amount) || 0;

    return "KSh " + amount.toLocaleString();

}

// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date){

    if(!date){

        return "-";

    }

    return new Date(date).toLocaleDateString();

}

// ======================================================
// STATUS BADGE
// ======================================================

function statusBadge(status){

    return `<span class="badge badge-${status}">

        ${status.charAt(0).toUpperCase()+status.slice(1)}

    </span>`;

}

// ======================================================
// LOADING ROW
// ======================================================

function showLoading(tableId){

    document.getElementById(tableId).innerHTML=`

<tr>

<td colspan="10"

style="text-align:center;padding:40px;">

Loading...

</td>

</tr>

`;

}

// ======================================================
// EMPTY ROW
// ======================================================

function showEmpty(tableId,message){

    document.getElementById(tableId).innerHTML=`

<tr>

<td colspan="10"

style="text-align:center;padding:40px;">

${message}

</td>

</tr>

`;

}

// ======================================================
// TOAST
// ======================================================

function toast(message,type="success"){

    const toast=document.getElementById("toast");

    toast.innerHTML=message;

    toast.style.background=

        type==="error"

        ? "#e53935"

        : "#0b8f4d";

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}

// ======================================================
// CHECK LOGIN
// ======================================================

function checkLogin(){

    const token=

        localStorage.getItem("token");

    const user=

        JSON.parse(

            localStorage.getItem("user")

        );

    if(!token || !user){

        window.location.href="login.html";

        return false;

    }

    if(user.role!=="vendor"){

        window.location.href="login.html";

        return false;

    }

    return true;

}

// ======================================================
// LOGOUT
// ======================================================

document.getElementById("logoutBtn")

.addEventListener("click",logout);

function logout(e){

    e.preventDefault();

    if(

        !confirm("Logout?")

    ){

        return;

    }

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href="login.html";

}

// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(async()=>{

    if(checkLogin()){

        await loadDashboard();

        await loadProducts();

        await loadOrders();

        await loadEarnings();

    }

},60000);

// ======================================================
// INITIALIZE
// ======================================================

window.addEventListener(

    "load",

    async()=>{

        if(!checkLogin()){

            return;

        }

        try{

            await loadProfile();

            await loadDashboard();

            await loadProducts();

            await loadOrders();

            await loadEarnings();

        }

        catch(error){

            console.log(error);

        }

    }

);