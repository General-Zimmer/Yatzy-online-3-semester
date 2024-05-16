import session from 'express-session';
import express from 'express';
import players from './api/players.js';
import yatzyAPI from './api/yatzyAPI.js';


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
    request.session.username = user;
    session.players = []
        
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
    session.players.push( {
        name: user
    })
    console.log(session.players);

});


// Render yatzy pug
app.get('/yatzy', checkIfAuthenticated, (request, response) =>{
    response.render('yatzy', {title: "Yahtzeeeeeeee!!"});
});

// Loader point siden
app.get('/points', (request, response) => {
    response.render('points', {title: "Current score", knownUser: request.session.isLoggedIn});
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
);

//API needs to be at the bottem of the file, ortherwise it wont use apps middleware correctly
app.use('/api/player', players);
app.use('/api/yatzyAPI', yatzyAPI);

app.listen(8000, () => {
    console.log("Server running on port 8000");
});