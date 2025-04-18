// Global variable to store current userId for context
let currentUserId = null;

function logout() {
  alert("Logged out successfully!");
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear the history to prevent going back
  window.history.replaceState(null, null, window.location.href);
  
  // Redirect to the login page or homepage
  window.location.href = "/pages/index.html";
}


function showSection(section) {
  const content = document.getElementById("content-area");

  switch (section) {
    case "addUser":
      content.innerHTML = `
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
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button type="submit">Create</button>
        </form>
      `;
      break;

    case "viewUsers":
      content.innerHTML = `
        <h2>View Users</h2>
        <input type="text" id="userSearch" class="search-box" placeholder="Search users..." onkeyup="filterTable('userTable', 'userSearch')" />
        <table id="userTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      `;
      loadUsers();
      break;

    case "addLead":
      content.innerHTML = `
        <h2>Add Lead</h2>
        <form onsubmit="event.preventDefault(); saveLead()">
          <input type="text" id="leadName" placeholder="Lead Name" required />
          <input type="email" id="email" placeholder="Email" required />
          <input type="text" id="phone" placeholder="Phone" required />
          <input type="text" id="source" placeholder="Source" required />
      
          <select id="status" required>
            <option value="">Select Status</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="UNASSIGNED">UNASSIGNED</option>
          </select>
      
          <select id="assignedTo" required>
            <option value="">Loading users...</option>
          </select>
      
          <button type="submit">Save Lead</button>
        </form>
      `;
      loadUsersToAssign();  // Load users to assign the lead to
      break;

    case "viewLeads":
      content.innerHTML = `
        <h2>View Leads</h2>
        <input type="text" id="leadSearch" class="search-box" placeholder="Search leads..." onkeyup="filterTable('leadTable', 'leadSearch')" />
        <table id="leadTable">
          <thead><tr><th>Name</th><th>Contact</th></tr></thead>
          <tbody></tbody>
        </table>
      `;
      loadLeads();
      break;

    default:
      content.innerHTML = `<p>Feature under construction...</p>`;
  }
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
    alert("Passwords do not match!");
    return;
  }

  fetch("http://localhost:8080/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  })
    .then(response => response.ok ? response.json() : response.json().then(err => { throw new Error(err.message || "Failed to create user"); }))
    .then(() => {
      alert("User created successfully!");
      form.reset();
    })
    .catch(err => {
      console.error(err);
      alert("Error: " + err.message);
    });
}

function loadUsers() {
  fetch("http://localhost:8080/api/users")
    .then(res => res.json())
    .then(users => {
      const tbody = document.querySelector("#userTable tbody");
      tbody.innerHTML = "";

      users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.phone}</td>
          <td>${user.role}</td>
          <td>
            <button onclick="showUpdateUserModal(${user.userId})">Update</button>
            <button onclick="deleteUser('${user.userId}')">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      alert("Failed to load users.");
    });
}

function loadUsersToAssign() {
  fetch("http://localhost:8080/api/users")
    .then(res => res.json())
    .then(users => {
      const select = document.getElementById("assignedTo");
      select.innerHTML = `<option value="">Select User</option>`; // Reset options
      users.forEach(user => {
        select.innerHTML += `<option value="${user.userId}">${user.name}</option>`;
      });
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      alert("Failed to load users for assignment.");
    });
}

function saveLead() {
  const name = document.getElementById("leadName").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const source = document.getElementById("source").value;
  const status = document.getElementById("status").value;
  const assignedTo = document.getElementById("assignedTo").value;

  const lead = {
    name,
    email,
    phone,
    source,
    status,
    assignedTo: assignedTo ? { userId: assignedTo } : null
  };

  fetch("http://localhost:8080/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("authToken")}`  // Include your token here
    },
    body: JSON.stringify(lead)
  })
    .then(response => {
      if (response.ok) {
        return response.json();  // Parse response as JSON if successful
      } else {
        return response.json().then(err => {
          alert("Error: " + (err.message || "Failed to save lead"));
        });
      }
    })
    .then(data => {
      alert("Lead saved successfully!");
      if (assignedTo) {
        loadUserDetails(assignedTo);  // Update user's assigned leads after assigning a lead
      }
    })
    .catch(err => {
      console.error(err);
      alert("Failed to save lead.");
    });
}


function loadUserDetails(userId) {
  fetch(`http://localhost:8080/api/leads/assigned-to/${userId}`)
    .then(response => response.json())
    .then(leads => {
      let userContent = `<h3>Assigned Leads</h3><ul>`;
      leads.forEach(lead => {
        userContent += `
          <li>
            <strong>${lead.name}</strong> - ${lead.email} | ${lead.phone} <br/>
            Status: ${lead.status} | Source: ${lead.source}
          </li>
        `;
      });
      userContent += `</ul>`;
      document.getElementById("userLeadsSection").innerHTML = userContent;
    })
    .catch(error => {
      console.error("Error loading assigned leads:", error);
    });
}

function filterTable(tableId, inputId) {
  const input = document.getElementById(inputId).value.toLowerCase();
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(input) ? "" : "none";
  });
}

function showUpdateUserModal(user) {
  currentUserId = user.userId; // Set the currentUserId
  
  // Creating the modal HTML dynamically with user data
  const modalHtml = `
    <div class="modal">
      <div class="modal-content">
        <span class="close" onclick="document.querySelector('.modal').remove()">&times;</span>
        <h2 style="text-align:center;">Update User</h2>
        <form onsubmit="event.preventDefault(); submitUpdatedUser()" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="hidden" id="updateUserId" value="${user.userId}" />
          <input type="text" id="updateName" placeholder="Name" value="${user.name}" required />
          <input type="email" id="updateEmail" placeholder="Email" value="${user.email}" required />
          <input type="text" id="updatePhone" placeholder="Phone" value="${user.phone}" required />
          <input type="password" id="updatePassword" placeholder="New Password" />
          <button type="submit">Update</button>
        </form>
      </div>
    </div>`;

  // Creating a wrapper element to insert the modal into the document
  const wrapper = document.createElement("div");
  wrapper.innerHTML = modalHtml;
  document.body.appendChild(wrapper);
}
