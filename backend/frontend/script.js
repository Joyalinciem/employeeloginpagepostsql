const API_URL = "http://localhost:5000/api";
async function registerUser() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    document.getElementById("message").innerText = data.message;
}

// Login
async function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.token) {
        localStorage.setItem("token", data.token);
        document.getElementById("loginMessage").innerText = "Login successful";
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("loginMessage").innerText = data.message;
    }
}

// Protected Dashboard
async function loadDashboard() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/dashboard`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();
    document.getElementById("dashboardData").innerText = data.message || data.message;
}

// Logout
function logoutUser() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}