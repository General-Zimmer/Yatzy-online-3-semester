// Basic game logic for front-end (Advanced logic in game-logic file)
let canLockScoreField = false;

let canRoll = true;

// Selection of elements for Eventhandling
let inputfields = document.getElementsByTagName("input");

let rollBtn = document.querySelector(".roll-button");

let diceImages = document.getElementsByTagName("img");

let throwDisplay = document.getElementById("throwDisplay");

let player = document.getElementById("playerDisplay");

let round = document.getElementById("roundDisplay");

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
    let gameDataJSON = await postData('http://localhost:8000/api/throw',{})

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

// Fetch function for POST-ing JSON data - shoud perharps be PUT instead
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
    console.log(gameData) //For test remove later
    //Maby some error handling here
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
//Initializes the score fields at the start of a new players round
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

    let response = await postData('http://localhost:8000/api/lock', {index: index});

    if (response.message == "Locked dice") {
        event.target.className = "lockedDice"
    } else if (response.message == "Unlocked dice") {
        event.target.className = "dice_regular"
    } else {
        console.log("Error in locking dice"); //Only for  testing consider removing
    }
}

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

        //API call to server
        let response = await postData('http://localhost:8000/api/endTurn', {key: key, value: value})
        
        //Update the GUI with the resopnse data
        let resultsArray = []
        for (let i = 0; i < response.results.length; i++) {
            resultsArray.push(response.results[i][1])
        }
        initScoreFields(resultsArray)

        throwDisplay.textContent = `Throw ${response.throwCount}`
        player.textContent = response.name
        round.textContent = `Round ${response.round}`
        resetDices();
        updateSumAndBonusAndTotal()
        
        // Reenable the ability to roll for the next player
        canRoll = true
    }
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

    document.getElementById("sum").value = sumAmount;

    let bonusField = document.getElementById("bonus")
    if (sumAmount >= 63) {
        bonusField.value = 50;
    } else {
        bonusField.value = 0;
    }

    let totalSum = sumAmount + extraSum + parseInt(bonusField.value);

    document.getElementById("total").value = totalSum;
}

