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
    }