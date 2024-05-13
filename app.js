import session from 'express-session';
import express from 'express';
import api from './api/api.js';


const app = express();

// Konfiguration af session middleware
app.use(session({
    secret: "Secret_Sauce",
    resave: false,
    saveUninitialized: false
}));

// Middleware der dirigerer anmodninger til vores "router" RESTful api

app.use(express.static('assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
 

// Middleware kun brugt til at teste, ikke vigtig
/*
app.use((req, res, next) => {
    //console.log(`Session ID: ${req.session.id}, Initiated: ${req.session.initiated}`);
    console.log(activeSessions)
    next();
});*/

// Loader pug startsiden
app.get('/8', (request, response) => {
    response.render('login', {title: "Welcome to yahtzeeeeeeee", knownUser: request.session.isLoggedIn});
});

// Endpoint kun brugt til at teste
app.get('/ayo', (request, response) => {
    response.send(activeSessions[request.session.id])
})

// HTTP request for at hente brugernavn fra request body og lave en ny session.
// Klient redirected til spillet hvis der er plads til en ny spiller. Hvis ikke, bliver klienten redirected til lobby
app.post('/8', async (request, response) => {
    const user = request.body.Spiller;
    if(!request.session.isLoggedIn){
        request.session.username = user;

        // Andet vigtigt vi skal have med på session?
        activeSessions[request.session.id] = {
            id: request.session.id,
            username: user,
            timestamp: new Date(),
            score: 0,
            dice: [
                { value: 0, lockedState: false },
                { value: 0, lockedState: false },
                { value: 0, lockedState: false },
                { value: 0, lockedState: false },
                { value: 0, lockedState: false }
            ],
            throwCount: 0
        };
        
        console.log(`Player session created: ${user}`);
        request.session.isLoggedIn = true;


    }
    response.redirect('/yatzy');
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
    const sessionCount = Object.keys(activeSessions).length;
    response.render("lobby")
});

// Render yatzy pug
app.get('/yatzy', checkIfAuthenticated, (request, response) =>{
    const sessionCount = Object.keys(activeSessions).length;

    response.render('yatzy');
});
    
app.get('/logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        delete activeSessions[request.session.id]
        console.log(`Session ${request.session.id} logged out and removed`)
        response.redirect('/');
    });
}
);

app.use('/api', api);

app.listen(8000, () => {
    console.log("Server running on port 8000");
});

app.get('/test', (request, response) => {
    response.send("Hello World!");
});