async function getDashboard() {
  try {
    // Fetch all leads
    const leadsResponse = await fetch('http://178.16.137.180:8080/api/leads');
    if (!leadsResponse.ok) throw new Error('Failed to fetch leads');
    const leads = await leadsResponse.json();
    const totalLeads = leads.length;

    // Fetch all properties
    const propertiesResponse = await fetch('http://178.16.137.180:8080/api/properties');
    if (!propertiesResponse.ok) throw new Error('Failed to fetch properties');
    const properties = await propertiesResponse.json();
    const totalProperties = properties.length;

    // Filter leads with CLOSED status for deals closed
    const dealsClosed = leads.filter(lead => lead.status === 'CLOSED').length;

    // Return the updated dashboard HTML
    return `
      <div class="stat">
        <div class="stat-card">
          <h3>Total Leads</h3>
          <div class="number">${totalLeads}</div>
        </div>
        <div class="stat-card">
          <h3>Property Listed</h3>
          <div class="number">${totalProperties}</div>
        </div>
        <div class="stat-card">
          <h3>Deals Closed</h3>
          <div class="number">${dealsClosed}</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return `
      <div class="stat">
        <div class="stat-card">
          <h3>Total Leads</h3>
          <div class="number">Error</div>
        </div>
        <div class="stat-card">
          <h3>Property Listed</h3>
          <div class="number">Error</div>
        </div>
        <div class="stat-card">
          <h3>Deals Closed</h3>
          <div class="number">Error</div>
        </div>
      </div>
    `;
  }
}