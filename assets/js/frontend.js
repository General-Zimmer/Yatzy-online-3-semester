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

// Functions for playing the game
// ------------------------------------------------------------------------------------------------

// Function for rolling the dice
async function rollButton() {
    // Check if the player is allowed to roll
    if (!canRoll) {
        alert("Du må ikke kaste nu!");
        return;
    }
    if (checkAllDicesLocked()) {
        alert("Du har låst alle terningerne");
        return;
    }
    
    //Locking
    canRoll = false;
    canLockScoreField = false;
    
    //Delay while fetching the new dice values.
    const delay = ms => new Promise(res => setTimeout(res, ms));

    //Fetching from server - POST
    let gameDataJSON = await postData('http://localhost:8000/api/yatzyAPI/throw',{})

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

   updateGUI()
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

// Locks the score field and sends the data to the server. This ends the turn for the player
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

// Locks the dice and sends the data to the server
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

// Generic fetch function for POST-ing JSON data
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
    return gameData
}

// Functions for updating the GUI
// ------------------------------------------------------------------------------------------------

// Fetches the data from the server and displays it in the GUI - This function must called when loading the file
async function updateGUI(){
    let response = await fetch("http://localhost:8000/api/yatzyAPI/current", {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json"
        },
    })
    if (response.status === 400) {
        console.log("Error in fetching data from server")
        window.location.href = "/"
        return;
    }

    let gameData = await response.json();

    if (gameData.round === null) window.location.href = "/points" //Redirect to points page if game is over

    //Displaying the data
    throwDisplay.textContent = `Throw ${gameData.throwCount}`
    player.textContent = gameData.name
    round.textContent = `Round ${gameData.round}`
    initScoreFields(gameData.results) //Previous results
    updateSumAndBonusAndTotal() //Only using past results
    updateScoreFields(gameData.diceResults) //The possible results
    displayDices(gameData.dices)
    

    //Handling the players permission to roll and lock
    if (gameData.throwCount != 0) canLockScoreField = true;
    if (gameData.throwCount < 3) {
        canRoll = true;
    } else {
        canRoll = false;
    }
}

// Displays the dices in the GUI
function displayDices(dices) {
    for (let i = 0; i < diceImages.length; i++) {
        if (dices[i].lockedState) {
            diceImages[i].className = "lockedDice"
        } else {
            diceImages[i].className = "dice_regular"
        }
        if (dices[i].value == 0) {
            diceImages[i].src = `./pics/empty-dice_${i}.png`
        } else {
            diceImages[i].src = `./pics/die_${dices[i].value}.png`
        }
    }
}

// Updates the score fields with the results of the last dice roll
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

//Initializes the score fields with the players previous results
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

// Updates the sum, bonus and total fields
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

