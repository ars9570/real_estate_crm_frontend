let leads = [];

async function fetchLeads() {
  try {
    const res = await fetch("http://localhost:8080/api/leads");
    leads = await res.json();
    populateLeadCheckboxes();
  } catch (err) {
    showToast("Error loading leads", true);
  }
}

function populateLeadCheckboxes() {
  const box = document.getElementById("leadCheckboxes");
  leads.forEach(lead => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("checkbox-item");
    wrapper.innerHTML = `
      <input type="checkbox" id="lead_${lead.leadId}" value="${lead.leadId}">
      <label for="lead_${lead.leadId}">${lead.name} (${lead.email})</label>
    `;
    box.appendChild(wrapper);
  });
}

async function updateBatchStatus() {
  const selectedIds = Array.from(document.querySelectorAll('#leadCheckboxes input:checked'))
    .map(cb => parseInt(cb.value));

  const newStatus = document.getElementById("statusSelect").value;

  if (!selectedIds.length || !newStatus) {
    showToast("Please select at least one lead and a new status.", true);
    return;
  }

  try {
    for (let id of selectedIds) {
      const lead = leads.find(l => l.leadId === id);
      if (!lead) continue;

      lead.status = newStatus;

      await fetch(`http://localhost:8080/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });
    }

    showToast("Lead statuses updated successfully.");
    document.querySelectorAll("#leadCheckboxes input:checked").forEach(cb => cb.checked = false);
    document.getElementById("statusSelect").value = "";
  } catch (err) {
    showToast("Failed to update statuses.", true);
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