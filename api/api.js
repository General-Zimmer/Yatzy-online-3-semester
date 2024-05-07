import express from 'express'
import fs from 'fs'

const api = express.Router();


async function getPlayers(){
    let players = await fs.promises.readFile('./players.json', {encoding: 'UTF-8'})
    return JSON.parse(players)
}

async function savePlayer(data = {}){
    let players = await getPlayers()
    players.push(data)
    players = JSON.stringify(players)
    await fs.promises.writeFile('./players.json', players, {encoding: 'UTF-8'})
}


// Hent alle spillere
api.get('/', async (request, response) => {
    try {
        const players = await getPlayers()
        response.json(players)
    } catch(error) {
        response.status(500).json({ message: error.message})
    }
})

// Hent specifik spiller
api.get('/:ign', async (request, response) => {
    try{
    const players = await getPlayers()
    const player = players.find(p => p.username === request.params.ign)
    if(player){
        response.json(player)
    } else {
        response.status(404).json({ message: 'Player not found'})
    }
} catch(error){
    response.status(500).json({ message: error.message })
}
})


// Tilføj ny spiller
api.post('/new', async (request, response) => {
    try {
        const newPlayer = {
            username: request.body.username,
            score: parseInt(request.body.score)
        }

        let players = Array.from(await getPlayers())
        let hasPlayer = false 
        players.forEach(player => {
            player.username === newPlayer.username ? hasPlayer = true : hasPlayer = false
        });


        if (hasPlayer) {
            response.status(400).json({ message: 'Player already exists' })
        } else {
            await savePlayer(newPlayer);
            response.status(201).json(newPlayer);
        }

    } catch (error) {
        response.status(400).json({ message: error.message });
    }
});



export default api