// Forbeholdt til klienter der fetcher data via endpoints

async function startNewGame(){
    try {
        const response = await fetch('/api/gameLogic/startgame');
        if(!response.ok){
            throw new Error('Failed to start a new game')
        } 
        const data = await response.json()
        console.log(data)
    } catch(error) {
        console.error('Error starting new game:', error.message);
    }
}

async function getGameResult(){
    try {
        const response = await fetch('/api/gameLogic/gameResults')
        if(!response.ok){
            throw new Error('Failed to get game results')
        } 
        const data = await response.json()
        console.log(data)
    } catch(error) {
        console.error('Error fetching game result:', error.message);
    }
}

async function rollTheDice() {
    try {
        const response = await fetch('/api/gameLogic/rollDice');
        if (!response.ok) {
            throw new Error('Failed to roll the dice');
        }
        const data = await response.json();
    } catch (error) {
        console.error('Error rolling the dice:', error.message);
    }
}

async function addPlayersToGame() {
    try {
        const response = await fetch('/api/gameLogic/rollDice');
        if (!response.ok) {
            throw new Error('Failed to roll the dice');
        }
        const data = await response.json();
    } catch (error) {
        console.error('Error rolling the dice:', error.message);
    }
}

async function addPlayersToGame(url="http://localhost:8000/lobby", data={}){
    const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userName: userName, ...data })
    })
    let answer = await response.json();
    if(answer.status == "OK"){
        document.getElementById('player').innerHTML = data.username
    }
}

let tilføjSpillerButton = document.getElementBy

let buttonNode = document.getElementById('rollButton');
buttonNode.addEventListener('click', () => {
    rollTheDice()
    
    console.log("Clicked on roll")
});