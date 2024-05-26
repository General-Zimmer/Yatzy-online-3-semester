let førsteSpillerTilføjet = false

async function updateSpiller() {

    let spiller = await postSpiller()
    if (spiller == "") {
        return;
    }

    let spillerHeader = document.getElementById("spillerHeader")
    
    if(!førsteSpillerTilføjet){
        spillerHeader.innerText += " " + spiller
        førsteSpillerTilføjet = true
        
    } else {

        spillerHeader.innerText += ", " + spiller

    }
    spiller[0].placeholder = "Tilføj en spiller mere"
    
}


async function postSpiller(){
    let response = await fetch('/lobby', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({lobbySpiller: document.getElementsByClassName("username")[0].value})
    });
    let result = await response.json();
    console.log(result.message)
    if (response.status === 400) {
        return "";
    } else if (response.status === 200) {
        return document.getElementsByClassName("username")[0].value;
    }
    document.getElementsByClassName("username")[0].value = "";  // clear the text field
}