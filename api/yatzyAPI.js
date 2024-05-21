// API for the Yatzy game itself.
import * as gameLogic from './game-logic.js'
import express from 'express'
const yatzyAPI = express.Router();

yatzyAPI.get('/rollDice', (request, response) => {
    const sesh = request.session
    console.log("Checking session:", sesh.id);

    if (!sesh) {
        console.error(`Session not found for ID: ${sesh.id} `);
        return response.status(404).json({ error: 'Active session not found' });
    }
    sesh.dice = [{ value: 0, lockedState: false },
    { value: 0, lockedState: false },
    { value: 0, lockedState: false },
    { value: 0, lockedState: false },
    { value: 0, lockedState: false }]

    sesh.throwCount++
    sesh.dice = rollDice(sesh.dice);

    response.json({ id: request.session.id, dice: sesh.dice, throwCount: sesh.throwCount });
});


yatzyAPI.get('/newGame', (req, res) => {
    newGame();
    res.json({ message: 'New game started', dices, throwCount, roundCount });
});

yatzyAPI.get('/getResults', (req, res) => {
    const results = getResults();
    res.json({ results });
});

yatzyAPI.get('/startgame', (request, response) =>{
    response.render('yatzy')
})
yatzyAPI.post('/startgame', async (request, response) => {
    const session = request.session
    session.gameID = Math.floor(Math.random() * 1000) // todo: Make this not random or statistically always unique
    // 'or statistically always unique' --> altså bare bruge en counter? eller? xD
    
    let players = []
    try {
        players = Array.from(session.players)
        players.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
        response.status(400).json({ message: error.message })
        return
    }

    session.players = []

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
        results: [
            { key: "one", value: -1 },
            { key: "two", value: -1 },
            { key: "three", value: -1 },
            { key: "four", value: -1 },
            { key: "five", value: -1 },
            { key: "six", value: -1 },
            { key: "onePair", value: -1 },
            { key: "twoPairs", value: -1 },
            { key: "threeSame", value: -1 },
            { key: "fourSame", value: -1 },
            { key: "fullHouse", value: -1 },
            { key: "smallStraight", value: -1 },
            { key: "largeStraight", value: -1 },
            { key: "chance", value: -1 },
            { key: "yatzy", value: -1 }
        ],
        throwCount: 0,
    })}

response.redirect('http://localhost:8000/yatzy');
})

yatzyAPI.get('/nextTurn', (req, res) => {
    let playerTurn = getNextTurn(req.session.players)

    if (playerTurn == null) {
        res.json({ message: 'All games done' })
        return
    }

    let playerToSwitch = req.session.players.find(player => player.name == playerTurn.name)
    if (playerToSwitch == null) {
        res.json({ message: 'Error: Player not found' })
        return
    }

    res.json(playerTurn)

});

function getNextTurn(players) {
    try {
        players = Array.from(players)
        players.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
        console.error(error.message)
        return
    }
    let playerSmallestTurn = null
    let playerSmallestTurnName = null
    players.forEach(player => {
        // Figure out how many turns the player have had.
        let playerTurn = 0;
        for (let i = 0; i < player.results.length; i++) {
            if (player.results[i].value != -1) {
                playerTurn++
            }
        }
        // Check if player is done
        if (playerTurn == player.results.length) {
            playerTurn == null
        }
        // Check if player is smallest
        if (playerTurn !== null && (playerSmallestTurn == null || playerTurn < playerSmallestTurn)) {
            playerSmallestTurn = playerTurn
            playerSmallestTurnName = player.name
        }
    })
    return {turns: playerSmallestTurn, name: playerSmallestTurnName}
}
/**
 * API endpoint for the current state of the game
 * Uses the getNextTurn to find the state of the current player
 *  */
yatzyAPI.get('/current',(request, response) => {
    let getNext = getNextTurn(request.session.players)
    let name = getNext.name
    let round = getNext.turns //Maby rename the variables to fit each other
    let player = request.session.players.find(player => player.name == name)
    
    let results = []
    player.results.forEach(score => results.push(score.value))

    response.json({name : name, 
        throwCount : player.throwCount, 
        results : results, //The current players results
        round : round})
})

/*
* API endpoint for ending the turn by selecting a score field
* Request: JSON object with the key and value of the selected score field
* Response: Confimation status
* Updates the results of the current player in the session
*/
yatzyAPI.post('/endTurn', async (request, response) => {
    //Get the selected score field from the request
    let key = request.body.key
    let value = request.body.value
    
    //Update the results in the session
    let getNext = getNextTurn(request.session.players)
    let name = getNext.name
    let player = request.session.players.find(player => player.name == name)
    player.throwCount = 0
    player.results.forEach(result => {if (result.key == key) result.value = value}) //Affects how getNextTurn calcs player
    player.dices.forEach(dice => {
        dice.lockedState = false
        dice.value = 0
    })
    
    response.json({status : "Score updated"})
})

/*
* API endpoint for throwing the dice
* Request: JSON object with the lockedState array
* Response: JSON object with the dices array, throwCount and results array
* Updates the throw count and dice of the current player
*/
yatzyAPI.post('/throw', async (request, response) => {
    //Get the game data from the session
    let name = getNextTurn(request.session.players).name
    let player = request.session.players.find(player => player.name == name)
    
    //Increment the players throw count
    player.throwCount++
    if (player.throwCount > 3) {
        response.status(400).json({ message: "ERROR: You have no more throws left" })
        return
    }

    //Roll the dice and get the results
    player.dices = gameLogic.rollDice(player.dices)
    let results = gameLogic.getResults(player.dices) //The result of the thow not the players score
    
    //Send a response
    response.json({ dices : player.dices, throwCount : player.throwCount, results : results})
})


/**
 * API endpoint for locking a die
 * Request: JSON object with the index of the dice to lock
 * Response: Status code
 */
yatzyAPI.post('/lock', async (request, response) => {
    //Get the game data from the session and request
    let name = getNextTurn(request.session.players).name
    let player = request.session.players.find(player => player.name == name)
    let index = request.body.index

    //Lock the dice
    player.dices[index].lockedState = !player.dices[index].lockedState
    response.json({ message: player.dices[index].lockedState ? "Locked dice" : "Unlocked dice" })
})


// Game Session initializer for testing with two players - not ment to be a final version
yatzyAPI.get('/starttestgame', async (request, response) => {
    request.session.gameID = Math.floor(Math.random() * 1000)
    request.session.players = []
    request.session.isLoggedIn = true

    let names = ['Player 1', 'Player 2','Player 3']

    for (let i = 0; i < names.length; i++) {
        request.session.players.push({
            name: names[i], 
            dices: [
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false },
            { value: 0, lockedState: false }
        ], 
        results: [
            { key: "one", value: -1 },
            { key: "two", value: -1 },
            { key: "three", value: -1 },
            { key: "four", value: -1 },
            { key: "five", value: -1 },
            { key: "six", value: -1 },
            { key: "onePair", value: -1 },
            { key: "twoPairs", value: -1 },
            { key: "threeSame", value: -1 },
            { key: "fourSame", value: -1 },
            { key: "fullHouse", value: -1 },
            { key: "smallStraight", value: -1 },
            { key: "largeStraight", value: -1 },
            { key: "chance", value: -1 },
            { key: "yatzy", value: -1 }
        ],
        throwCount: 0,
    })}

response.redirect('http://localhost:8000/yatzy');
})



export default yatzyAPI;




