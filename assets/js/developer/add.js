function customcustomAlert(message) {
  const customAlertBox = document.getElementById("custom-customAlert");
  const customAlertMessage = document.getElementById("custom-customAlert-message");
  customAlertMessage.innerText = message;
  customAlertBox.classList.remove("hidden");
}

function closeCustomcustomAlert() {
  document.getElementById("custom-customAlert").classList.add("hidden");
}

function getDashboard() {
  return `
    <h2>Dashboard Overview</h2>
    <p>Welcome to the Developer dashboard.</p>
  `;
}

function getAddUserForm() {
  return `
    <h2>Add User</h2>
    <form id="userForm" onsubmit="createUser(event)">
      <label>Name:</label>
      <input type="text" name="name" required>
      <label>Email:</label>
      <input type="email" name="email" required>
      <label>Phone:</label>
      <input type="text" name="phone" required>
      <label>Password:</label>
      <input type="password" name="password" required>
      <label>Confirm Password:</label>
      <input type="password" name="confirmPassword" required>
      <label>Role:</label>
      <select name="role" required>
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <button type="submit">Create</button>
    </form>
  `;
}

function getUsers() {
  return `
    <h2>Users</h2>
    <input type="text" id="userSearch" onkeyup="filterTable('userTable', 'userSearch')" placeholder="Search users...">
    <table id="userTable" border="1">
      <thead>
        <tr>
          <th>User ID</th>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
}

function getAdmins() {
  return `
    <h2>Admins</h2>
    <input type="text" id="adminSearch" onkeyup="filterTable('adminTable', 'adminSearch')" placeholder="Search admins...">
    <table id="adminTable" border="1">
      <thead>
        <tr>
          <th>Admin ID</th>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
}

function createUser(event) {
  event.preventDefault();
  const form = document.getElementById("userForm");
  const formData = new FormData(form);

  const user = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role")
  };

  if (user.password !== user.confirmPassword) {
    customcustomAlert("Passwords do not match!");
    return;
  }

  fetch("http://178.16.137.180:8080/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  })
    .then(response =>
      response.ok
        ? response.json()
        : response.json().then(err => {
            throw new Error(err.message || "Failed to create user");
          })
    )
    .then(() => {
      customcustomAlert("User created successfully!");
      form.reset();
    })
    .catch(err => {
      console.error(err);
      customcustomAlert("Error: " + err.message);
    });
}

function loadUsers() {
  fetch("http://178.16.137.180:8080/api/users")
    .then(res => res.json())
    .then(users => {
      const userList = users.filter(user => user.role === "USER");
      const tbody = document.querySelector("#userTable tbody");
      tbody.innerHTML = "";
      userList.forEach(user => {
        const row = `
          <tr>
            <td>${user.userId}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    })
    .catch(err => console.error("Error loading users:", err));
}

function LoadAdmin() {
  fetch("http://178.16.137.180:8080/api/users")
    .then(res => res.json())
    .then(users => {
      const admins = users.filter(user => user.role === "ADMIN");
      const tbody = document.querySelector("#adminTable tbody");
      tbody.innerHTML = "";
      admins.forEach(admin => {
        const row = `
          <tr>
            <td>${admin.userId}</td>
            <td>${admin.name}</td>
            <td>${admin.email}</td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    })
    .catch(err => console.error("Error loading admins:", err));
}

function getAccount() {
  const user = JSON.parse(localStorage.getItem("user"));
  return `
    <h2>My Account</h2>
    <p><strong>Name:</strong> ${user.name}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> ${user.role}</p>
  `;
}

function getLogOut() {
  return `
    <h2>Logging Out...</h2>
    <p>You will be redirected shortly.</p>
  `;
}
