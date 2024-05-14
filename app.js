import session from 'express-session';
import express from 'express';
import playersRouter from './api/api.js';
import gameRouter from './api/gameLogic.js';
import api from './api/api.js';


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
});

// Endpoint kun brugt til at teste
app.get('/ayo', (request, response) => {
    response.send(request.session.id)
})

// HTTP request for at hente brugernavn fra request body og lave en ny session.
// Klient redirected til spillet hvis der er plads til en ny spiller. Hvis ikke, bliver klienten redirected til lobby
app.post('/', async (request, response) => {
    const user = request.body.Spiller;
    if(!request.session.isLoggedIn){
        request.session.username = user;
        
        console.log(`Player session created: ${user}`);
        request.session.isLoggedIn = true;


    }
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
app.use('/api', api);

app.listen(8000, () => {
    console.log("Server running on port 8000");
});