document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        const user = await response.json();
  
        // Save user data (optional)
        localStorage.setItem("user", JSON.stringify(user));
  
        const role = (user.role || "").toUpperCase();
  
        if (role === "ADMIN") {
          window.location.href = "admin.html";
        } else if (role === "EMPLOYEE") {
          window.location.href = "employee.html";
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
  