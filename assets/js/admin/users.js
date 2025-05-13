// user.js

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

  function getUserTableTemplate() {
    return `
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
      customAlert("Passwords do not match!");
      return;
    }
  
    fetch("http://178.16.137.180:8080/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    })
      .then(response => response.ok ? response.json() : response.json().then(err => { throw new Error(err.message || "Failed to create user"); }))
      .then(() => {
        customAlert("User created successfully!");
        form.reset();
      })
      .catch(err => {
        console.error(err);
        customAlert("Error: " + err.message);
      });
  }
  function loadUsers() {
    fetch("http://178.16.137.180:8080/api/users")
        .then(res => res.json())
        .then(users => {
            const filteredUsers = users.filter(user => user.role === "USER"); // Filter only USERS
            const tbody = document.querySelector("#userTable tbody");
            tbody.innerHTML = "";

            filteredUsers.forEach(user => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>
                        <button onclick="openUserPopup('${user.userId}', '${user.name.replace(/'/g, "\\'")}')"
                            class="no-underline">
                            ${user.name}
                        </button>
                    </td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.role}</td>
                    <td>
                        <button onclick='showUpdateUserModal(${JSON.stringify(user)})'>Update</button>
                        <button onclick="deleteUser('${user.userId}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => console.error("Error loading users:", err));
}

function openUserPopup(userId, userName) {
  const customPopup = `
      <div id="customPopup" style="position: fixed; top: 30%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 30px; border: 1px solid #ccc; border-radius: 8px; z-index: 9999; box-shadow: 0 0 10px rgba(0,0,0,0.5); max-width:400px;">
          <h3>Hi ${userName} 👋</h3>
          <p>Select an action:</p>
          <button onclick="UloadLeads('${userId}')" style="margin: 10px;">View Leads</button>
          <button onclick="UloadProperties('${userId}')" style="margin: 10px;">View Properties</button>
          <br><br>
          <button onclick="closeCustomPopup()" style="color: red;">Close</button>
      </div>
      <div id="overlay" style="position: fixed;top:0;left:0;width:100%;height:100%;background: rgba(0,0,0,0.5);z-index:9998;" onclick="closeCustomPopup()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', customPopup);
}

function closeCustomPopup() {
  const popup = document.getElementById('customPopup');
  const overlay = document.getElementById('overlay');
  if (popup) popup.remove();
  if (overlay) overlay.remove();
}

// NEW FUNCTIONS FOR FETCHING LEADS AND PROPERTIES

async function UloadLeads(userId) {
  try {
    const [assignedResponse, createdResponse] = await Promise.all([
      fetch(`http://178.16.137.180:8080/api/leads/assigned-to/${userId}`),
      fetch(`http://178.16.137.180:8080/api/leads/created-by/${userId}`)
    ]);

    if (!assignedResponse.ok || !createdResponse.ok) {
      throw new Error("Failed to fetch leads");
    }

    const assignedLeads = await assignedResponse.json();
    const createdLeads = await createdResponse.json();

    // Function to fetch createdBy usernames
    async function enrichLeads(leads) {
      return Promise.all(leads.map(async (lead) => {
        let createdByName = "N/A";
        try {
          const userResponse = await fetch(`http://178.16.137.180:8080/api/users/${lead.createdBy}/username`);
          if (userResponse.ok) {
            createdByName = await userResponse.text();
          }
        } catch (err) {
          console.error(`Error fetching user for createdBy ${lead.createdBy}`, err);
        }
        return { ...lead, createdByName };
      }));
    }

    const enrichedAssignedLeads = await enrichLeads(assignedLeads);
    const enrichedCreatedLeads = await enrichLeads(createdLeads);

    // Generate table rows
    const generateLeadRows = (leads) => {
      return leads.map(lead => `
        <tr>
          <td>${lead.name}</td>
          <td>${lead.phone}</td>
          <td>${lead.status}</td>
          <td>${lead.source || 'N/A'}</td>
          <td>${lead.budget || 'N/A'}</td>
          <td>${lead.requirement || 'N/A'}</td>
          <td>${lead.remark || 'N/A'}</td>
          <td>${lead.createdByName}</td>
        </tr>
      `).join('');
    };

    const leadContent = `
      <h3>Leads for User</h3>

      <h4>Assigned Leads (${enrichedAssignedLeads.length})</h4>
      <table border="1" cellpadding="5" cellspacing="0" style="width:100%; margin-bottom: 20px;">
        <thead>
          <tr>
            <th>Name</th><th>Phone</th><th>Status</th><th>Source</th><th>Budget</th>
            <th>Requirement</th><th>Remark</th><th>Created By</th>
          </tr>
        </thead>
        <tbody>
          ${generateLeadRows(enrichedAssignedLeads)}
        </tbody>
      </table>

      <h4>Created Leads (${enrichedCreatedLeads.length})</h4>
      <table border="1" cellpadding="5" cellspacing="0" style="width:100%;">
        <thead>
          <tr>
            <th>Name</th><th>Phone</th><th>Status</th><th>Source</th><th>Budget</th>
            <th>Requirement</th><th>Remark</th><th>Created By</th>
          </tr>
        </thead>
        <tbody>
          ${generateLeadRows(enrichedCreatedLeads)}
        </tbody>
      </table>
    `;

    openCustomPopupWithContent(leadContent);
  } catch (err) {
    console.error("Error loading leads:", err);
    alert("Failed to load leads.");
  }
}

async function UloadProperties(userId) {
  try {
      const response = await fetch(`http://178.16.137.180:8080/api/properties/created-by/${userId}`);
      const properties = await response.json();

      const rows = await Promise.all(properties.map(async (property) => {
          let createdByName = "Unknown";
          try {
              const userResponse = await fetch(`http://178.16.137.180:8080/api/users/${property.createdBy}/username`);
              if (userResponse.ok) {
                  createdByName = await userResponse.text();
              }
          } catch (error) {
              console.error("Error fetching createdBy username:", error);
          }

          return `
              <tr>
                  <td>${property.propertyName || 'N/A'}</td>
                  <td>${property.type || 'N/A'}</td>
                  <td>${property.bhk || 'N/A'}</td>
                  <td>${property.size || 'N/A'}</td>
                  <td>${property.ownerName || 'N/A'}</td>
                  <td>${property.ownerContact || 'N/A'}</td>
                  <td>${property.price || 'N/A'}</td>
                  <td>${property.status || 'N/A'}</td>
                  <td>${property.sector || 'N/A'}</td>
                  <td>${property.source || 'N/A'}</td>
                  <td>${property.remark || 'N/A'}</td>
                  <td>${createdByName}</td>
              </tr>
          `;
      }));

      const propertyContent = `
          <h3>Properties Created (${properties.length})</h3>
          <div style="overflow-x:auto;">
              <table border="1" cellpadding="5" cellspacing="0" style="width:100%; font-size: 14px;">
                  <thead>
                      <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>BHK</th>
                          <th>Size</th>
                          <th>Owner Name</th>
                          <th>Owner Contact</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Sector</th>
                          <th>Source</th>
                          <th>Remark</th>
                          <th>Created By</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${rows.join('')}
                  </tbody>
              </table>
          </div>
      `;

      openCustomPopupWithContent(propertyContent);

  } catch (error) {
      console.error("Error loading properties:", error);
  }
}


function openCustomPopupWithContent(contentHtml) {
  closeCustomPopup(); // Always close old popup if still open

  const customPopup = `
      <div id="customPopup" style="position: fixed; top: 20%; left: 50%; transform: translate(-50%, 0); background: #fff; padding: 30px; border: 1px solid #ccc; border-radius: 8px; z-index: 9999; box-shadow: 0 0 10px rgba(0,0,0,0.5); max-width:600px; overflow:auto; max-height:70%;">
          ${contentHtml}
          <br><br>
          <button onclick="closeCustomPopup()" style="color: red;">Close</button>
      </div>
      <div id="overlay" style="position: fixed;top:0;left:0;width:100%;height:100%;background: rgba(0,0,0,0.5);z-index:9998;" onclick="closeCustomPopup()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', customPopup);
}




  
  function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
  
    fetch(`http://178.16.137.180:8080/api/users/${id}`, {
      method: "DELETE"
    })
      .then(() => loadUsers())
      .catch(error => {
        customAlert("Error deleting user: " + error.message);
      });
  }
  function showUpdateUserModal(user) {
    // Prevent multiple modals
    const existingModal = document.querySelector('.modal');
    if (existingModal) existingModal.remove();
  
    currentUserId = user.userId;
  
    const modalHtml = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-content">
          <span class="close" onclick="document.querySelector('.modal').remove()" role="button" aria-label="Close">&times;</span>
          <h2>Update User</h2>
          <form id="updateUserForm">
            <input type="hidden" id="updateUserId" value="${user.userId}" />
            <input type="text" id="updateName" value="${user.name}" placeholder="Name" required />
            <input type="email" id="updateEmail" value="${user.email}" placeholder="Email" required />
            <input type="text" id="updatePhone" value="${user.phone}" placeholder="Phone" required />
            <input type="password" id="updatePassword" placeholder="New Password (optional)" />
            <label for="updateRole">Role:</label>
            <select id="updateRole" name="role" required>
              <option value="USER" ${user.role === "USER" ? "selected" : ""}>USER</option>
              <option value="ADMIN" ${user.role === "ADMIN" ? "selected" : ""}>ADMIN</option>
            </select>
            <button type="submit">Update</button>
          </form>
        </div>
      </div>
    `;
  
    const wrapper = document.createElement("div");
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper);
  
    // Add event listener for the form submit
    document.getElementById("updateUserForm").addEventListener("submit", function (event) {
      event.preventDefault();
      submitUpdatedUser();
    });
  
    // Optional: focus the first field
    document.getElementById("updateName").focus();
  }
  
  function submitUpdatedUser() {
    const userId = document.getElementById("updateUserId").value;
    const name = document.getElementById("updateName").value;
    const email = document.getElementById("updateEmail").value;
    const phone = document.getElementById("updatePhone").value;
    const password = document.getElementById("updatePassword").value;
    const role = document.getElementById("updateRole").value;
  
    const updatedUser = {
      name,
      email,
      phone,
      role,
    };
  
    if (password.trim() !== "") {
      updatedUser.password = password;
    }
  
    fetch(`http://178.16.137.180:8080/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedUser),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update user");
        }
        return response.json();
      })
      .then((data) => {
        customAlert("User updated successfully!");
        document.querySelector(".modal").remove(); // Close modal
        fetchUsers(); // Refresh the user list
      })
      .catch((error) => {
        console.error("Error updating user:", error);
        customAlert("Error updating user");
      });
  }
  