import express from 'express'
import fs from 'fs'
import * as gameLogic from './game-logic.js'
import path from 'path'

const api = express.Router();

// Jeg tænker at dette er forbeholdt til vores storage, da data bliver slettet når en session udløber.
// Så kan vi nemlig gå tilbage i vores "database" og se stats fra tidligere kampe

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
api.get('/p', async (request, response) => {
    try {
        const players = await getPlayers()
        response.json(players)
    } catch(error) {
        response.status(500).json({ message: error.message})
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

/*
* API endpoint for ending the turn by selecting a score field
* Request: JSON object with the key and value of the selected score field
* Response: JSON object with the updated results array - perhaps this sould just be an OK response
* Updates the results of the current player in the session
*/
api.post('/endTurn', async (request, response) => {
    //Get the selected score field from the request
    let key = request.body.key
    let value = request.body.value
    
    //Update the results in the session
    let sessionResults = request.session.players[request.session.currentPlayer].results
    let results = new Map(sessionResults)
    results.set(key, value)
    sessionResults = Array.from(results.entries()) //Map is not JSON serializable

    //Send a response
    response.json(sessionResults) //Just for test - maybe add something usefull later
})

/*
* API endpoint for throwing the dice
* Request: JSON object with the lockedState array
* Response: JSON object with the dices array, throwCount and results array
* Updates the throw count and dice of the current player
*/
api.post('/throw', async (request, response) => {
    //Increment the players throw count - Perhaps there sould be some error handeling here
    request.session.players[request.session.currentPlayer].throwCount++
    
    //Get dice locked state from the request
    let lockedState = request.body.lockedState
    
    //Get the game data from the session
    let currentPlayer = request.session.currentPlayer
    let dices = request.session.players[currentPlayer].dices
    let throwCount = request.session.players[currentPlayer].throwCount

    //Roll the dice
    for (let i = 0; i < dices.length; i++) {
        dices[i].lockedState = lockedState[i]
    }
    dices = gameLogic.rollDice(dices)
    let results = gameLogic.getResults(dices)
    
    //Send a response
    response.json({ dices : dices, throwCount : throwCount, results : results})
})

/**
 * API endpoint for .png image paths
 * Request: The name of the image file
 * Response: The image file
 */
//C:\Users\1e4e5\Desktop\DIP\Yatzy-online-3-semester\assets\pics
/*api.get('/assets/pics/:name', (request, response) => {
    console.log(request.params.name)
    let filePath = path.join(__dirname, '../assets/pics/', request.params.name)
    console.log(filePath)
    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.status(404).json({ message: error.message })
        } else {
            response.writeHead(200, { 'Content-Type': 'image/png' })
            response.end(data)
        }
    })
})*/

// Game Session initializer for testing with two players - not ment to be a final version
api.get('/starttestgame', async (request, response) => {
    request.session.gameID = Math.floor(Math.random() * 1000)
    request.session.currentPlayer = 0
    request.session.players = []

    let names = ['Player 1', 'Player 2']

    for (let i = 0; i < names.length; i++) {
        let resultsMap = new Map ([
            ["1's", 0],
            ["2's", 0],
            ["3's", 0],
            ["4's", 0],
            ["5's", 0],
            ["6's", 0],
            ["One Pair", 0],
            ["Two Pairs", 0],
            ["Three Same", 0],
            ["Four Same", 0],
            ["Full House", 0],
            ["Small Straight", 0],
            ["Large Straight", 0],
            ["Chance", 0],
            ["Yatzy", 0]
        ])

        request.session.players.push({
            name: names[i], 
            dices: [
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false }
            ], 
            results: Array.from(resultsMap.entries()),
            throwCount: 0
    })}
    response.redirect('/yatzy')
})

export default api