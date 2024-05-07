

// Basic game logic for front-end (Advanced logic in Game-logic file)
let canLockScoreField = false;

let canRoll = true;

const lockedState = [false, false, false, false, false];

// Selection of elements for Eventhandling
let inputfields = document.getElementsByTagName("input");

let rollBtn = document.querySelector(".roll-button");

let diceImages = document.getElementsByTagName("img");

updateScoreFields();
updateSumAndBonusAndTotal();

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
    // Check if the player id allowed to roll
    if (!canRoll) {
        return;
    }
    if (checkAllDicesLocked()) {
        alert("Du har låst alle terninger, aflås en for at rulle");
        return;
    }
    /* Move this outside of the function
    if (gameLogic.roundCount == 15) {
        if (window.confirm("Spillet er slut, vil du starte et nyt spil?")) {
            restartGame();
        } else {
            return;
        }
    }
    if (gameLogic.throwCount == 3) {
        return;
    }*/
    
    //Delay while fetching the new dice values.
    const delay = ms => new Promise(res => setTimeout(res, ms));

    //Fetching from server - POST
    let gameDataJSON = await postData('http://localhost:8000/throw',lockedState)

    //Locking
    canRoll = false;
    canLockScoreField = false;

    //Rolling the dice assets
    let diceHolders = [];
    for (let i = 1; i < 6; i++) {
        diceHolders[i] = document.getElementById(`dice-holder-${i}`);

        if (!lockedState[i - 1]) {
            const setPermanentDiceValue = async (j) => {
                diceHolders[j].src = `./assets/dice-animation/dice_animation_${j}.gif`;

                let diceValue = gameDataJSON.dices[0];

                await delay(2000);
                diceHolders[j].src = `./assets/die_${diceValue}.png`;
            };
            setPermanentDiceValue(i);
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
    await delay(2100);
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

function lockDice(event) {
    /* Need a way to implement this, maybbe a new state variable?
    if (gameLogic.throwCount == 0) {
        return;
    }*/
    let index = event.target.id.split("-")[2];
    if (lockedState[index - 1]) {
        lockedState[index - 1] = false;
        event.target.className = "dice_regular";
    } else {
        event.target.className = "lockedDice";
        lockedState[index - 1] = true;
    }
    /* Old code left for reference, since I do not understand it.
    if (gameLogic.dices[index - 1].lockedState) {
        gameLogic.dices[index - 1].lockedState = false;
        event.target.className = "dice_regular";
    } else {
        event.target.className = "lockedDice";
        gameLogic.dices[index - 1].lockedState = true;
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

function lockScoreField(event) {
    if (canLockScoreField) {
        let field = event.target;
        field.className = "inputSelected";
        updateSumAndBonusAndTotal();
        canLockScoreField = false;
        /*gameLogic.newRound(); Need to implement this
        updateThrowCount();
        resetDices();*/
        //Need to make this a api call
        updateScoreFields();
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

//Commented out gamelogic
function restartGame() {
    //gameLogic.newGame();
    location.reload();
}