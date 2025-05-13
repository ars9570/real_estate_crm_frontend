
document.addEventListener('DOMContentLoaded', function () {
    const localUser = JSON.parse(localStorage.getItem("user"));
  
    if (!localUser || !localUser.userId) {
      custemAlert("Please log in to continue.");
      window.location.href = "/login.html";
      return;
    }
  
    // 🔁 Fetch latest user from backend
    fetch(`http://178.16.137.180:8080/api/users/${localUser.userId}`)
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch user data.");
        return response.json();
      })
      .then(user => {
        // ✅ Update UI
        const userName = document.getElementById("userName");
        const userRole = document.getElementById("userRole");
        const avatarPreview = document.getElementById("avatarPreview");
  
        userName.textContent = user.name || "Default Name";
        userRole.textContent = user.role || "Default Role";
  
        // Fetch the avatar image
        fetchAvatar(user.userId);
  
        // ✅ Save updated user to localStorage
        localStorage.setItem("user", JSON.stringify(user));
      })
      .catch(error => {
        console.error("Error fetching user:", error);
        custemAlert("Failed to load user data. Please try again.");
      });
  
    // ✅ Menu item highlight
    const menuItems = document.querySelectorAll('.nav-links button');
    menuItems.forEach(item => {
      item.addEventListener('click', function () {
        menuItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
      });
    });
  
    // ✅ Search functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') {
        console.log('Searching for:', this.value);
      }
    });
  });
  
  // ✅ Fetch Avatar by User ID
  function fetchAvatar(userId) {
    fetch(`http://178.16.137.180:8080/api/users/${userId}/avatar`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to fetch avatar.");
        }
        return response.blob(); // Convert the response to a blob (binary data)
      })
      .then(imageBlob => {
        // Create an object URL for the image blob and set it as the source of the avatar preview
        const imageUrl = URL.createObjectURL(imageBlob);
        document.getElementById("avatarPreview").src = imageUrl;
      })
      .catch(error => {
        console.error("Error fetching avatar:", error);
        document.getElementById("avatarPreview").src = "assets/default-avatar.png"; // Fallback image
      });
  }
  
  // ✅ Avatar Upload Functionality
  const avatarInput = document.getElementById("avatarInput");
  const avatarPreview = document.getElementById("avatarPreview");
  
  avatarPreview.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.userId) {
      custemAlert("Please log in to upload your avatar.");
      return;
    }
    avatarInput.click();
  });
  
  avatarInput.addEventListener("change", function () {
    const file = this.files[0];
    const user = JSON.parse(localStorage.getItem("user"));
  
    if (!user || !user.userId) {
      custemAlert("Please log in to upload your avatar.");
      return;
    }
  
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        avatarPreview.src = e.target.result; // Update preview with selected image
      };
      reader.readAsDataURL(file);
  
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("avatarName", file.name);
  
      // Upload the avatar
      fetch(`http://178.16.137.180:8080/api/users/${user.userId}/upload-avatar`, {
        method: "POST",
        body: formData
      })
        .then(response => {
          if (!response.ok) throw new Error("Upload failed");
          return response.text();
        })
        .then(message => {
          custemAlert(message || "Avatar uploaded successfully!");
  
          // 🔁 Fetch updated user with new avatar after upload
          return fetch(`http://178.16.137.180:8080/api/users/${user.userId}`);
        })
        .then(response => response.json())
        .then(updatedUser => {
          // Update avatar preview with the new avatar
          fetchAvatar(updatedUser.userId); // Fetch updated avatar
  
          // Save updated user to localStorage
          localStorage.setItem("user", JSON.stringify(updatedUser));
        })
        .catch(error => {
          custemAlert("Error uploading avatar: " + error.message);
        });
    } else {
      avatarPreview.src = "assets/default-avatar.png"; // Set to default image if no file selected
    }
  });


  
  function showSection(section) {
    const content = document.getElementById("dashboard-stats");
  
    switch (section) {
      case "ViewDashboard":
        content.innerHTML = getDashboard();
        break;
  
      case "AddAdmin":
        content.innerHTML = getAddUserForm();
        break;

      case "ViewAdmins":
        content.innerHTML = getAdmins();
        LoadAdmin();
        break;
  
      case "ViewUsers":
        content.innerHTML = getUsers();
        loadUsers();
        break;
      case "ViewAccount":
        content.innerHTML = getAccount();
        LoadAccount();
        break;
  
      case "logout":
        content.innerHTML = getLogOut();
        logout();
        break;
  
      default:
        content.innerHTML = `<p>Feature under construction...</p>`;
    }
  }
  
  function filterTable(tableId, inputId) {
    const input = document.getElementById(inputId).value.toLowerCase();
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(input) ? "" : "none";
    });
  }
  
 

  function getLogOut() {
    return `<div class="logout-message"><h2>Logging Out...</h2><p>You will be redirected shortly.</p></div>`;
  }
  
  function logout() {
    localStorage.removeItem("user");
    setTimeout(() => window.location.href = "/index.html", 1500);
  }
  