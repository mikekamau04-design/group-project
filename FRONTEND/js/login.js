document
.getElementById("loginForm")
.addEventListener("submit", loginUser);

async function loginUser(e){

    e.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const role =
        document.getElementById("role").value.toLowerCase();

    const message =
        document.getElementById("message");

    message.style.color = "red";
    message.innerHTML = "Logging in...";

    try{

        const result = await api(

            "/auth/login",

            "POST",

            {
                email,
                password
            }

        );

        if(!result.success){

            message.innerHTML =
                result.message;

            if(result.requiresVerification){

                message.innerHTML +=
                    ' <a href="#" id="resendFromLogin" style="color:#0b8f4d">Resend code</a>';

                document
                    .getElementById("resendFromLogin")
                    .addEventListener("click", async (ev) => {

                        ev.preventDefault();

                        message.style.color = "green";
                        message.innerHTML = "Sending a new code...";

                        try{

                            const resendResult = await api(
                                "/auth/resend-verification",
                                "POST",
                                { email: result.email || email }
                            );

                            message.style.color = resendResult.success ? "green" : "red";
                            message.innerHTML = resendResult.message;

                        }

                        catch(err){

                            console.error(err);

                            message.style.color = "red";
                            message.innerHTML = "Cannot connect to server.";

                        }

                    });

            }

            return;

        }

        // Check the selected role matches the account role
        if(result.user.role.toLowerCase() !== role){

            message.innerHTML =
                "This account is not registered as " + role;

            return;

        }

        // Save login information
        localStorage.setItem(

            "token",

            result.token

        );

        localStorage.setItem(

            "user",

            JSON.stringify(result.user)

        );

        message.style.color = "green";
        message.innerHTML = "Login successful. Redirecting...";

        setTimeout(() => {

            switch(role){

                case "admin":

                    window.location.href = "admin/admin.html";
                    break;

                case "vendor":

                    window.location.href = "vendor-dashboard.html";
                    break;

                case "customer":

                    window.location.href = "customer-dashboard-modern.html";
                    break;

                default:

                    window.location.href = "index.html";
                    break;

            }

        },1000);

    }

    catch(error){

        console.error(error);

        message.style.color = "red";
        message.innerHTML = "Cannot connect to server.";

    }

}