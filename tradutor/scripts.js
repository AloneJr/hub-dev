/*
    To Do List:
       [x] Saber quando o usuário clica no botão
       [x] Pegar o valor do input
       [x] Mandar o servidor traduzir
       [x] Pegar a tradução do servidor
       [x] Colocar a tradução na tela
*/

// Variaveis
let idioma = document.querySelector(".idioma")
let inputTxt = document.querySelector(".input-texto")
let outputTxt = document.querySelector(".traducao")

function toggleTema() {
    document.body.classList.toggle("claro")

    let botao = document.querySelector(".b-tema")

    if (document.body.classList.contains("claro")) {
        botao.innerHTML = "🌞"
    } else {
        botao.innerHTML = "🌙"
    }
}
// Tradução ao pressionar Enter
inputTxt.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        traduzir()
    }
})

async function traduzir() {

    let botao_traduzir = document.querySelector(".b-traduzir")   

    // 1° - Pegar o valor do input    
    let texto = inputTxt.value    
    let idioma_selecionado = idioma.value
    if (texto.length == 0) {
        outputTxt.innerHTML = "Por favor, digite um texto para traduzir."
        return
    }
    botao_traduzir.classList.add("loading")
    botao_traduzir.classList.add("girando")
    botao_traduzir.classList.add("pulsando")
    // 2° - Mandar o servidor traduzir   
    let url = `https://api.mymemory.translated.net/get?q=` + texto + "&langpair=pt|" + idioma_selecionado
    // 3° - Pegar a tradução do servidor
    let traducao = await fetch(url)
    let dados = await traducao.json()
    // 4° - Colocar a tradução na tela
    outputTxt.innerHTML = dados.responseData.translatedText
    botao_traduzir.classList.remove("loading")
    botao_traduzir.classList.remove("girando")
    botao_traduzir.classList.remove("pulsando")

    // Para debugar, ver o que o servidor retornou, enquanto testes
    // console.log(dados.responseData.translatedText)

}

function microfone() {
    // Verificar se o navegador suporta reconhecimento de voz
    const reconhecimento_voz = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!reconhecimento_voz) {
        alert("Seu navegador não suporta reconhecimento de voz.")
        return
    }
    // Configurar o reconhecimento de voz
    const reconhecimento = new reconhecimento_voz()
    reconhecimento.lang = "pt-BR"
    reconhecimento.continuous = false
    reconhecimento.interimResults = false

    function pararAnimacao() {
        const botao_microfone = document.querySelector(".b-microfone")
        botao_microfone.classList.remove("mic-ativo")
    }

    // Iniciar o reconhecimento de voz
    reconhecimento.start()
    // Manipular os eventos do reconhecimento de voz
    //Enquanto estiver ouvindo o microfone continua captando a voz do usuário
    //quando parar de falar ele para de captar
    reconhecimento.onstart = function() {
        outputTxt.innerHTML = "Ouvindo..."
        let botao_microfone = document.querySelector(".b-microfone")
        botao_microfone.classList.add("mic-ativo")
    }
    // Resultado do reconhecimento de voz
    reconhecimento.onresult = function(event) {        
        let texto_falado = event.results[0][0].transcript
        inputTxt.value = texto_falado        
        traduzir()
        reconhecimento.stop()
        pararAnimacao()
        // Para debugar, ver o que o reconhecimento de voz captou, enquanto testes --Não estava funcionando(anim. ñ parava)--
        // console.log("era pra parar animação aqui")        
    }
    // Erro no reconhecimento de voz
    reconhecimento.onerror = function() {
        reconhecimento.stop()
        pararAnimacao()
        outputTxt.innerHTML = "Erro no reconhecimento de voz: "
    }
    // O reconhecimento de voz estava funcionando e traduzindo após perfeitamente, ams o site ainda mostrava a animação do botão
    //com ajuda da IA aprendi sobre controle de estado, "resolvendo" todos os casos    
    reconhecimento.onend = function() {
        pararAnimacao()
    }
}
