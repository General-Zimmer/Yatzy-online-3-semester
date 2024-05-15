import express from 'express'
import fs from 'fs'
import * as gameLogic from './game-logic.js'

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
api.get('/p/:ign', async (request, response) => {
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
    let currentPlayer = request.session.currentPlayer
    let sessionResults = request.session.players[currentPlayer].results
    let resultsMap = new Map(sessionResults)
    resultsMap.set(key, value)
    sessionResults = Array.from(resultsMap.entries()) //Map is not JSON serializable
    request.session.players[currentPlayer].results = sessionResults


    //Switch the player
    switchPlayer(request) //Updates the currentPlayer and round in the session
    let round = request.session.round
    if (round > 15) {
        //End the game response.render(something...)
    }

    //Send a response
    currentPlayer = request.session.currentPlayer //Update index reference variable
    let name = request.session.players[currentPlayer].name
    let throwCount = request.session.players[currentPlayer].throwCount
    let results = request.session.players[currentPlayer].results

    response.json({name : name, throwCount : throwCount, results : results, round : round})
})
/**
 * Helper function for switching the player when ending the turn
 * Updates the currentPlayer and round in the session
 * Resets the throw count and locked state of the dices for the previous player
*/
function switchPlayer(request) {
    let currentPlayer = request.session.currentPlayer
    let playersLength = request.session.players.length
    request.session.players[currentPlayer].throwCount = 0
    request.session.players[currentPlayer].dices.forEach(dice => {dice.lockedState = false})
    
    if (currentPlayer + 1 < playersLength) {
        request.session.currentPlayer++
    } else {
        request.session.currentPlayer = 0
        request.session.round++
    }
}

/*
* API endpoint for throwing the dice
* Request: JSON object with the lockedState array
* Response: JSON object with the dices array, throwCount and results array
* Updates the throw count and dice of the current player
*/
api.post('/throw', async (request, response) => {
    //Increment the players throw count - Perhaps there sould be some error handeling here
    let currentPlayer = request.session.currentPlayer
    request.session.players[currentPlayer].throwCount++

    
    //Get the game data from the session
    let dices = request.session.players[currentPlayer].dices
    let throwCount = request.session.players[currentPlayer].throwCount

    if (throwCount > 3) {
        response.status(400).json({ message: "ERROR: You have no more throws left" })
        return
    }

    //Roll the dice and get the results
    dices = gameLogic.rollDice(dices)
    let results = gameLogic.getResults(dices)
    
    //Send a response
    //Remember to add turn
    response.json({ dices : dices, throwCount : throwCount, results : results})
})


/**
 * API endpoint for locking a die
 * Request: JSON object with the index of the dice to lock
 * Response: Status code
 */
api.post('/lock', async (request, response) => {
    let index = request.body.index
    let dices = request.session.players[request.session.currentPlayer].dices
    dices[index].lockedState = !dices[index].lockedState
    response.json({ message: dices[index].lockedState ? "Locked dice" : "Unlocked dice" })
})


// Game Session initializer for testing with two players - not ment to be a final version
api.get('/starttestgame', async (request, response) => {
    request.session.gameID = Math.floor(Math.random() * 1000)
    request.session.currentPlayer = 0
    request.session.players = []
    request.session.isLoggedIn = true
    request.session.round = 1

    let names = ['Player 1', 'Player 2']

    for (let i = 0; i < names.length; i++) {
        let resultsMap = new Map ([
            ["one", -1],
            ["two", -1],
            ["three", -1],
            ["four", -1],
            ["five", -1],
            ["six", -1],
            ["onePair", -1],
            ["twoPairs", -1],
            ["threeSame", -1],
            ["fourSame", -1],
            ["fullHouse", -1],
            ["smallStraight", -1],
            ["largeStraight", -1],
            ["chance", -1],
            ["yatzy", -1]
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
            results: Array.from(resultsMap.entries()), //Map is not JSON serializable, and session data must be JSON serializable
            throwCount: 0
    })}
    response.redirect('/yatzy')
})

export default api