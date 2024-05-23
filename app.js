import session from 'express-session';
import express from 'express';
import players from './api/players.js';
import yatzyAPI from './api/yatzyAPI.js';
import fetch from 'node-fetch';


const app = express();

// Konfiguration af session middleware
app.use(session({
    secret: "Secret_Sauce",
    resave: false,
    saveUninitialized: false
}));

// Middleware der dirigerer anmodninger til vores "router" RESTful api
//app.use('/api/players', playersRouter);
//app.use('/gameLogic', gameRouter);

app.use(express.static('assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
 

// Loader pug startsiden
app.get('/', (request, response) => {
    response.render('login', {title: "Welcome to yahtzeeeeeeee", knownUser: request.session.isLoggedIn});
    if(request.session.isLoggedIn){
        response.redirect('/lobby');
    }
});

// HTTP request for at hente brugernavn fra request body og lave en ny session.
// Klient redirected til spillet hvis der er plads til en ny spiller. Hvis ikke, bliver klienten redirected til lobby
app.post('/', async (request, response) => {
    const user = request.body.Spiller
    request.session.username = user
    request.session.lobbylist = Array.from([])
        
    console.log(`Player session created: ${user}`);
    request.session.isLoggedIn = true

    response.redirect('/lobby');
});

// Middleware til at sikkerhedstjekke
function checkIfAuthenticated(request, response, next) {
    if (!request.session.isLoggedIn) {
        console.log("You are not authenticated");
        return response.status(401).json({ error: 'Not authenticated' });
    }
    next()
}

app.get('/lobby', checkIfAuthenticated, (request, response) =>{
    response.render("lobby")
});

app.post('/lobby', async (request, response) => {
    const user = request.body.lobbySpiller
    request.session.lobbylist.push(user)
    console.log(request.session.lobbylist);

    response.status(200).json({message: "Player added to lobby"})
});


// Render yatzy pug
app.get('/yatzy', checkIfAuthenticated, (request, response) =>{
    response.render('yatzy', {title: "Yahtzeeeeeeee!!"});
});



// function to get total score from results
function calculateTotalScore(player) {
    let totalScore = 0;
    for (let i = 0; i < player.results.length; i++) {
        let score = player.results[i][1];
        if (score !== -1) {
            totalScore += parseInt(score, 10); // treat score as an integer with base 10
        }
    }
    return totalScore;
}


// Loader points siden
app.get('/points', (request, response) => {
    const players = request.session.players || [];
    const round = request.session.round || 0;

    const playerScores = players.map(player => {
        console.log('Player:', player);
        const totalScore = calculateTotalScore(player); 
        console.log('Total Score for', player.name, ':', totalScore);

        return {
            name: player.name,
            round: round,
            throw: player.throwCount,
            totalScore: totalScore
        };
    });

    response.render('points', {
        title: "Current score",
        playerScores: playerScores
    });
});


    
app.get('/logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        delete request.session.id
        console.log(`Session ${request.session.id} logged out and removed`)
        response.redirect('/');
    });
}
)

app.get('/proccedToGame', (request, response) => {
    fetch(request.protocol + "://" + request.headers.host + "/api/yatzyAPI/startgame", {
        method: 'POST'
    })
    response.redirect('/yatzy');
})

//API needs to be at the bottem of the file, ortherwise it wont use apps middleware correctly
app.use('/api/player', players);
app.use('/api/yatzyAPI', yatzyAPI);

app.listen(8000, () => {
    console.log("Server running on port 8000");
});