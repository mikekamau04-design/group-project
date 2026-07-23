// ======================================================
// AFRICART ADMIN DASHBOARD JAVASCRIPT
// PART 1
// ======================================================


// ======================================================
// CHECK LOGIN
// ======================================================

const token = localStorage.getItem("token");

const user = JSON.parse(
    localStorage.getItem("user")
);


if(!token || !user){

    window.location.href = "login.html";

}


// Only admin allowed

if(user.role !== "admin"){

    alert("Access denied. Admins only.");

    window.location.href = "index.html";

}





// ======================================================
// API REQUEST FUNCTION
// ======================================================


async function apiRequest(url, method="GET", data=null){

    try{


        const options = {

            method,

            headers:{

                "Content-Type":"application/json",

                "Authorization":
                `Bearer ${token}`

            }

        };


        if(data){

            options.body =
            JSON.stringify(data);

        }



        const response =
        await fetch(
            "http://localhost:5000/api" + url,
            options
        );



        const result =
        await response.json();



        return result;



    }

    catch(error){

        console.log(error);


        return {

            success:false,

            message:"Server connection failed"

        };


    }


}





// ======================================================
// ADMIN HEADER
// ======================================================


function loadAdminProfile(){


    const name =
    document.getElementById("adminName");


    if(name){

        name.innerHTML =
        user.fullname || "Administrator";

    }


}





// ======================================================
// PAGE NAVIGATION
// ======================================================


document
.querySelectorAll("[data-page]")
.forEach(button=>{


    button.addEventListener(
        "click",
        ()=>{


            const page =
            button.dataset.page;



            openPage(page);


        }
    );


});




document
.querySelectorAll(".menu a")
.forEach(link=>{


    link.addEventListener(
        "click",
        e=>{


            e.preventDefault();


            const page =
            link.dataset.target;



            if(page){

                openPage(page);

            }


        }

    );


});





function openPage(page){



    document
    .querySelectorAll(".section")
    .forEach(section=>{


        section.classList.remove(
            "active"
        );


    });



    const target =
    document.getElementById(page);



    if(target){

        target.classList.add(
            "active"
        );

    }



    document
    .querySelectorAll(".menu a")
    .forEach(link=>{


        link.classList.remove(
            "active"
        );


        if(link.dataset.target===page){

            link.classList.add(
                "active"
            );

        }


    });


}







// ======================================================
// LOGOUT
// ======================================================


const logout =
document.getElementById("logoutBtn");



if(logout){


logout.addEventListener(
"click",
()=>{


    localStorage.removeItem("token");

    localStorage.removeItem("user");


    window.location.href =
    "login.html";


});


}





// ======================================================
// TOAST MESSAGE
// ======================================================


function showToast(message){


    const toast =
    document.getElementById("toast");



    if(!toast)return;



    toast.innerHTML =
    message;



    toast.classList.add(
        "show"
    );



    setTimeout(()=>{


        toast.classList.remove(
            "show"
        );


    },2500);



}





// ======================================================
// START DASHBOARD
// ======================================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    loadAdminProfile();


    loadDashboard();


});

// ======================================================
// ADMIN DASHBOARD STATISTICS
// PART 2
// ======================================================



async function loadDashboard(){


    const result =
    await apiRequest(
        "/admin/dashboard"
    );



    if(!result.success){

        console.log(
            "Dashboard error:",
            result.message
        );

        return;

    }



    const data =
    result.data || result;



    // USERS

    const users =
    document.getElementById(
        "totalUsers"
    );


    if(users){

        users.innerHTML =
        data.users || 0;

    }





    // VENDORS


    const vendors =
    document.getElementById(
        "totalVendors"
    );


    if(vendors){

        vendors.innerHTML =
        data.vendors || 0;

    }





    // PRODUCTS


    const products =
    document.getElementById(
        "totalProducts"
    );


    if(products){

        products.innerHTML =
        data.products || 0;

    }





    // ORDERS


    const orders =
    document.getElementById(
        "totalOrders"
    );


    if(orders){

        orders.innerHTML =
        data.orders || 0;

    }





    // REVENUE


    const revenue =
    document.getElementById(
        "totalRevenue"
    );



    if(revenue){


        revenue.innerHTML =
        "KSh " +
        Number(
            data.revenue || 0
        )
        .toLocaleString();


    }




    loadRecentOrders();


}









// ======================================================
// LOAD RECENT ORDERS
// ======================================================


async function loadRecentOrders(){


    const result =
    await apiRequest(
        "/orders/admin"
    );



    if(!result.success){

        return;

    }



    const orders =
    result.orders || [];



    const table =
    document.querySelector(
        "#recentOrdersTable tbody"
    );



    if(!table)return;



    table.innerHTML = "";



    orders
    .slice(0,5)
    .forEach(order=>{


        table.innerHTML += `

        <tr>


        <td>

        ${order.id}

        </td>



        <td>

        ${order.customer || "Customer"}

        </td>



        <td>

        KSh ${Number(order.total || 0)
        .toLocaleString()}

        </td>



        <td>

        <span class="badge">

        ${order.status}

        </span>

        </td>


        </tr>


        `;


    });



}









// ======================================================
// LOAD USERS
// ======================================================


async function loadUsers(){



    const result =
    await apiRequest(
        "/admin/users"
    );



    if(!result.success){

        showToast(
            result.message
        );

        return;

    }



    const users =
    result.users || [];



    const table =
    document.getElementById(
        "usersTableBody"
    );



    if(!table)return;



    table.innerHTML="";



    users.forEach(user=>{


        table.innerHTML += `


        <tr>


        <td>

        ${user.id}

        </td>


        <td>

        ${user.fullname}

        </td>



        <td>

        ${user.email}

        </td>



        <td>

        ${user.role}

        </td>



        <td>


        <button 
        class="btn btn-danger btn-sm"
        onclick="deleteUser(${user.id})">

        Delete

        </button>


        </td>


        </tr>



        `;


    });



}

// ======================================================
// VENDOR MANAGEMENT
// PART 3
// ======================================================

async function loadVendors(){

    const result = await apiRequest(
        "/admin/vendors"
    );

    if(!result.success){

        showToast(result.message);

        return;

    }

    const vendors = result.vendors || [];

    const table =
    document.getElementById(
        "vendorsTableBody"
    );

    if(!table) return;

    table.innerHTML = "";

    vendors.forEach(vendor=>{

        table.innerHTML += `

        <tr>

            <td>${vendor.id}</td>

            <td>${vendor.fullname}</td>

            <td>${vendor.email}</td>

            <td>${vendor.phone || "-"}</td>

            <td>${vendor.status || "Active"}</td>

            <td>

                <button
                class="btn btn-primary btn-sm"
                onclick="approveVendor(${vendor.id})">

                Approve

                </button>

                <button
                class="btn btn-danger btn-sm"
                onclick="deleteVendor(${vendor.id})">

                Delete

                </button>

            </td>

        </tr>

        `;

    });

}



// ======================================================
// APPROVE VENDOR
// ======================================================

async function approveVendor(id){

    if(!confirm("Approve this vendor?")){

        return;

    }

    const result =
    await apiRequest(
        "/admin/vendors/" + id + "/approve",
        "PUT"
    );

    showToast(result.message);

    loadVendors();

    loadDashboard();

}



// ======================================================
// DELETE VENDOR
// ======================================================

async function deleteVendor(id){

    if(!confirm("Delete this vendor?")){

        return;

    }

    const result =
    await apiRequest(
        "/admin/vendors/" + id,
        "DELETE"
    );

    showToast(result.message);

    loadVendors();

    loadDashboard();

}



// ======================================================
// PRODUCT MANAGEMENT
// ======================================================

async function loadProducts(){

    const result =
    await apiRequest(
        "/products"
    );

    if(!result.success){

        return;

    }

    const products =
    result.products || [];

    const table =
    document.getElementById(
        "productsTableBody"
    );

    if(!table) return;

    table.innerHTML = "";

    products.forEach(product=>{

        table.innerHTML += `

        <tr>

            <td>${product.id}</td>

            <td>${product.name}</td>

            <td>${product.vendor}</td>

            <td>KSh ${Number(product.price).toLocaleString()}</td>

            <td>${product.stock}</td>

            <td>

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
// DELETE PRODUCT
// ======================================================

async function deleteProduct(id){

    if(!confirm("Delete this product?")){

        return;

    }

    const result =
    await apiRequest(
        "/products/" + id,
        "DELETE"
    );

    showToast(result.message);

    loadProducts();

    loadDashboard();

}// ======================================================
// ORDER MANAGEMENT
// PART 4
// ======================================================



const orderStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
];




// ======================================================
// LOAD ALL ORDERS
// ======================================================


async function loadOrders(){


    const result =
    await apiRequest(
        "/admin/orders"
    );


    if(!result.success){

        showToast(
            result.message
        );

        return;

    }



    const orders =
    result.orders || [];



    const table =
    document.getElementById(
        "ordersTableBody"
    );



    if(!table)return;



    table.innerHTML="";



    orders.forEach(order=>{


        table.innerHTML += `

        <tr>


        <td>

        ${order.id}

        </td>



        <td>

        ${order.customer || "Customer"}

        </td>



        <td>

        KSh ${Number(order.total || 0)
        .toLocaleString()}

        </td>



        <td>

        ${order.date || "-"}

        </td>



        <td>


        <select 
        class="status-select"
        onchange="updateOrderStatus(${order.id},this.value)">


        ${orderStatuses.map(status=>`

            <option value="${status}"

            ${status===order.status 
            ?"selected":""}>

            ${status}

            </option>


        `).join("")}


        </select>


        </td>


        </tr>


        `;


    });


}







// ======================================================
// UPDATE ORDER STATUS
// ======================================================


async function updateOrderStatus(
    id,
    status
){


    const result =
    await apiRequest(

        "/orders/"+id+"/status",

        "PUT",

        {
            status
        }

    );



    showToast(
        result.message
    );



    loadOrders();

    loadDashboard();


}









// ======================================================
// EARNINGS REPORT
// ======================================================


async function loadEarnings(){



    const result =
    await apiRequest(
        "/admin/earnings"
    );



    if(!result.success){

        return;

    }




    const data =
    result.data || result;



    const revenue =
    document.getElementById(
        "adminRevenue"
    );



    const sales =
    document.getElementById(
        "totalSales"
    );



    if(revenue){

        revenue.innerHTML =
        "KSh " +
        Number(
            data.revenue || 0
        )
        .toLocaleString();

    }



    if(sales){

        sales.innerHTML =
        "KSh " +
        Number(
            data.sales || 0
        )
        .toLocaleString();

    }



}









// ======================================================
// REFRESH ALL ADMIN DATA
// ======================================================


async function refreshAdmin(){


    await loadDashboard();

    await loadUsers();

    await loadVendors();

    await loadProducts();

    await loadOrders();

    await loadEarnings();


}







// ======================================================
// AUTO LOAD WHEN PAGE OPENS
// ======================================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    refreshAdmin();


});

// ======================================================
// ADMIN SEARCH FUNCTIONS
// PART 5
// ======================================================


// ======================================================
// SEARCH TABLE
// ======================================================


function searchTable(inputId, tableId){


    const input =
    document.getElementById(inputId);



    const table =
    document.getElementById(tableId);



    if(!input || !table){

        return;

    }



    input.addEventListener(
    "keyup",
    ()=>{


        const value =
        input.value.toLowerCase();



        const rows =
        table
        .querySelectorAll("tr");



        rows.forEach(row=>{


            const text =
            row.innerText.toLowerCase();



            if(text.includes(value)){

                row.style.display="";

            }

            else{

                row.style.display="none";

            }



        });



    });



}






// ======================================================
// ADMIN PROFILE
// ======================================================


async function loadAdminProfileData(){


    const result =
    await apiRequest(
        "/admin/profile"
    );



    if(!result.success){

        return;

    }



    const admin =
    result.admin;



    if(document.getElementById("adminFullname")){

        document.getElementById(
            "adminFullname"
        ).value =
        admin.fullname || "";

    }



    if(document.getElementById("adminEmail")){


        document.getElementById(
            "adminEmail"
        ).value =
        admin.email || "";


    }



}





// ======================================================
// UPDATE ADMIN PROFILE
// ======================================================


const adminProfileForm =
document.getElementById(
    "adminProfileForm"
);



if(adminProfileForm){


adminProfileForm.addEventListener(
"submit",
async e=>{


    e.preventDefault();



    const data={


        fullname:
        document.getElementById(
            "adminFullname"
        ).value,



        email:
        document.getElementById(
            "adminEmail"
        ).value


    };




    const result =
    await apiRequest(

        "/admin/profile",

        "PUT",

        data

    );



    showToast(
        result.message
    );



});


}









// ======================================================
// IMAGE PREVIEW
// ======================================================


function imagePreview(
inputId,
imageId
){


    const input =
    document.getElementById(
        inputId
    );


    const image =
    document.getElementById(
        imageId
    );



    if(!input || !image){

        return;

    }



    input.addEventListener(
    "change",
    ()=>{


        const file =
        input.files[0];



        if(file){


            image.src =
            URL.createObjectURL(
                file
            );


        }


    });



}








// ======================================================
// ERROR HANDLER
// ======================================================


window.addEventListener(
"offline",
()=>{


    showToast(
        "No internet connection"
    );


});



window.addEventListener(
"online",
()=>{


    showToast(
        "Connection restored"
    );


});








// ======================================================
// FINAL ADMIN STARTUP
// ======================================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    loadAdminProfile();

    loadAdminProfileData();


    // tables search

    searchTable(
        "userSearch",
        "usersTableBody"
    );


    searchTable(
        "vendorSearch",
        "vendorsTableBody"
    );


    searchTable(
        "productSearch",
        "productsTableBody"
    );


    searchTable(
        "orderSearch",
        "ordersTableBody"
    );



});