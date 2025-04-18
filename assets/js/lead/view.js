let leads = [];
let currentPage = 1;
const pageSize = 5;

async function fetchLeads() {
  const container = document.getElementById("leads");
  container.innerHTML = "<p>Loading leads...</p>";

  try {
    const response = await fetch("http://localhost:8080/api/leads");
    leads = await response.json();
    renderFilteredLeads();
  } catch (err) {
    container.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

function renderFilteredLeads() {
  const status = document.getElementById("statusFilter").value;
  const filtered = (status === "ALL") ? leads : leads.filter(l => l.status?.toUpperCase() === status);
  renderLeads(filtered);
}

function renderLeads(data) {
  const container = document.getElementById("leads");
  const start = (currentPage - 1) * pageSize;
  const paginated = data.slice(start, start + pageSize);

  if (paginated.length === 0) {
    container.innerHTML = "<p>No leads found.</p>";
    return;
  }

  const rows = paginated.map(lead => `
    <tr>
      <td>${lead.name}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td><span class="status ${lead.status?.toLowerCase()}">${lead.status}</span></td>
      <td>
        <button class="edit" onclick="editLead(${lead.leadId})">Edit</button>
        <button class="delete" onclick="deleteLead(${lead.leadId})">Delete</button>
      </td>
    </tr>
  `).join("");

  container.innerHTML = `
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.getElementById("pageInfo").innerText = `Page ${currentPage}`;
}

function editLead(id) {
  window.location.href = `/leads/edit.html?id=${id}`;
}

async function deleteLead(id) {
  if (confirm("Are you sure you want to delete this lead?")) {
    try {
      const res = await fetch(`http://localhost:8080/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        leads = leads.filter(l => l.leadId !== id);
        renderFilteredLeads();
        alert("Lead deleted successfully.");
      } else {
        alert("Failed to delete lead.");
      }
    } catch (err) {
      alert("Error deleting lead: " + err.message);
    }
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderFilteredLeads();
  }
}

function nextPage() {
  const status = document.getElementById("statusFilter").value;
  const filtered = (status === "ALL") ? leads : leads.filter(l => l.status?.toUpperCase() === status);
  if (currentPage < Math.ceil(filtered.length / pageSize)) {
    currentPage++;
    renderFilteredLeads();
  }
}

function exportCSV() {
  const status = document.getElementById("statusFilter").value;
  const filtered = (status === "ALL") ? leads : leads.filter(l => l.status?.toUpperCase() === status);

  let csv = "Name,Email,Phone,Status\n";
  filtered.forEach(l => {
    csv += `${l.name},${l.email},${l.phone},${l.status}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "leads.csv";
  link.click();
}

fetchLeads();