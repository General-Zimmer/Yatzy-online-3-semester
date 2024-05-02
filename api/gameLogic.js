import express from 'express'
import { dices, throwCount, roundCount, newRound, newGame, rollDice, smallStraightPoints
        ,getResults, sameValuePoints, onePairPoints, twoPairPoints
        ,threeSamePoints, fourSamePoints, fullHousePoints
        ,largeStraightPoints, chancePoints, yatzyPoints } from '../game-logic.js';


const api = express.Router();
//api.use()

api.get('/rollDice', (req, res) => {
    rollDice();
    res.json({ dices, throwCount });
});

api.get('/newGame', (req, res) => {
    newGame();
    res.json({ message: 'New game started', dices, throwCount, roundCount });
});

api.get('/getResults', (req, res) => {
    const results = getResults();
    res.json({ results });
});


export default api;




