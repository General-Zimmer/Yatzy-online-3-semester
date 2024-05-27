import express from 'express';
import fs from 'fs';

const api = express.Router();

async function getPlayers() {
    console.log("Attempting to get players from file...");
    try {
        let players = await fs.promises.readFile('./players.json', { encoding: 'UTF-8' });
        console.log("Successfully read players from file.");
        return JSON.parse(players);
    } catch (error) {
        console.error("Error reading players.json:", error);
        return [];
    }
}

export async function savePlayer(data = {}) {
    console.log("Attempting to save player data:", data);
    try {
        let players = await getPlayers();
        let playerFound = false;

        players = players.map(player => {
            if (player.username === data.username) {
                playerFound = true;
                console.log(`Updating existing player: ${data.username}`);
                return data;
            }
            return player;
        });

        if (!playerFound) {
            console.log(`Adding new player: ${data.username}`);
            players.push(data);
        }

        players = JSON.stringify(players, null, 2);

        await fs.promises.writeFile('./players.json', players, { encoding: 'UTF-8' });
        console.log("Player data saved successfully.");
    } catch (error) {
        console.error("Error writing to players.json:", error);
        throw error;
    }
}

// Hent alle spillere
api.get('/p', async (request, response) => {
    console.log("Received request to get all players.");
    try {
        const players = await getPlayers();
        response.json(players);
    } catch (error) {
        console.error("Error responding to get all players:", error);
        response.status(500).json({ message: error.message });
    }
});

// Tilføj ny spiller
api.post('/new', async (request, response) => {
    console.log("Received request to add new player.");
    try {
        const newPlayer = {
            username: request.body.username,
            score: parseInt(request.body.score)
        };
        console.log("New player data:", newPlayer);

        let players = await getPlayers();
        let hasPlayer = players.some(player => player.username === newPlayer.username);

        if (hasPlayer) {
            console.log(`Player already exists: ${newPlayer.username}`);
            response.status(400).json({ message: 'Player already exists' });
        } else {
            await savePlayer(newPlayer);
            response.status(201).json(newPlayer);
        }
    } catch (error) {
        console.error("Error adding new player:", error);
        response.status(400).json({ message: error.message });
    }
});

// Hent specifik spiller
api.get('/p/:ign', async (request, response) => {
    console.log(`Received request to get player: ${request.params.ign}`);
    try {
        const players = await getPlayers();
        const player = players.find(p => p.username === request.params.ign);
        if (player) {
            console.log(`Player found: ${request.params.ign}`);
            response.json(player);
        } else {
            console.log(`Player not found: ${request.params.ign}`);
            response.status(404).json({ message: 'Player not found' });
        }
    } catch (error) {
        console.error("Error getting player:", error);
        response.status(500).json({ message: error.message });
    }
});

export default savePlayer
