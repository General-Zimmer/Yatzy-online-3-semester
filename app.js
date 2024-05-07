import express from 'express';
import session from 'express-session';
import playersRouter from './api/api.js';
import gameRouter from './api/gameLogic.js';


const app = express();
// Middleware der dirigerer anmodninger til vores "router" RESTful api
app.use('/api/players', playersRouter);
app.use('/gameLogic', gameRouter);

app.use(express.static('assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');

// Konfiguration af session middleware
app.use(session({
    secret: "Secret_Sauce",
    resave: false,
    saveUninitialized: true
}));

// Loader pug startsiden
app.get('/', (request, response) => {
    response.render('login', {title: "Welcome to yahtzeeeeeeee", knownUser: request.session.isLoggedIn});
});

// HTTP request for at gemme brugernavn, fra request,
// i session og omdirigerer brugeren til yatzyspillet
let activeSessions = {}

app.post('/', async (request, response) => {
    const user = request.body.username;
    if(!request.session.isLoggedIn){
        request.session.username = user;
        
        activeSessions[request.sessionID] = { username : user, timestamp: new Date() }
        console.log(`Player session created: ${user}`);
        request.session.isLoggedIn = true;
    
        const sessionCount = Object.keys(activeSessions).length;
        console.log(`Active sessions: ${sessionCount}`);

        if (sessionCount >= 2) {
            response.redirect('/lobby');
        }
    }
    response.redirect('/yatzy');
});

app.get('/lobby', (request, response) =>{
    response.render('lobby');
});

// Render yatzy pug
app.get('/yatzy', (request, response) =>{
    response.render('yatzy');
});
    
app.get('/logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('/');
        }
    });
}
);

app.listen(8000, () => {
    console.log("Server running on port 8000");
});
