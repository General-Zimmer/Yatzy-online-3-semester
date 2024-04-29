import * as gameLogic from "./game-logic.js";



// Basic game logic for front-end (Advanced logic in Game-logic file)
let canLockScoreField = false;

let canRoll = true;




// Selection of elements for Eventhandling
let inputfields = document.getElementsByTagName("input");

let rollBtn = document.querySelector(".roll-button");

let diceImages = document.getElementsByTagName("img");

updateScoreFields();
updateSumAndBonusAndTotal();

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

async function rollButton() {
    if (!canRoll) {
        return;
    }
    if (gameLogic.roundCount == 15) {
        if (window.confirm("Spillet er slut, vil du starte et nyt spil?")) {
            restartGame();
        } else {
            return;
        }
    }
    if (gameLogic.throwCount == 3) {
        return;
    }
    if (checkAllDicesLocked()) {
        alert("Du har låst alle terninger, aflås en for at rulle");
        return;
    }
    const delay = ms => new Promise(res => setTimeout(res, ms));

    gameLogic.rollDice();

    let diceHolders = [];
    canRoll = false;
    canLockScoreField = false;
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
    await delay(2100);
    updateThrowCount();
    updateScoreFields();
    canLockScoreField = true;
    canRoll = true;
}

function resetDices() {
    for (let i = 0; i < diceImages.length; i++) {
        diceImages[i].className = "dice_regular";
        diceImages[i].src = `./assets/empty-dice_${i}.png`;
    }
}

function updateScoreFields() {
    let results = gameLogic.getResults();

    for (let i = 0; i < inputfields.length; i++) {
        let inputfield = inputfields[i];
        if (inputfield.className != "inputSelected" && inputfield.id != "sum" && inputfield.id != "bonus" && inputfield.id != "total") {
            inputfields[i].value = results[i];
        }
    }
}

function updateThrowCount() {
    let throwDisplay = document.getElementById("throwDisplay");
    throwDisplay.textContent = `Throw ${gameLogic.throwCount}`;
}

function lockDice(event) {
    if (gameLogic.throwCount == 0) {
        return;
    }
    let index = event.target.id.split("-")[2];
    if (gameLogic.dices[index - 1].lockedState) {
        gameLogic.dices[index - 1].lockedState = false;
        event.target.className = "dice_regular";
    } else {
        event.target.className = "lockedDice";
        gameLogic.dices[index - 1].lockedState = true;
    }

}

function checkAllDicesLocked() {
    let dices = gameLogic.dices;
    let allDicesLocked = true;
    for (let i = 0; i < dices.length; i++) {
        if (!dices[i].lockedState) {
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
        gameLogic.newRound();
        updateThrowCount();
        resetDices();
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

function restartGame() {
    gameLogic.newGame();
    location.reload();
}