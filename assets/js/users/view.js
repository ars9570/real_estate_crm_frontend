const API_URL = "http://localhost:8080/api/users";

function fetchAndRenderUsers() {
    fetch(API_URL)
        .then(response => response.json())
        .then(users => {
            const tbody = document.querySelector("#userTable tbody");
            tbody.innerHTML = "";

            // Filter only EMPLOYEES
            const employees = users.filter(user => user.role === "EMPLOYEE");

            employees.forEach(user => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${user.name || '-'}</td>
                    <td>${user.email || '-'}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${user.role || '-'}</td>
                    <td>
                        <button class="btn btn-edit" onclick="editUser(${user.userId})">Edit</button>
                        <button class="btn btn-delete" onclick="deleteUser(${user.userId})">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            document.getElementById("error").textContent = "Error fetching users: " + error.message;
        });
}

// Add employee

// Delete user
function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    })
    .then(() => fetchAndRenderUsers())
    .catch(error => {
        document.getElementById("error").textContent = "Error deleting user: " + error.message;
    });
}

// Edit user (simple prompt-based)
function editUser(id) {
    fetch(`${API_URL}/${id}`)
        .then(response => response.json())
        .then(user => {
            const name = prompt("Edit name:", user.name);
            const email = prompt("Edit email:", user.email);
            const phoneNumber = prompt("Edit phone number:", user.phoneNumber);

            if (name && email && phoneNumber) {
                const updatedUser = { ...user, name, email, phoneNumber };

                fetch(API_URL, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedUser)
                })
                .then(() => fetchAndRenderUsers())
                .catch(error => {
                    document.getElementById("error").textContent = "Error updating user: " + error.message;
                });
            }
        });
}

// Search/filter
document.getElementById("searchInput").addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#userTable tbody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
});

// Initial load
fetchAndRenderUsers();