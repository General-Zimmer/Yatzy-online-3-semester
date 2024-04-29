import express from 'express';
import session from 'express-session';
import playersRouter from './api/router.js';

const app = express();

app.use(express.static('assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secretHere',
    saveUninitialized: true,
    resave: true
}));

app.set('view engine', 'pug');

app.use('/players', playersRouter);

app.listen(8000, () => {
    console.log("Server running on port 8000");
});
