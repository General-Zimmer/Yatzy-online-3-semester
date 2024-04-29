import {router} from 'express';

const api = router();

api.get('/', (request, response) => {
    response.status(200).send({message: 'Hello, world!'});
});


api.post('/throw', async (request, response) => {

});

api.post('/lockdice', async (request, response) => {

});

api.post('/lockdices', async (request, response) => {

});

api.post('/lockdice', async (request, response) => {

});

api.post('/restartgame', async (request, response) => {

});

api.post('/nextturn', async (request, response) => {

});

api.get('/dices', async (request, response) => {

});

api.get('/scores', async (request, response) => {

});

// ZIMMER, REMEMBER DIS ALWAYS LAST. (You know why >:D)
let exports = {api};
export default exports; 
export {api};