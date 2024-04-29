import express from 'express'
const app = express()

app.use(express.static('assets'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

import session from 'express-session'
app.use(session({
    secret: 'secretHere',
    saveUninitialized: true,
    resave: true
}))

app.set('view engine', 'pug')

import api from './api/Zimmers-amazing.API.js'
app.use('/api', api)

app.listen(8000, () => {
    console.log("Server running on port 8000");
})