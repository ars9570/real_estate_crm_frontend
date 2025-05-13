document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("https://178.16.137.180:8080/api/users/login",
     {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const user = await response.json();

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(user));

      // Store individual fields for quick access
      localStorage.setItem("userId", user.id);
      localStorage.setItem("email", user.email);
      localStorage.setItem("role", user.role);

      console.log("User data:", user); // For debugging

      const role = (user.role || "").toUpperCase();

      if (role === "ADMIN") {
        window.location.href = "/pages/admin.html";
      } else if (role === "USER") {
        window.location.href = "pages/users.html";
      } else if (role === "DEVELOPER") {
        window.location.href = "pages/developer.html";
      } else {
        alert("Login successful, but no valid role was found.");
      }
    } else {
      const error = await response.text();
      alert("Login failed: " + error);
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Something went wrong. Please try again later.");
  }
});
