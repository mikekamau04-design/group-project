const form = document.getElementById("registerForm");

form.addEventListener("submit", registerUser);

async function registerUser(e) {

    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();

    const fullname = firstName + " " + lastName;

    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const role = document.getElementById("accountType").value;

    const shopName = document.getElementById("shopName").value.trim();

    const county = document.getElementById("county").value;

    const address = document.getElementById("address").value.trim();

    const password = document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const terms = document.getElementById("terms").checked;

    const message = document.getElementById("message");

    message.style.color = "red";

    // Password check
    if (password !== confirmPassword) {

        message.innerHTML = "Passwords do not match.";

        return;

    }

    if (!terms) {

        message.innerHTML = "Please accept the Terms and Conditions.";

        return;

    }

    message.innerHTML = "Creating account...";

    try {

        const result = await api(

            "/auth/register",

            "POST",

            {

                fullname,

                email,

                password,

                phone,

                role,

                shopName,

                county,

                address

            }

        );

        if (!result.success) {

            message.innerHTML = result.message;

            return;

        }

        message.style.color = "green";

        message.innerHTML =
            "Registration successful. Check your email for a verification code.";

        // Reveal the verification form and hide the registration form
        registeredEmail = email;

        document.getElementById("registerForm").style.display = "none";

        document.getElementById("verifyForm").style.display = "block";

    }

    catch (error) {

        console.log(error);

        message.innerHTML =
            "Cannot connect to the server.";

    }

}

let registeredEmail = "";

document
    .getElementById("verifyForm")
    .addEventListener("submit", verifyEmailCode);

async function verifyEmailCode(e) {

    e.preventDefault();

    const code = document.getElementById("verifyCode").value.trim();

    const verifyMessage = document.getElementById("verifyMessage");

    verifyMessage.style.color = "red";
    verifyMessage.innerHTML = "Verifying...";

    try {

        const result = await api(
            "/auth/verify-email",
            "POST",
            {
                email: registeredEmail,
                code
            }
        );

        if (!result.success) {

            verifyMessage.innerHTML = result.message;

            return;

        }

        verifyMessage.style.color = "green";

        verifyMessage.innerHTML =
            "Email verified! Redirecting to login...";

        setTimeout(() => {

            window.location.href = "login.html";

        }, 1500);

    }

    catch (error) {

        console.log(error);

        verifyMessage.innerHTML =
            "Cannot connect to the server.";

    }

}

document
    .getElementById("resendLink")
    .addEventListener("click", async (e) => {

        e.preventDefault();

        const verifyMessage = document.getElementById("verifyMessage");

        verifyMessage.style.color = "green";
        verifyMessage.innerHTML = "Sending a new code...";

        try {

            const result = await api(
                "/auth/resend-verification",
                "POST",
                {
                    email: registeredEmail
                }
            );

            verifyMessage.style.color = result.success ? "green" : "red";
            verifyMessage.innerHTML = result.message;

        }

        catch (error) {

            console.log(error);

            verifyMessage.style.color = "red";
            verifyMessage.innerHTML = "Cannot connect to the server.";

        }

    });