// HTML Generator for Add Property Form
function getAddPropertyForm() {
    return `
    <h2>Add Property</h2>
    <form id="addPropertyForm" onsubmit="saveProperty(event)">
        <div>
            <label for="propertyName">Property Name:</label>
            <input type="text" id="propertyName" name="propertyName" required>
        </div>
        <div>
            <label for="type">Type:</label>
            <select id="type" name="type" required>
                <option value="Commercial">Commercial</option>
                <option value="Residential">Residential</option>
            </select>
        </div>
        <div>
           <label for="bhk">BHK:</label>
            <input type="text" id="bhk" name="bhk" placeholder="e.g., 2BHK" required />

        </div>
        <div>
            <label for="size">Size (sqft):</label>
            <input type="number" id="size" name="size" required>
        </div>
        <div>
            <label for="ownerName">Owner Name:</label>
            <input type="text" id="ownerName" name="ownerName" required>
        </div>
        <div>
            <label for="ownerContact">Owner Contact:</label>
            <input type="text" id="ownerContact" name="ownerContact" required>
        </div>
        <div>
            <label for="price">Price:</label>
            <input  id="price" name="price" required>
        </div>
        <div>
            <label for="status">Status:</label>
            <select id="status" name="status" required>
                <option value="AVAILABLE_FOR_SALE">Available for Sale</option>
                <option value="AVAILABLE_FOR_RENT">Available for Rent</option>
                <option value="RENT_OUT">Rent Out</option>
                <option value="SOLD_OUT">Sold Out</option>
            </select>
        </div>
        <div>
            <label for="sector">Sector:</label>
            <input type="text" id="sector" name="sector" required>
        </div>
        <div>
            <label for="source">Source:</label>
            <select id="source" name="source" required>
                <option value="Social Media">Social Media</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Project Call">Project Call</option>
                <option value="Reference">Reference</option>
            </select>
        </div>
        <div>
            <label for="remark">Remark:</label>
            <textarea id="remark" name="remark"></textarea>
        </div>
        <div>
            <button type="submit">Save Property</button>
        </div>
    </form>
    `;
}


function getPropertyTableTemplate() {
    return `
      <h2>View Properties</h2>
      <input
        type="text"
        id="propertySearch"
        class="search-box"
        placeholder="Search properties..."
        onkeyup="filterTable('propertyTable', 'propertySearch')"
      />
  
      <div id="propertyTableLoading" style="display: none;">Loading properties...</div>
       <div style="text-align: right; margin-bottom: 10px;">
        <button onclick="exportToExcelProperty()">Export to Excel</button> <!-- Export Button -->
      </div>
  
      <table id="propertyTable">
        <thead>
          <tr>
            <th>Title</th>
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
  }


  function exportToExcelProperty() {
    const table = document.getElementById("propertyTable");
    const rows = table.querySelectorAll("tr");
  
    let excelData = "<table border='1'>";
  
    rows.forEach((row, rowIndex) => {
      excelData += "<tr>";
      const cells = row.querySelectorAll("th, td");
  
      cells.forEach((cell, cellIndex) => {
        // Skip the column if it contains "Action" (header) or if it's the last column (assumes Action is last)
        if (
          cell.innerText.trim().toLowerCase() === "action" ||
          cellIndex === cells.length - 1
        ) {
          return;
        }
        excelData += `<td>${cell.innerText}</td>`;
      });
  
      excelData += "</tr>";
    });
  
    excelData += "</table>";
  
    const blob = new Blob([excelData], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Properties.xls";
    link.click();
  }
  
  
  


// Save Property to backend
async function saveProperty(event) {
    event.preventDefault();
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    let userId = localUser.userId;
    if (!userId) return customAlert("User not logged in");

    const property = {
        propertyName: document.getElementById("propertyName").value,
        type: document.getElementById("type").value,
        bhk: document.getElementById("bhk").value,
        size: document.getElementById("size").value,
        ownerName: document.getElementById("ownerName").value,
        ownerContact: document.getElementById("ownerContact").value,
        price: document.getElementById("price").value,
        status: document.getElementById("status").value,
        sector: document.getElementById("sector").value,
        source: document.getElementById("source").value,
        remark: document.getElementById("remark").value,
        createdBy: userId,
    };

   
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (!phoneRegex.test(property.ownerContact)) return customAlert("Invalid contact number");

    try {
        const response = await fetch("http://178.16.137.180:8080/api/properties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(property)
        });
        if (!response.ok) throw new Error("Save failed");
        customAlert("Property saved successfully");
        document.getElementById("addPropertyForm").reset();
        loadProperty();
    } catch (error) {
        customAlert(`Error: ${error.message}`);
    }
}




async function loadProperty() {

    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    let userId = localUser.userId;

    const tableBody = document.querySelector("#propertyTable tbody");
    tableBody.innerHTML = "";

    try {
        const response = await fetch(`http://178.16.137.180:8080/api/properties/created-by/${userId}`);
        const properties = await response.json();

        for (const property of properties) {
            try {
                const userResponse = await fetch(`http://178.16.137.180:8080/api/users/${property.createdBy}/username`);
                const createdByName = userResponse.ok ? await userResponse.text() : "Unknown";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${property.propertyName}</td>
                    <td>${property.type}</td>
                    <td>${property.bhk}</td>
                    <td>${property.size}</td>
                    <td>${property.ownerName}</td>
                    <td>${property.ownerContact}</td>
                    <td>${property.price}</td>
                    <td>${property.status}</td>
                    <td>${property.sector}</td>
                    <td>${property.source}</td>
                    <td>${property.remark}</td>
                    <td>${createdByName}</td>
                    <td>
                        <button onclick='showUpdatePropertyModal(${JSON.stringify(property)})'>Edit</button>
                        <button onclick="deleteProperty(${property.propertyId})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            } catch (error) {
                console.error("Error loading user for property:", error);
            }
        }
    } catch (error) {
        console.error("Error loading properties:", error);
    }
}

// Edit property form
async function editProperty(propertyId) {
    try {
        const res = await fetch(`http://178.16.137.180:8080/api/properties/${propertyId}`);
        if (!res.ok) throw new Error("Property not found");
        const prop = await res.json();
        showUpdatePropertyModal(prop);
    } catch (err) {
        customAlert(err.message);
    }
}
// Show modal to update property
function showUpdatePropertyModal(property) {
    document.querySelector('.modal')?.remove();

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="document.querySelector('.modal').remove()">&times;</span>
            <h2>Update Property</h2>
            <form id="updatePropertyForm">
                <input type="hidden" id="updatePropertyId" value="${property.propertyId}" />

                <label for="updatePropertyName">Property Name:</label>
                <input type="text" id="updatePropertyName" value="${property.propertyName}" required />

                <label for="updateType">Type:</label>
                <select id="updateType">
                    <option value="Commercial" ${property.type === 'Commercial' ? 'selected' : ''}>Commercial</option>
                    <option value="Residential" ${property.type === 'Residential' ? 'selected' : ''}>Residential</option>
                </select>
                 <label for="bhk">BHK:</label>
                <input type="text" id="bhk" name="bhk" placeholder="e.g., 2BHK" required />

                <label for="updatePrice">Price:</label>
                <input type="text" id="updatePrice" value="${property.price}" required />

                <label for="updateSector">Sector:</label>
                <input type="text" id="updateSector" value="${property.sector}" required />

                <label for="updateStatus">Status:</label>
                <select id="updateStatus">
                    <option value="AVAILABLE_FOR_SALE" ${property.status === 'AVAILABLE_FOR_SALE' ? 'selected' : ''}>Available for Sale</option>
                    <option value="AVAILABLE_FOR_RENT" ${property.status === 'AVAILABLE_FOR_RENT' ? 'selected' : ''}>Available for Rent</option>
                    <option value="RENT_OUT" ${property.status === 'RENT_OUT' ? 'selected' : ''}>Rent Out</option>
                    <option value="SOLD_OUT" ${property.status === 'SOLD_OUT' ? 'selected' : ''}>Sold Out</option>
                </select>

                <label for="updateSource">Source:</label>
                <select id="updateSource">
                    <option value="Social Media" ${property.source === 'Social Media' ? 'selected' : ''}>Social Media</option>
                    <option value="Cold Call" ${property.source === 'Cold Call' ? 'selected' : ''}>Cold Call</option>
                    <option value="Project Call" ${property.source === 'Project Call' ? 'selected' : ''}>Project Call</option>
                    <option value="Reference" ${property.source === 'Reference' ? 'selected' : ''}>Reference</option>
                </select>

                <label for="updateRemark">Remark:</label>
                <textarea id="updateRemark">${property.remark}</textarea>

                <button type="submit">Update Property</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("updatePropertyForm").addEventListener("submit", (e) => {
        e.preventDefault();
        submitUpdatedProperty(property.propertyId);
    });
}

// Submit updated property to backend
async function submitUpdatedProperty(propertyId) {
    const updated = {
        propertyName: document.getElementById("updatePropertyName").value,
        type: document.getElementById("updateType").value,
        bhk: document.getElementById("bhk").value.trim(), // ✅ Correct for text input like "2BHK"
        price: document.getElementById("updatePrice").value,
        sector: document.getElementById("updateSector").value,
        status: document.getElementById("updateStatus").value,
        source: document.getElementById("updateSource").value,
        remark: document.getElementById("updateRemark").value
    };

    try {
        const res = await fetch(`http://178.16.137.180:8080/api/properties/${propertyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
        });

        if (!res.ok) throw new Error("Update failed");

        customAlert("Property updated successfully");
        document.querySelector(".modal").remove();
        loadProperty();
    } catch (err) {
        customAlert("Error: " + err.message);
    }
}



// Delete property
async function deleteProperty(propertyId) {
    if (!confirm("Delete this property?")) return;
    try {
        const res = await fetch(`http://178.16.137.180:8080/api/properties/${propertyId}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Delete failed");
        customAlert("Property deleted");
        loadProperty();
    } catch (err) {
        customAlert(err.message);
    }
}
