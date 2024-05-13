// Basic game logic for front-end (Advanced logic in game-logic file)
let canLockScoreField = false;

let canRoll = true;

const lockedState = [false, false, false, false, false];

// Selection of elements for Eventhandling
let inputfields = document.getElementsByTagName("input");

let rollBtn = document.querySelector(".roll-button");

let diceImages = document.getElementsByTagName("img");

// Adding event listeners

rollBtn.addEventListener("click", rollButton);

//Fine as is - alter lockDice
for (let i = 0; i < diceImages.length; i++) {
    diceImages[i].addEventListener("click", lockDice);
}

//Fine as is - alter lockScoreField
for (let i = 0; i < inputfields.length; i++) {
    if (inputfields[i].id != "sum" && inputfields[i].id != "total" && inputfields[i].id != "bonus") {
        inputfields[i].addEventListener("click", lockScoreField);
    }
}

async function rollButton() {
    // Check if the player is allowed to roll
    if (!canRoll) {
        alert("Du har ikke flere kast tilbage");
        return;
    }
    if (checkAllDicesLocked()) {
        alert("Du har låst alle terninger, aflås en for at rulle");
        return;
    }
    
    //Delay while fetching the new dice values. See old code below
    //const delay = ms => new Promise(res => setTimeout(res, ms));

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

            let diceValue = gameDataJSON.dices[i-1];
            //console.log(diceValue)
            //diceHolders[i].src = `./assets/dice-animation/dice_animation_${i}.gif`;
        }
    }

    /* Old code left for reference
    for (let i = 1; i < 6; i++) {
        diceHolders[i] = document.getElementById(`dice-holder-${i}`);

        if (!gameLogic.dices[i - 1].lockedState) {
            const setPermanentDiceValue = async (j) => {
                diceHolders[j].src = `./assets/dice-animation/dice_animation_${j}.gif`;

                let diceValue = gameLogic.dices[j - 1].value;

                await delay(2000);
                diceHolders[j].src = `./assets/die_${diceValue}.png`;
            };
            setPermanentDiceValue(i);
        }
    }
    */
    //await delay(2100);
    updateThrowCount(gameDataJSON.throwCount);
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
async function postData(url, data){
    console.log("hvad er data?" ,  data);
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
        diceImages[i].src = `./assets/empty-dice_${i}.png`;
    }
}

//Now parameterized
function updateScoreFields(results) {
    for (let i = 0; i < inputfields.length; i++) {
        let inputfield = inputfields[i];
        if (inputfield.className != "inputSelected" && inputfield.id != "sum" && inputfield.id != "bonus" && inputfield.id != "total") {
            inputfields[i].value = results[i];
        }
    }
}

//Now parameterized
function updateThrowCount(throwCount) {
    let throwDisplay = document.getElementById("throwDisplay");
    throwDisplay.textContent = `Throw ${throwCount}`;
}


async function lockDice(event) {
    // Check if the player is allowed to lock dice
    let throwDisplay = document.getElementById("throwDisplay");
    let turn = throwDisplay.textContent.split(" ")[1];
    if (turn == 0) {
        alert("Du har ikke kastet endnu");
        return;
    }
    let className = event.target.className;
    let index = event.target.id.split("-")[2];
    console.log(index);

    let response = await postData('http://localhost:8000/api/lock', {Index: index});

    if (response.status == 200) {
        if (className == "dice_regular") {
            event.target.className = "lockedDice";
        } else if (className == "lockedDice") {
            event.target.className = "dice_regular";
        }
    }

    /*
    let index = event.target.id.split("-")[2];
    if (lockedState[index - 1]) {
        lockedState[index - 1] = false;
        event.target.className = "dice_regular";
    } else {
        event.target.className = "lockedDice";
        lockedState[index - 1] = true;
    }*/
}

// Checks if all dices are locked, call before rolling
function checkAllDicesLocked() {
    let allDicesLocked = true;
    for (let i = 0; i < lockedState.length; i++) {
        if (!lockedState[i]) {
            allDicesLocked = false;
        }
    }
    return allDicesLocked;
}

async function lockScoreField(event) {
    if (canLockScoreField) {
        // Prevent user form clicking another field
        canLockScoreField = false;

        // Lock the field and get the key and value
        let field = event.target;
        field.className = "inputSelected"; // See updateScoreFields
        let key = field.id;
        let value = field.value; // Is this needed? - perhaps the server should handle the value?

        //API call to server
        let response = await postData('http://localhost:8000/api/endTurn', {key: key, value: value});
        
        // Do stuff with the response
        // Stuff like switching player or ending the game

        canRoll = true;
    }
}

function updateSumAndBonusAndTotal() {
    let singleValueids = [];
    for (let i = 0; i < 6; i++) {
        singleValueids[i] = `input-${i+1}s`;
    }

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

    let bonusField = document.getElementById("bonus");
    if (sumAmount >= 63) {
        bonusField.value = 50;
    } else {
        bonusField.value = 0;
    }

    let totalSum = sumAmount + extraSum + parseInt(bonusField.value);

    document.getElementById("total").value = totalSum;
}

