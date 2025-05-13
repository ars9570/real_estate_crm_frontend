// Function to generate the Add Note form in center
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
          <option value="ME_AND_ADMIN">Me and Admin</option>
        </select>
      </div>

      <div id="specificUsersSection" style="display: none;">
        <label for="visibleUserIds">Visible to (User IDs, comma separated):</label><br>
        <input type="text" id="visibleUserIds" name="visibleUserIds" placeholder="e.g., 1,2,3">
      </div>

      <div>
        <button  onclick type="submit">Add Note</button>
      </div>
    </form>
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






async function saveNote() {

  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
let userId = localUser.userId;
console.log(userId);
if (!userId) {
  customAlert("User ID not found. Please log in again.");
  return; // Prevent submitting the form if no user ID
}
  const content = document.getElementById('content').value;
  const dateTime = document.getElementById('dateTime').value;
  const visibility = document.getElementById('visibility').value;
  const visibleUserIdsInput = document.getElementById('visibleUserIds').value;

  const visibleUserIds = visibleUserIdsInput
    ? visibleUserIdsInput.split(',').map(id => parseInt(id.trim()))
    : [];

  const noteData = {
    userId:userId,
    content: content,
    dateTime: dateTime,
    visibility: visibility,
    visibleUserIds: visibleUserIds
  };

  try {
    const response = await fetch('http://178.16.137.180:8080/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Note saved successfully:', result);
      alert('Note saved successfully!');
    } else {
      const errorText = await response.text();
      console.error('Error saving note:', errorText);
      alert('Failed to save note.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong.');
  }
}

async function loadNotes() {
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  let userId = localUser.userId;
  console.log(userId);

  if (!userId) {
    customAlert("User ID not found. Please log in again.");
    return;
  }

  const userNotesUrl = `http://178.16.137.180:8080/api/notes/user/${userId}`;
  const visibleNotesUrl = `http://178.16.137.180:8080/api/notes/visible-to/${userId}`;
  const publicNotesUrl = `http://178.16.137.180:8080/api/notes/public`;
  const getUsernameUrl = (userId) => `http://178.16.137.180:8080/api/users/${userId}/username`;

  try {
    // Fetch user notes, visible notes, and public notes together
    const [userNotesResponse, visibleNotesResponse, publicNotesResponse] = await Promise.all([
      fetch(userNotesUrl),
      fetch(visibleNotesUrl),
      fetch(publicNotesUrl)
    ]);

    const userNotes = await userNotesResponse.json();
    const visibleNotes = await visibleNotesResponse.json();
    const publicNotes = await publicNotesResponse.json();

    // Merge notes without duplicates
    const allNotesMap = new Map();
    userNotes.forEach(note => allNotesMap.set(note.id, note));
    visibleNotes.forEach(note => allNotesMap.set(note.id, note));
    publicNotes.forEach(note => allNotesMap.set(note.id, note));

    let allNotes = Array.from(allNotesMap.values());

    // ✅ Sort by createdAt (latest first)
    allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get unique userIds from notes
    const uniqueUserIds = [...new Set(allNotes.map(note => note.userId))];

    // Fetch usernames for all userIds
    const userIdToUsername = {};

    await Promise.all(uniqueUserIds.map(async (id) => {
      if (id !== null) {
        try {
          const res = await fetch(getUsernameUrl(id));
          userIdToUsername[id] = res.ok ? await res.text() : 'Unknown User';
        } catch {
          userIdToUsername[id] = 'Unknown User';
        }
      }
    }));

    // Render notes into the table
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

    if (allNotes.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4">No notes available.</td></tr>`;
      return;
    }

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
