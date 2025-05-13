function getAddLeadForm() {
  return `
    <h2>Add Lead</h2>
      <form id="add-lead-form" onsubmit="event.preventDefault(); saveLead()">
      <label for="leadName">Name:</label>
      <input type="text" id="leadName" name="leadName" required /><br />

      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required /><br />

      <label for="phone">Phone:</label>
      <input type="tel" id="phone" name="phone" required
            pattern="^[+]?[0-9]{10,15}$"
            title="Phone number must be 10 to 15 digits" /><br />

      <label for="source">Source:</label>
      <select id="source" name="source" required>
        <option value="">Select Source</option>
        <option value="INSTAGRAM">Instagram</option>
        <option value="FACEBOOK">Facebook</option>
        <option value="YOUTUBE">YouTube</option>
        <option value="REFERENCE">Reference</option>
      </select><br />

      <label for="status">Status:</label>
      <select id="status" name="status" required>
        <option value="">Select Status</option>
        <option value="NEW">New</option>
        <option value="CONTACTED">Contacted</option>
        <option value="CLOSED">Dropped</option>
      </select><br />

      <label for="budget">Budget (₹):</label>
      <input   id="budget" name="budget" /><br />

      <label for="requirement">Requirement:</label><br />
      <textarea id="requirement" name="requirement" rows="3" cols="40"></textarea><br />

      <label for="remark">Remark:</label><br />
      <textarea id="remark" name="remark" rows="3" cols="40"></textarea><br /><br />

      <button type="submit">Save Lead</button>
      <div id="loading" style="display:none;">Saving lead...</div>
    </form>

  `;
}



function getLeadTableTemplate() {
  return `
    <h2>View Leads</h2>
    <input
        type="text"
        id="leadSearch"
        class="search-box"
        placeholder="Search leads..."
        onkeyup="filterTable('leadTable', 'leadSearch')"
      />

    <div id="tableLoading" style="display: none;">Loading leads...</div>

    <div style="text-align: right; margin-bottom: 10px;">
      <button onclick="exportToExcelLead()">Export to Excel</button> <!-- Export Button -->
    </div>

    <table id="leadTable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Source</th>
          <th>Budget</th>
          <th>Requirement</th>
          <th>Remark</th>
          <th>Created By</th> <!-- Added Created By Column -->
          <th>Action</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
}



function exportToExcelLead() {
  const table = document.getElementById("leadTable");
  const rows = table.querySelectorAll("tr");
  const data = [];

  // Extract table headers
  const headers = Array.from(rows[0].querySelectorAll("th"))
    .filter(th => th.innerText.trim().toLowerCase() !== "action") // Ignore 'Action' header
    .map(th => th.innerText.trim());
  data.push(headers);

  // Extract table rows
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll("td"));
    const rowData = [];

    for (let j = 0; j < cells.length; j++) {
      const headerText = rows[0].querySelectorAll("th")[j].innerText.trim().toLowerCase();
      if (headerText !== "action") { // Skip cells where the header is 'Action'
        rowData.push(cells[j].innerText.trim());
      }
    }
    data.push(rowData);
  }

  // Convert data array to CSV string
  const csvContent = data.map(e => e.join(",")).join("\n");

  // Create a blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads_export.xls';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}








async function saveLead() {

const localUser = JSON.parse(localStorage.getItem("user") || "{}");
let userId = localUser.userId;
console.log(userId);
if (!userId) {
  customAlert("User ID not found. Please log in again.");
  return; // Prevent submitting the form if no user ID
}

const lead = {
  name: document.getElementById("leadName").value,
  email: document.getElementById("email").value,
  phone: document.getElementById("phone").value,
  source: document.getElementById("source").value,
  status: document.getElementById("status").value,
  budget: document.getElementById("budget").value,
  requirement: document.getElementById("requirement").value,
  remark: document.getElementById("remark").value,
  createdBy: userId // Add userId to the payload
};

console.log("Lead being sent:", lead); // Check this in the browser dev tools

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+]?[0-9]{10,15}$/;

// Validate input fields
if (!lead.name) return customAlert("Name is required.");
if (!emailRegex.test(lead.email)) return customAlert("Please enter a valid email address.");
if (!phoneRegex.test(lead.phone)) return customAlert("Phone number must be between 10 to 15 digits.");
if (!lead.source) return customAlert("Source is required.");
if (!lead.status) return customAlert("Status is required.");

const loading = document.getElementById("loading");
loading.style.display = "block";

try {
  const token = localStorage.getItem("token"); // Retrieve the token from localStorage (if using JWT)

  const response = await fetch("http://178.16.137.180:8080/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to save lead.");
  }

  customAlert("Lead saved successfully!");
  document.getElementById("add-lead-form").reset(); // Reset the form after successful save
} catch (error) {
  console.error("Save error:", error);
  customAlert("Error: " + error.message);
} finally {
  loading.style.display = "none";
}
}



async function loadLeads() {
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  let userId = localUser.userId;
  const loading = document.getElementById("tableLoading");
  loading.style.display = "block";

  try {
    const [assignedResponse, createdResponse] = await Promise.all([
      fetch(`http://178.16.137.180:8080/api/leads/assigned-to/${userId}`),
      fetch(`http://178.16.137.180:8080/api/leads/created-by/${userId}`)
    ]);

    if (!assignedResponse.ok || !createdResponse.ok) {
      throw new Error("Failed to load leads");
    }

    const assignedLeads = await assignedResponse.json();
    const createdLeads = await createdResponse.json();

    const allLeadsMap = new Map();
    [...assignedLeads, ...createdLeads].forEach(lead => {
      allLeadsMap.set(lead.leadId, lead);
    });

    const leads = Array.from(allLeadsMap.values());
    const tbody = document.querySelector("#leadTable tbody");

    const leadRows = await Promise.all(leads.map(async (lead) => {
      let createdByName = "N/A";
      try {
        const userResponse = await fetch(`http://178.16.137.180:8080/api/users/${lead.createdBy}/username`);
        if (userResponse.ok) {
          createdByName = await userResponse.text();
        } else {
          console.error(`Failed to load user for createdBy: ${lead.createdBy}`);
        }
      } catch (err) {
        console.error(`Error fetching user data for createdBy: ${lead.createdBy}`, err);
      }

      return `
       <tr>
          <td>${lead.name}</td>
          <td>${lead.phone}</td>
          <td>
            <select onchange="updateStatus(${lead.leadId}, this.value)">
              <option value="NEW" ${lead.status === "NEW" ? "selected" : ""}>NEW</option>
              <option value="CONTACTED" ${lead.status === "CONTACTED" ? "selected" : ""}>CONTACTED</option>
              <option value="CLOSED" ${lead.status === "CLOSED" ? "selected" : ""}>CLOSED</option>
            </select>
          </td>
          <td>${lead.source}</td>
          <td>${lead.budget || 'N/A'}</td>
          <td>${lead.requirement || 'N/A'}</td>
          <td>${lead.remark || 'N/A'}</td>
          <td>${createdByName}</td> <!-- Created By should come here -->
          <td>
            <button onclick='showUpdateLeadModal(${JSON.stringify(lead)})'>Update</button> <!-- Action -->
          </td>
        </tr>

      `;
    }));

    tbody.innerHTML = leadRows.join('');
  } catch (error) {
    console.error("Error:", error);
    customAlert("Failed to load leads: " + error.message);
  } finally {
    loading.style.display = "none";
  }
}








let currentLeadData = null; // to keep original data temporarily


function showUpdateLeadModal(lead) {
// Prevent multiple modals
const existingModal = document.querySelector('.modal');
if (existingModal) existingModal.remove();

const modalHtml = `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-content">
      <span class="close" onclick="document.querySelector('.modal').remove()" role="button" aria-label="Close">&times;</span>
      <h2>Update Lead</h2>
      <form id="updateLeadForm">
        <input type="hidden" id="updateLeadId" value="${lead.leadId}" />
        <label for="updateName">Name:</label>
        <input type="text" id="updateName" value="${lead.name}" placeholder="Name" required />

        <label for="updateEmail">Email:</label>
        <input type="email" id="updateEmail" value="${lead.email}" placeholder="Email" required />

        <label for="updatePhone">Phone:</label>
        <input type="tel" id="updatePhone" value="${lead.phone}" placeholder="Phone" required />

        <label for="updateSource">Source:</label>
        <select id="updateSource" required>
          <option value="INSTAGRAM" ${lead.source === "INSTAGRAM" ? "selected" : ""}>Instagram</option>
          <option value="FACEBOOK" ${lead.source === "FACEBOOK" ? "selected" : ""}>Facebook</option>
          <option value="YOUTUBE" ${lead.source === "YOUTUBE" ? "selected" : ""}>YouTube</option>
          <option value="REFERENCE" ${lead.source === "REFERENCE" ? "selected" : ""}>Reference</option>
        </select>

        <label for="updateStatus">Status:</label>
        <select id="updateStatus" required>
          <option value="NEW" ${lead.status === "NEW" ? "selected" : ""}>New</option>
          <option value="CONTACTED" ${lead.status === "CONTACTED" ? "selected" : ""}>Contacted</option>
          <option value="CLOSED" ${lead.status === "CLOSED" ? "selected" : ""}>Closed</option>
        </select>

        <label for="updateBudget">Budget (₹):</label>
        <input  id="updateBudget" value="${lead.budget}" placeholder="Budget"  />

        <label for="updateRequirement">Requirement:</label>
        <textarea id="updateRequirement" rows="3" cols="40">${lead.requirement}</textarea>

        <label for="updateRemark">Remark:</label>
        <textarea id="updateRemark" rows="3" cols="40">${lead.remark}</textarea>

        <button type="submit">Update Lead</button>
      </form>
    </div>
  </div>
`;

// Create and append the modal to the DOM
const wrapper = document.createElement("div");
wrapper.innerHTML = modalHtml;
document.body.appendChild(wrapper);

// Add event listener for the form submit
document.getElementById("updateLeadForm").addEventListener("submit", function (event) {
  event.preventDefault();
  submitUpdatedLead(); // Call the function to handle the update
});

// Optional: focus the first field
document.getElementById("updateName").focus();
}


function submitUpdatedLead() {
const leadId = document.getElementById("updateLeadId").value;
const name = document.getElementById("updateName").value;
const email = document.getElementById("updateEmail").value;
const phone = document.getElementById("updatePhone").value;
const source = document.getElementById("updateSource").value;
const status = document.getElementById("updateStatus").value;
const budget =document.getElementById("updateBudget").value;
const requirement = document.getElementById("updateRequirement").value;
const remark = document.getElementById("updateRemark").value;

const updatedLead = {
  name,
  email,
  phone,
  source,
  status,
  budget,
  requirement,
  remark,
};

fetch(`http://178.16.137.180:8080/api/leads/${leadId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(updatedLead),
})
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to update lead");
    }
    return response.json();
  })
  .then((data) => {
    customAlert("Lead updated successfully!");
    document.querySelector(".modal").remove();
    // flocation.reload(); // Uncomment if needed
  })
  .catch((error) => {
    console.error("Error updating lead:", error);
    customAlert("Error updating lead");
  });
}






async function updateStatus(leadId, newStatus) {
try {
    const response = await fetch(`http://178.16.137.180:8080/api/leads/${leadId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) throw new Error("Failed to update status");

    customAlert("Status updated successfully");
} catch (error) {
    console.error("Error:", error);
    customAlert("Failed to update status");
}
}
