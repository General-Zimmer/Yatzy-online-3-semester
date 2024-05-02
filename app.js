import express from 'express';
import session from 'express-session';
import playersRouter from './api/api.js';
import gameRouter from './api/gameLogic.js';

const app = express();

app.use(express.static('assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');


// Konfiguration af session middleware
app.use(session({
    secret: "Secret_Sauce",
    resave: false,
    saveUninitialized: true,

}));


// Loader pug startsiden
app.get('/', (request, response) => {
    response.render('start');
});


// HTTP request for at gemme brugernavn, fra request,
// i session og omdirigerer brugeren til yatzyspillet
app.post('/', (request, response) => {
    const user = request.body.username;
    request.session.username = user;
    console.log(`Player session created: ${user}`)
    response.redirect('/yatzy')
});


// Render yatzy pug
app.get('/yatzy', (request, response) =>{
    response.render('yatzy')
})


// Middleware der dirigerer anmodninger til vores "router" RESTful api
app.use('/players', playersRouter);
app.use('/gameLogic', gameRouter);

app.listen(8000, () => {
    console.log("Server running on port 8000");
});
