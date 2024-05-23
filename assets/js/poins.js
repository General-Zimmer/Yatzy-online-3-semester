// for updating the points table/page dynamically
document.addEventListener("DOMContentLoaded", () => {
    async function updatePointsTable() {
        try {
            const response = await fetch('/api/yatzyAPI/gameStatus');
            if (!response.ok) {
                throw new Error('Failed to fetch game status');
            }
            const gameData = await response.json();
            const pointsTableBody = document.querySelector('#pointsTable tbody');

            // clear existing rows
            pointsTableBody.innerHTML = '';

            // insert new rows
            gameData.players.forEach(player => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${player.name}</td>
                    <td>${player.round}</td>
                    <td>${player.throw}</td>
                    <td>${player.score}</td>
                `;
                pointsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching game status:', error);
        }
    }

    // automatically update the points table every 5 seconds
    setInterval(updatePointsTable, 5000);

    // call once immediately to populate the table on page load
    updatePointsTable();
});