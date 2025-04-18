let leads = [];

async function fetchLeads() {
  const container = document.getElementById("leadCheckboxes");
  try {
    const res = await fetch("http://localhost:8080/api/leads");
    leads = await res.json();

    if (leads.length === 0) {
      container.innerHTML = "<p>No leads found.</p>";
      return;
    }

    container.innerHTML = "";
    leads.forEach(lead => {
      const div = document.createElement("div");
      div.classList.add("checkbox-item");
      div.innerHTML = `
        <input type="checkbox" id="lead_${lead.leadId}" value="${lead.leadId}">
        <label for="lead_${lead.leadId}">${lead.name} - ${lead.email} [${lead.status}]</label>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "<p>Error loading leads.</p>";
  }
}

async function deleteSelected() {
  const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  if (selectedIds.length === 0) {
    showToast("No leads selected for deletion", true);
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${selectedIds.length} lead(s)?`);
  if (!confirmed) return;

  try {
    for (let id of selectedIds) {
      await fetch(`http://localhost:8080/api/leads/${id}`, {
        method: "DELETE"
      });
    }
    showToast("Selected leads deleted.");
    fetchLeads();
  } catch (err) {
    showToast("Error deleting leads.", true);
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.className = "toast show" + (isError ? " error" : "");
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

fetchLeads();