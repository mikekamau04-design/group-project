const API = "http://localhost:5000/api";

async function api(endpoint, method = "GET", body = null) {

    const token = localStorage.getItem("token");

    const options = {

        method,

        headers: {}

    };

    if (token) {

        options.headers.Authorization =
            "Bearer " + token;

    }

    if (body) {

        options.headers["Content-Type"] =
            "application/json";

        options.body =
            JSON.stringify(body);

    }

    const response =
        await fetch(API + endpoint, options);

    return await response.json();

}