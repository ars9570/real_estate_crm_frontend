// --------- Function to generate the Add Note form ----------
function getAddNoteForm() {
  return `
    <form id="addNoteForm">
      <div>
        <label for="content">Content:</label><br>
        <textarea id="content" name="content" rows="4" cols="50" required></textarea>
      </div>

      <div>
        <label for="dateTime">Date & Time:</label><br>
        <input type="datetime-local" id="dateTime" name="dateTime" required>
      </div>

      <div>
        <label for="visibility">Visibility:</label><br>
        <select id="visibility" name="visibility" required>
          <option value="ONLY_ME">Only Me</option>
          <option value="ALL_USERS">All Users</option>
          <option value="SPECIFIC_USERS">Specific Users</option>
        </select>
      </div>

      <div id="specificUsersSection" style="display: none; margin-top: 10px;">
        <label>Select Specific Users:</label>
        <div id="userCheckboxes"></div>
      </div>

      <div style="margin-top: 15px;">
        <button type="submit">Add Note</button>
      </div>
    </form>
  `;
}

// --------- Function to set min date-time to current time ----------
function setMinDateTime() {
  const dateTimeInput = document.getElementById('dateTime');
  if (!dateTimeInput) {
    console.error("DateTime input not found!");
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  dateTimeInput.min = formattedDateTime;
}

// --------- Function to setup events after form is loaded ----------

function setupFormEvents() {
  const visibilitySelect = document.getElementById('visibility');
  const specificUsersSection = document.getElementById('specificUsersSection');
  const userCheckboxes = document.getElementById('userCheckboxes');
  const addNoteForm = document.getElementById('addNoteForm');

  if (!visibilitySelect || !specificUsersSection || !userCheckboxes || !addNoteForm) {
    console.error("Form elements not found, cannot set up events!");
    return;
  }

  visibilitySelect.addEventListener('change', async function () {
    if (this.value === 'SPECIFIC_USERS') {
      specificUsersSection.style.display = 'block';
      await loadUsersForNotes();  // load users when visible
    } else {
      specificUsersSection.style.display = 'none';
      userCheckboxes.innerHTML = ''; // clear if hidden
    }
  });

  addNoteForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    await saveNote(); // your existing save function
  });
}
async function loadUsersForNotes() {
  const userCheckboxes = document.getElementById('userCheckboxes');
  if (!userCheckboxes) {
    console.error("userCheckboxes div not found!");
    return;
  }

  try {
    const response = await fetch('http://178.16.137.180:8080/api/users/user-role'); // 🛠 Corrected URL
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);

    const users = await response.json();
    console.log('Loaded Users:', users);

    userCheckboxes.innerHTML = '';

    if (users.length === 0) {
      userCheckboxes.innerHTML = '<p>No users found.</p>';
      return;
    }

    users.forEach(user => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '8px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'specificUsers';
      checkbox.value = user.userId; // 🛠 Use correct property (userId from your database)
      checkbox.id = `user-${user.userId}`;

      const label = document.createElement('label');
      label.setAttribute('for', `user-${user.userId}`);
      label.textContent = user.name || 'Unnamed User';
      label.style.marginLeft = '8px';

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);

      userCheckboxes.appendChild(wrapper);
    });
  } catch (error) {
    console.error('Failed to load users:', error);
    userCheckboxes.innerHTML = '<p>Error loading users.</p>';
  }
}

async function saveNote() {
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = localUser.userId;

  if (!userId) {
    alert("User ID not found. Please log in again.");
    return;
  }

  const content = document.getElementById('content').value.trim();
  const dateTime = document.getElementById('dateTime').value;
  const visibility = document.getElementById('visibility').value;

  if (!content || !dateTime || !visibility) {
    alert("Please fill in all required fields.");
    return;
  }

  let visibleUserIds = [];
  const visibilityFormatted = visibility.toUpperCase().replace(/\s/g, '_');

  if (visibilityFormatted === 'SPECIFIC_USERS') {
    const checkedBoxes = document.querySelectorAll('input[name="specificUsers"]:checked');
    console.log('Total checkboxes:', document.querySelectorAll('input[name="specificUsers"]').length);
    console.log('Checked boxes:', checkedBoxes.length);

    visibleUserIds = Array.from(checkedBoxes)
      .map(cb => {
        if (cb.value === undefined || cb.value === null) {
          console.error('Checkbox has undefined value:', cb);
          return NaN;
        }
        const id = parseInt(cb.value);
        if (isNaN(id)) {
          console.error(`Invalid user ID: ${cb.value}`);
        }
        return id;
      })
      .filter(id => !isNaN(id));

    if (visibleUserIds.length === 0) {
      alert("Please select at least one specific user.");
      return;
    }
  }

  const noteData = {
    userId,
    content,
    dateTime,
    visibility: visibilityFormatted,
    visibleUserIds
  };

  console.log('Note Data:', noteData);

  try {
    const response = await fetch('http://178.16.137.180:8080/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Note saved:', result);
      alert('Note saved successfully!');
      document.getElementById('addNoteForm').reset();
      await loadNotes();
    } else {
      const errorText = await response.text();
      console.error('Error saving note:', errorText);
      alert(`Failed to save note: ${errorText}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong. Please try again later.');
  }
}

// --------- Function to return Notes Table Template ----------
function getNoteTableTemplate() {
  return `
    <div>
      <h2>All Notes</h2>
      
      <input type="text" id="searchNotesInput" placeholder="Search notes..." oninput="filterNotes()" style="margin-bottom: 10px; padding: 5px; width: 300px;">

      <table id="notesTable" border="1" cellspacing="0" cellpadding="8">
        <thead>
          <tr>
            <th>Content</th>
            <th>Scheduled Date & Time</th>
            <th>Created At</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody id="notesTableBody"></tbody>
      </table>
    </div>
  `;
}

function getNoteTableTemplate() {
  return `
    <div>
      <h2>All Notes</h2>
      
      <input type="text" id="searchNotesInput" placeholder="Search notes..." oninput="filterNotes()" style="margin-bottom: 10px; padding: 5px; width: 300px;">

      <table id="notesTable" border="1" cellspacing="0" cellpadding="8">
        <thead>
          <tr>
            <th>Content</th>
            <th>Scheduled Date & Time</th>
            <th>Created At</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody id="notesTableBody"></tbody>
      </table>
    </div>
  `;
}

function filterNotes() {
  const searchInput = document.getElementById('searchNotesInput').value.toLowerCase();
  const table = document.getElementById('notesTable');
  const rows = table.getElementsByTagName('tr');

  // Start from 1 to skip the header row
  for (let i = 1; i < rows.length; i++) {
    const contentCell = rows[i].getElementsByTagName('td')[0];
    const scheduledDateCell = rows[i].getElementsByTagName('td')[1];
    const createdAtCell = rows[i].getElementsByTagName('td')[2];
    const createdByCell = rows[i].getElementsByTagName('td')[3];

    if (contentCell && scheduledDateCell && createdAtCell && createdByCell) {
      const contentText = contentCell.textContent || contentCell.innerText;
      const scheduledDateText = scheduledDateCell.textContent || scheduledDateCell.innerText;
      const createdAtText = createdAtCell.textContent || createdAtCell.innerText;
      const createdByText = createdByCell.textContent || createdByCell.innerText;

      // Check if any of the columns match the search input
      if (
        contentText.toLowerCase().includes(searchInput) ||
        scheduledDateText.toLowerCase().includes(searchInput) ||
        createdAtText.toLowerCase().includes(searchInput) ||
        createdByText.toLowerCase().includes(searchInput)
      ) {
        rows[i].style.display = '';
      } else {
        rows[i].style.display = 'none';
      }
    }
  }
}




// --------- Function to load notes ----------
async function loadNotes() {
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = localUser.userId;

  if (!userId) {
    alert("User ID not found. Please log in again.");
    return;
  }

  const userNotesUrl = `http://178.16.137.180:8080/api/notes/user/${userId}`;
  const publicNotesUrl = `http://178.16.137.180:8080/api/notes/public-and-admin`;
  const getUsernameUrl = id => `http://178.16.137.180:8080/api/users/${id}/username`;

  try {
    // Fetch both user notes and public/admin notes at the same time
    const [userNotesResponse, publicNotesResponse] = await Promise.all([
      fetch(userNotesUrl),
      fetch(publicNotesUrl)
    ]);

    if (!userNotesResponse.ok || !publicNotesResponse.ok) {
      throw new Error('Failed to fetch notes.');
    }

    const userNotes = await userNotesResponse.json();
    const publicNotes = await publicNotesResponse.json();

    // Merge both arrays and remove duplicates (by note.id)
    const allNotesMap = new Map();
    userNotes.forEach(note => allNotesMap.set(note.id, note));
    publicNotes.forEach(note => allNotesMap.set(note.id, note));
    let allNotes = Array.from(allNotesMap.values());

    // Sort notes by createdAt (latest first)
    allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Fetch usernames for unique user IDs
    const uniqueUserIds = [...new Set(allNotes.map(note => note.userId).filter(id => id !== null))];
    const userIdToUsername = {};

    await Promise.all(uniqueUserIds.map(async id => {
      try {
        const res = await fetch(getUsernameUrl(id));
        userIdToUsername[id] = res.ok ? await res.text() : 'Unknown';
      } catch {
        userIdToUsername[id] = 'Unknown';
      }
    }));

    // Update table
    const tableBody = document.getElementById('notesTableBody');
    if (!tableBody) {
      console.error("notesTableBody not found!");
      return;
    }

    tableBody.innerHTML = '';

    // Format time function to show hours and minutes only
    const formatTime = (date) => {
      if (!date) return '-';
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(date).toLocaleTimeString([], options);
    };

    // If no notes, show message
    if (allNotes.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4">No notes available.</td></tr>`;
      return;
    }

    // Loop through notes and create rows
    allNotes.forEach(note => {
      const createdBy = userIdToUsername[note.userId] || 'Unknown';
      const row = `
        <tr>
          <td>${note.content}</td>
          <td>${note.dateTime ? new Date(note.dateTime).toLocaleDateString() + ' ' + formatTime(note.dateTime) : '-'}</td>
          <td>${note.createdAt ? new Date(note.createdAt).toLocaleDateString() + ' ' + formatTime(note.createdAt) : '-'}</td>
          <td>${createdBy}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });

  } catch (error) {
    console.error('Error loading notes:', error);
    const tableBody = document.getElementById('notesTableBody');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="4">Error loading notes.</td></tr>`;
    }
  }
}
