import session from 'express-session';
import activeSessions from '../sessionManager.js';
import express from 'express'
const api = express.Router();

api.use(session({
    secret: "Secret_Sauce",
    resave: false,
    saveUninitialized: false
}));

import { dices, throwCount, roundCount, newRound, newGame, rollDice
        ,getResults } from '../game-logic.js'; 

        // Nedenstående er imports vi skal bruge senere

        /*sameValuePoints, onePairPoints, twoPairPoints
        ,threeSamePoints, fourSamePoints, fullHousePoints
        ,largeStraightPoints, chancePoints, yatzyPoints 
        ,smallStraightPoints
        */


api.get('/rollDice', (request, response) => {
    // Debugging, bare ignorer
    console.log("Checking session:", request.session.id);
    console.log("Current active sessions:", Object.keys(activeSessions));


    const sessionData = activeSessions[request.session.id];
    if (!sessionData || !sessionData.dice) {
        console.error('Session data or dice not found for ID:', request.session.id, sessionData);
        return response.status(404).json({ error: 'Active session or dice not found' });
    }

    sessionData.throwCount++
    sessionData.dice = rollDice(sessionData.dice);
    // Hvad vil vi gerne have klienten skal modtage, når de kalder på dette endpoint?
    response.json({ id: request.session.id, dice: sessionData.dice, throwCount: sessionData.throwCount });
});


api.get('/newGame', (req, res) => {
    newGame();
    res.json({ message: 'New game started', dices, throwCount, roundCount });
});

api.get('/getResults', (req, res) => {
    const results = getResults();
    res.json({ results });
});

api.get('/startgame', (request, response) =>{
    response.render('yatzy')
})

api.post('/startgame', async (request, response) => {
    const session = request.session
    session.gameID = Math.floor(Math.random() * 1000) // todo: Make this not random or statistically always unique
    // 'or statistically always unique' --> altså bare bruge en counter? eller? xD
    
    let players = []
    try {
        players = Array.from(request.body.players)
        players.sort((a, b) => a.name.localeCompare(b.name))
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
        throwCount: 0,
    })}

response.redirect('http://localhost:8000/yatzy');
})

api.get('/nextTurn', (req, res) => {
    let playerTurn = getNextTurn(req.session.players)

    if (playerTurn == null) {
        res.json({ message: 'No players found' })
        return
    }

    let playerToSwitch = req.session.players.find(player => player.name == playerTurn)
    if (playerToSwitch == null) {
        res.json({ message: 'Player not found' })
        return
    }

    res.json({ player: playerToSwitch })

});

function getNextTurn(players) {
    try {
        players = Array.from(request.body.players)
        players.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
        response.status(400).json({ message: error.message })
        return
    }
    let playerSmallestTurn = null
    players.forEach(player => {
        let playerTurn = 0;
        for (let i = 0; i < player.results.length; i++) {
            if (player.results[i] != -1) {
                playerTurn++
            }
        }
        if (playerSmallestTurn == null || playerTurn < playerSmallestTurn) {
            playerSmallestTurn = playerTurn
        }
})
}



export default api;




