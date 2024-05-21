// Basic game logic for front-end (Advanced logic in game-logic file)
let canLockScoreField = false;

let canRoll = true;

// Selection of elements for Eventhandling and displaying data
let inputfields = document.getElementsByTagName("input");

let rollBtn = document.querySelector(".roll-button");

let diceImages = document.getElementsByTagName("img");

let throwDisplay = document.getElementById("throwDisplay");

let player = document.getElementById("playerDisplay");

let round = document.getElementById("roundDisplay");

// Initial display function when the page is rendered

//If handeling multiple webpages we need some selection before updating the GUI
updateGUI()


// Adding event listeners
rollBtn.addEventListener("click", rollButton);

for (let i = 0; i < diceImages.length; i++) {
    diceImages[i].addEventListener("click", lockDice);
}

for (let i = 0; i < inputfields.length; i++) {
    if (inputfields[i].id != "sum" && inputfields[i].id != "total" && inputfields[i].id != "bonus") {
        inputfields[i].addEventListener("click", lockScoreField);
    }
}

// Functions for the game
async function rollButton() {
    // Check if the player is allowed to roll
    if (!canRoll) {
        alert("Du må ikke rulle nu");
        return;
    }
    if (checkAllDicesLocked()) {
        alert("Du har låst alle terninger, aflås en for at rulle");
        return;
    }
    
    //Delay while fetching the new dice values.
    const delay = ms => new Promise(res => setTimeout(res, ms));

    //Fetching from server - POST
    let gameDataJSON = await postData('http://localhost:8000/api/yatzyAPI/throw',{})

    //Locking
    canRoll = false;
    canLockScoreField = false;

    //Rolling the dice assets
    let diceHolders = [];
    for (let i = 1; i < 6; i++) {
        diceHolders[i] = document.getElementById(`dice-holder-${i}`);
        
        if (!gameDataJSON.dices[i-1].lockedState){
            const setPermanentDiceValue = async (j) => {
                diceHolders[j].src = `./pics/dice-animation/dice_animation_${j}.gif`;

                let diceValue = gameDataJSON.dices[j - 1].value;

                await delay(2000);
                diceHolders[j].src = `./pics/die_${diceValue}.png`;
            };
            setPermanentDiceValue(i);
        }
    }

    await delay(2100); //Dont know if this is needed, but leaving it in for now
    throwDisplay.textContent = `Throw ${gameDataJSON.throwCount}`
    updateScoreFields(gameDataJSON.results);

    // Update Client state
    canLockScoreField = true;
    if (gameDataJSON.throwCount == 3) {
        canRoll = false;
    } else {
        canRoll = true;
    }

}

// Fetch function for POST-ing JSON data
async function postData(url, data={}){
    const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    let gameData = await response.json();
    //Maybe some error handeling here
    return gameData;
}

//Left as is
function resetDices() {
    for (let i = 0; i < diceImages.length; i++) {
        diceImages[i].className = "dice_regular";
        diceImages[i].src = `./pics/empty-dice_${i}.png`;
    }
}

//Now parameterized
function updateScoreFields(results) {
    for (let i = 0; i < inputfields.length; i++) {
        let inputfield = inputfields[i];
        if (inputfield.className != "inputSelected" && inputfield.id != "sum" && inputfield.id != "bonus" && inputfield.id != "total") {
            if (results[i] < 0){
                inputfield.value = 0;
            } else {
                inputfield.value = results[i];
            }
        }
    }
}
//Initializes the score fields with the results from the server
function initScoreFields(results) {
    for (let i = 0; i < inputfields.length; i++) {
        let inputfield = inputfields[i];
        if (inputfield.id != "sum" && inputfield.id != "bonus" && inputfield.id != "total") {
            if (results[i] < 0){
                inputfield.value = 0
                inputfield.className = "txtbox"
            } else {
                inputfield.value = results[i]
                inputfield.className = "inputSelected"
            }
        }
    }

}


async function lockDice(event) {
    // Check if the player is allowed to lock dice
    let turn = throwDisplay.textContent.split(" ")[1];
    if (turn == 0) {
        alert("Du har ikke kastet endnu");
        return;
    }
    let index = event.target.id.split("-")[2];
    index = parseInt(index) - 1; // The dice array is 0-indexed

    let response = await postData('http://localhost:8000/api/yatzyAPI/lock', {index: index});

    if (response.message == "Locked dice") {
        event.target.className = "lockedDice"
    } else if (response.message == "Unlocked dice") {
        event.target.className = "dice_regular"
    } else {
        console.log("Error in locking dice"); //Only for  testing consider removing
    }
}


// for updating the points table/page dynamically
document.addEventListener("DOMContentLoaded", () => {
    async function updatePointsTable() {
        try {
            const response = await fetch('/api/yatzyAPI/gameStatus');
            if (!response.ok) {
                throw new Error('Failed to fetch game status');
            }
            const gameData = await response.json();
            const pointsTableBody = document.querySelector('#pointsTable tbody');

            // clear existing rows
            pointsTableBody.innerHTML = '';

            // insert new rows
            gameData.players.forEach(player => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${player.name}</td>
                    <td>${player.round}</td>
                    <td>${player.throw}</td>
                    <td>${player.score}</td>
                `;
                pointsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching game status:', error);
        }
    }

    // automatically update the points table every 5 seconds
    setInterval(updatePointsTable, 5000);

    // call once immediately to populate the table on page load
    updatePointsTable();
});




// Checks if all dices are locked, call before rolling
function checkAllDicesLocked() {
    let allDicesLocked = true;
    let diceHolders = [];
    for (let i = 1; i < 6; i++) {
        diceHolders[i] = document.getElementById(`dice-holder-${i}`);
        if (diceHolders[i].className == "dice_regular") {
            return false;
        }
    }
    return allDicesLocked;
}

async function lockScoreField(event) {
    if (canLockScoreField) {
        // Prevent user form clicking another field - this is enabled again in the rollButton function
        canLockScoreField = false;

        // Lock the field and get the key and value
        let field = event.target;
        field.className = "inputSelected"; // See updateScoreFields
        let key = field.id;
        let value = field.value;
        
        //Delay for enchanced user experience
        const delay = ms => new Promise(res => setTimeout(res, ms));
        await delay(1000);

        //API call to server
        let response = await postData('http://localhost:8000/api/yatzyAPI/endTurn', {key: key, value: value})
        
        //Update the GUI with the resopnse data
        if (response.status == "Score updated"){
            updateGUI()
        }
    }
}

async function updateGUI(){
    let response = await fetch("http://localhost:8000/api/yatzyAPI/current", {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json"
        },
    })
    let gameData = await response.json();

    throwDisplay.textContent = `Throw ${gameData.throwCount}`
    player.textContent = gameData.name
    round.textContent = `Round ${gameData.round}`
    initScoreFields(gameData.results)
    resetDices()
    updateSumAndBonusAndTotal()

    canRoll = true
}

function updateSumAndBonusAndTotal() {
    let singleValueids = ["one", "two", "three", "four", "five", "six"];
    
    let sumAmount = 0;
    let extraSum = 0;

    let inputElements = document.getElementsByClassName("inputSelected");

    for (let i = 0; i < inputElements.length; i++) {
        if (singleValueids.includes(inputElements[i].id)) {
            sumAmount += parseInt(inputElements[i].value)
        } else {
            extraSum += parseInt(inputElements[i].value)
        }
    }

    document.getElementById("sum").value = sumAmount

    let bonusField = document.getElementById("bonus")
    if (sumAmount >= 63) {
        bonusField.value = 50;
    } else {
        bonusField.value = 0;
    }

    let totalSum = sumAmount + extraSum + parseInt(bonusField.value);

    document.getElementById("total").value = totalSum;
}

