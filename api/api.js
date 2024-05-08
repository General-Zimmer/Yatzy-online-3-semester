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
api.post('/add-player', async (request, response) => {
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

api.post('/startgame', async (request, response) => {

    request.session.gameID = Math.floor(Math.random() * 1000) // todo: Make this not random or statistically always unique
    let players = []
    try {
        players = Array.from(request.body.players)
    } catch (error) {
        response.status(400).json({ message: error.message })
        return
    }

    
    request.session.players = []
    for (let i = 0; i < players.length; i++) {
        session.players.push({
            name: players[i].name, 
            dices: [
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false }
        ], 
        results: new  Map([
        [one, -1],
        [two, -1],
        [three, -1],
        [four, -1],
        [five, -1],
        [six, -1],
        [onePair, -1],
        [twoPairs, -1],
        [threeSame, -1],
        [fourSame, -1],
        [fullHouse, -1],
        [smallStraight, -1],
        [largeStraight, -1],
        [chance, -1],
        [yatzy, -1]
        ]),
        turn: 0
    })}

    response.redirect('/yatzy')
})

api.post('/throw', async (request, response) => {
    //Get the game data from the session
    let currentPlayer = request.session.currentPlayer //Need to implement this somehow
    let dices = request.session.players[currentPlayer].dices
    let throwCount = request.session.players[currentPlayer].throwCount
    for (let i = 0; i < dices.length; i++) {
        if (!dices[i].lockedState) {
            dices[i].value = Math.floor(Math.random() * 6) + 1
        }
    }
    request.session.players[request.session.currentPlayer].throwCount++
    console.log(dices)
    consolse.log(request.session.players[request.session.currentPlayer].dices)

    response.json({ dices: dices, throwCount: throwCount }) //Send current player also?
})

export default api


// Game Session initializer for testing witn two players
api.post('/starttestgame', async (request, response) => {

    request.session.gameID = 123

    console.log(request.session.gameID)

    response.redirect('http://localhost:8000/yatzy')
})

api.get('/getTest', async (request, response) => {
    response.redirect('http://localhost:8000/yatzy')
})