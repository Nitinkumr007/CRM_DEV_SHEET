async function fetchStats() {
    try {
        const response = await fetch('http://localhost:5500/api/tickets/stats');
        const data = await response.json();
        console.log('API Status:', response.status);
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fetchStats();
