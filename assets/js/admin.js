async function showDetails(type) {
    const details = document.getElementById('details');

    if (type === 'users') {
      details.innerHTML = `<h2>Loading users...</h2>`;

      try {
        const response = await fetch('http://localhost:8080/api/users');
        const users = await response.json();

        if (!Array.isArray(users)) {
          throw new Error("Invalid response format");
        }

        // Filter users with role "EMPLOYEE" (uppercase)
        const employeeUsers = users.filter(user => user.role === "EMPLOYEE");

        let tableRows = employeeUsers.map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
          </tr>
        `).join('');

        details.innerHTML = `
          <h2>Manage Employees</h2>
          ${employeeUsers.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>` : `<p>No employees found.</p>`}
        `;
      } catch (error) {
        console.error('Error fetching users:', error);
        details.innerHTML = `
          <h2>Error Loading Users</h2>
          <p>${error.message}</p>
        `;
      }
    } else if (type === 'properties') {
      details.innerHTML = `
        <h2>Manage Properties</h2>
        <p>Here you can view, update, or remove property listings.</p>
      `;
    }
  }