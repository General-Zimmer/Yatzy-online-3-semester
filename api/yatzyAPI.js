// API for the Yatzy game itself.
import * as gameLogic from './game-logic.js'
import * as playerStorage from './players.js'
import express from 'express'
const yatzyAPI = express.Router();
import fs from 'fs'


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

async function savePlayer(data = {}) {
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


yatzyAPI.post('/startgame', async (request, response) => {
    request.session.gameID = Math.floor(Math.random() * 1000) // todo: Make this not random or statistically always unique
    // 'or statistically always unique' --> altså bare bruge en counter? eller? xD
    
    let players = []
    try {
        players = Array.from(request.session.players)
        players.sort((a, b) => a.localeCompare(b))
    } catch (error) {
        return response.status(400).json({ message: error.message })
    }

    request.session.players = []

    for (let i = 0; i < players.length; i++) {
        request.session.players.push({
            name: players[i], 
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
        players.sort()
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
    
    if (round !== null) round++ //It is initialized to 0 when it is calculated. Null when the game is over

    let results = []
    player.results.forEach(score => results.push(score.value))
    
    let diceResults = gameLogic.getResults(player.dices)

    response.json({name : name,
        dices : player.dices,
        diceResults : diceResults, //The result of the current throw
        throwCount : player.throwCount, 
        results : results, //The current players results from previous rounds
        round : round})
})

/*
* API endpoint for ending the turn by selecting a score field
* Request: JSON object with the key and value of the selected score field
* Response: Confimation status
* Updates the results of the current player in the session
*/
yatzyAPI.post('/endTurn', async (request, response) => {
    // Get the selected score field from the request
    let key = request.body.key;
    let value = request.body.value;

    // Update the results in the session
    let getNext = getNextTurn(request.session.players);
    let name = getNext.name;
    let player = request.session.players.find(player => player.name == name);
    player.throwCount = 0;
    player.results.forEach(result => { if(result.key === key) result.value = value;}); // Affects how getNextTurn calculates player
    player.dices.forEach(dice => {
        dice.lockedState = false;
        dice.value = 0;
    });

    let totalScore = calculateTotalScore(player)

    const playerData = {
        username: name,
        score: totalScore,
        throwCount: player.throwCount
    };

    try {
        await savePlayer(playerData);
    } catch (error) {
        return response.status(500).json({
            status: "Couldn't save player data", error: error.message
        });
    }

    response.json({ status: "Score updated" });
});


function calculateTotalScore(player) {
    let totalScore = 0;
    let bonus = 0;
    let singleValueids = ["one", "two", "three", "four", "five", "six"];

    for (let i = 0; i < player.results.length; i++) {
        let score = player.results[i].value;
        if (score !== -1) {
            totalScore += parseInt(score, 10); // treat score as an integer with base 10
            if (singleValueids.includes(player.results[i].key)) {
                bonus += parseInt(score, 10)
            } 
        }
    }

    if (bonus >= 63) {
        totalScore += 50;
    }
    return totalScore;
}

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
    request.session.players = []
    request.session.isLoggedIn = true

    let names = ['Player 1', 'Player 2']

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

