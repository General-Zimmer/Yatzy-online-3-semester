let førsteSpillerTilføjet = false

    function updateSpiller() {

        let spiller = document.getElementsByClassName("username");
        if(spiller[0].value.trim() === ""){
            return
        }

        let spillerHeader = document.getElementById("spillerHeader")
        
        if(!førsteSpillerTilføjet){
            spillerHeader.innerText += " " + spiller[0].value
            førsteSpillerTilføjet = true
            
        } else {

            spillerHeader.innerText += ", " + spiller[0].value

        }
        spiller[0].placeholder = "Tilføj en spiller mere"
        

        postSpiller()
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
        if (result.message === "Player added to lobby"){
            console.log("Player added to lobby")
        }
        document.getElementsByClassName("username")[0].value = "";  // clear the text field
    }