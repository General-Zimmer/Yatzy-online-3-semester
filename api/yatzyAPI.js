import session from 'express-session';
import * as gameLogic from './game-logic.js'
import express from 'express'
const yatzyAPI = express.Router();

/*
yatzyAPI.use(session({
    secret: "Secret_Sauce",
    resave: false,
    saveUninitialized: false
}));


import { rollDice, getResults } from './game-logic.js'; 

        // Nedenstående er imports vi skal bruge senere

        /*sameValuePoints, onePairPoints, twoPairPoints
        ,threeSamePoints, fourSamePoints, fullHousePoints
        ,largeStraightPoints, chancePoints, yatzyPoints 
        ,smallStraightPoints
        */


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
        players = Array.from(request.session.players)
        players.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
        response.status(400).json({ message: error.message })
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
        if (playerTurn == player.getResults.length) {
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
//----------------------------------------------------------------------------------------------------
/*
* API endpoint for ending the turn by selecting a score field
* Request: JSON object with the key and value of the selected score field
* Response: JSON object with the updated results array - perhaps this sould just be an OK response
* Updates the results of the current player in the session
*/
yatzyAPI.post('/endTurn', async (request, response) => {
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
yatzyAPI.post('/throw', async (request, response) => {
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
yatzyAPI.post('/lock', async (request, response) => {
    let index = request.body.index
    let dices = request.session.players[request.session.currentPlayer].dices
    dices[index].lockedState = !dices[index].lockedState
    response.json({ message: dices[index].lockedState ? "Locked dice" : "Unlocked dice" })
})



// API endpoint to get current game state
yatzyAPI.get('/gameStatus', (req, res) => {
    try {
        const players = req.session.players.map(player => {
            // calculate the total score from results
            const totalScore = player.results.reduce((acc, [key, value]) => acc + (value > 0 ? value : 0), 0);

            return {
                name: player.name,
                round: req.session.round,
                throw: player.throwCount,
                score: totalScore // use totalScore here
            };
        });
        res.json({ players });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// Game Session initializer for testing with two players - not ment to be a final version
yatzyAPI.get('/starttestgame', async (request, response) => {
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



export default yatzyAPI;




