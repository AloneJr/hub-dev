if (!window.MAPA_CIENCIAS) {
    throw new Error("Os dados do mapa não foram carregados.");
}

const {
    tamanhoUniverso: TAMANHO_UNIVERSO,
    centro: CENTRO,
    limitesZoom: LIMITES_ZOOM,
    cores: CORES,
    rotulosRamos: ROTULOS_RAMOS,
    nos: dbCuriosidades
} = window.MAPA_CIENCIAS;

const viewport = document.getElementById("viewport");
const universe = document.getElementById("universe");
const svgLayer = document.getElementById("lines-layer");
const nodesLayer = document.getElementById("nodes-layer");
const starfield = document.getElementById("starfield");
const branchLabels = document.getElementById("branch-labels");
const infoPanel = document.getElementById("info-panel");
const zoomStatus = document.getElementById("zoom-status");
const modalFonte = document.getElementById("modal-fonte");

const nodesPorId = new Map(dbCuriosidades.map(item => [item.id, item]));
let zoom = window.innerWidth <= 720 ? 0.3 : 0.44;
let panX = 0;
let panY = 0;
let noAtivo = null;
let ultimoArraste = 0;

function limitar(valor, minimo, maximo) {
    return Math.min(maximo, Math.max(minimo, valor));
}

function obterZoomInicial() {
    return window.innerWidth <= 720 ? 0.3 : 0.44;
}

function validarDados() {
    const ids = new Set();

    dbCuriosidades.forEach(item => {
        if (ids.has(item.id)) console.warn(`ID duplicado no mapa: ${item.id}`);
        ids.add(item.id);

        if (!CORES[item.area]) console.warn(`Área sem cor definida: ${item.area}`);
        if (item.x < 0 || item.x > TAMANHO_UNIVERSO.largura || item.y < 0 || item.y > TAMANHO_UNIVERSO.altura) {
            console.warn(`Nó fora do Universo: ${item.id}`);
        }

        item.conexoes.forEach(id => {
            if (!nodesPorId.has(id)) console.warn(`Conexão inexistente: ${item.id} → ${id}`);
        });
    });
}

function pseudoAleatorio(semente) {
    let valor = semente >>> 0;
    return () => {
        valor += 0x6D2B79F5;
        let resultado = valor;
        resultado = Math.imul(resultado ^ (resultado >>> 15), resultado | 1);
        resultado ^= resultado + Math.imul(resultado ^ (resultado >>> 7), resultado | 61);
        return ((resultado ^ (resultado >>> 14)) >>> 0) / 4294967296;
    };
}

function criarCeu() {
    const sortear = pseudoAleatorio(1378);
    const fragmento = document.createDocumentFragment();
    const tons = ["#ffffff", "#dbe6ff", "#a9c4ff", "#ffe7bd"];

    for (let i = 0; i < 340; i += 1) {
        const estrela = document.createElement("i");
        const tamanho = sortear() > 0.9 ? 3 : sortear() > 0.6 ? 2 : 1;
        estrela.className = "background-star";
        estrela.style.left = `${Math.round(sortear() * TAMANHO_UNIVERSO.largura)}px`;
        estrela.style.top = `${Math.round(sortear() * TAMANHO_UNIVERSO.altura)}px`;
        const opacidade = 0.28 + sortear() * 0.62;
        estrela.style.setProperty("--size", `${tamanho}px`);
        estrela.style.setProperty("--glow-size", `${tamanho * 4}px`);
        estrela.style.setProperty("--opacity", opacidade.toFixed(2));
        estrela.style.setProperty("--opacity-min", (opacidade * 0.5).toFixed(2));
        estrela.style.setProperty("--duration", `${2.4 + sortear() * 4.5}s`);
        estrela.style.setProperty("--delay", `${-sortear() * 5}s`);
        estrela.style.setProperty("--star-color", tons[Math.floor(sortear() * tons.length)]);
        fragmento.appendChild(estrela);
    }

    starfield.appendChild(fragmento);
}

function criarCaminho(origem, destino) {
    const distanciaX = destino.x - origem.x;
    const controle = Math.max(90, Math.abs(distanciaX) * 0.48);
    const direcao = Math.sign(distanciaX) || 1;

    return [
        `M ${origem.x} ${origem.y}`,
        `C ${origem.x + controle * direcao} ${origem.y},`,
        `${destino.x - controle * direcao} ${destino.y},`,
        `${destino.x} ${destino.y}`
    ].join(" ");
}

function adicionarConexao(origem, destino) {
    if (!destino) return;
    const cor = CORES[destino.area] || CORES.origem;
    const caminho = criarCaminho(origem, destino);

    ["connection-glow", "connection"].forEach(classe => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", caminho);
        path.setAttribute("class", classe);
        path.style.setProperty("--line-color", cor);
        svgLayer.appendChild(path);
    });
}

function criarNo(item) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "knowledge-node";
    botao.dataset.id = item.id;
    botao.dataset.area = item.area;
    botao.dataset.level = item.nivel;
    botao.style.left = `${item.x}px`;
    botao.style.top = `${item.y}px`;
    botao.style.setProperty("--node-color", CORES[item.area]);
    botao.setAttribute("aria-label", `${item.titulo}. ${item.escala}`);

    const estrela = document.createElement("span");
    estrela.className = "node-star";
    estrela.setAttribute("aria-hidden", "true");

    const titulo = document.createElement("span");
    titulo.className = "node-label";
    titulo.textContent = item.titulo;

    botao.append(estrela, titulo);
    botao.addEventListener("click", () => {
        if (Date.now() - ultimoArraste < 180) return;
        abrirPainel(item, botao);
    });

    nodesLayer.appendChild(botao);
}

function renderizarMapa() {
    dbCuriosidades.forEach(item => {
        item.conexoes.forEach(id => adicionarConexao(item, nodesPorId.get(id)));
    });

    ROTULOS_RAMOS.forEach(ramo => {
        const titulo = document.createElement("span");
        titulo.className = "branch-title";
        titulo.textContent = ramo.nome;
        titulo.style.left = `${ramo.x}px`;
        titulo.style.top = `${ramo.y}px`;
        titulo.style.setProperty("--branch-color", CORES[ramo.area]);
        branchLabels.appendChild(titulo);
    });

    dbCuriosidades.forEach(criarNo);
}

function atualizarCamera() {
    universe.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
    universe.style.setProperty("--counter-scale", (1 / zoom).toFixed(4));
    viewport.dataset.distance = zoom < 0.42 ? "far" : "near";
    zoomStatus.value = `${Math.round(zoom * 100)}%`;
    zoomStatus.textContent = zoomStatus.value;
}

function centralizarMapa(novoZoom = zoom) {
    zoom = limitar(novoZoom, LIMITES_ZOOM.minimo, LIMITES_ZOOM.maximo);
    panX = window.innerWidth / 2 - CENTRO.x * zoom;
    panY = window.innerHeight / 2 - CENTRO.y * zoom;
    atualizarCamera();
}

function ajustarZoom(novoZoom, pontoX = window.innerWidth / 2, pontoY = window.innerHeight / 2) {
    const proximoZoom = limitar(novoZoom, LIMITES_ZOOM.minimo, LIMITES_ZOOM.maximo);
    const mundoX = (pontoX - panX) / zoom;
    const mundoY = (pontoY - panY) / zoom;

    panX = pontoX - mundoX * proximoZoom;
    panY = pontoY - mundoY * proximoZoom;
    zoom = proximoZoom;
    atualizarCamera();
}

function abrirPainel(item, botao) {
    if (noAtivo) noAtivo.classList.remove("is-active");
    noAtivo = botao;
    noAtivo.classList.add("is-active");

    infoPanel.style.setProperty("--panel-color", CORES[item.area]);
    document.getElementById("modal-area").textContent = item.area === "origem" ? "Origem comum" : item.area;
    document.getElementById("modal-escala").textContent = item.escala;
    document.getElementById("modal-titulo").textContent = item.titulo;
    document.getElementById("modal-texto").textContent = item.conteudo;

    const quantidade = item.conexoes.length;
    document.getElementById("modal-connections").textContent = quantidade
        ? `${quantidade} ${quantidade === 1 ? "caminho continua" : "caminhos continuam"} a partir daqui.`
        : "Ponta atual desta constelação.";

    modalFonte.href = item.fonte.url;
    modalFonte.textContent = `${item.fonte.nome} ↗`;
    infoPanel.hidden = false;
}

function fecharPainel() {
    infoPanel.hidden = true;
    if (noAtivo) noAtivo.classList.remove("is-active");
    noAtivo = null;
}

const ponteiros = new Map();
let ultimoPonto = null;
let gestoPinch = null;
let movimentoAcumulado = 0;

function distanciaEntre(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

function pontoMedio(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

viewport.addEventListener("pointerdown", event => {
    if (event.target.closest(".knowledge-node")) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;

    viewport.setPointerCapture(event.pointerId);
    ponteiros.set(event.pointerId, { x: event.clientX, y: event.clientY });
    movimentoAcumulado = 0;

    if (ponteiros.size === 1) {
        ultimoPonto = { x: event.clientX, y: event.clientY };
        viewport.classList.add("is-dragging");
    } else if (ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()];
        const meio = pontoMedio(a, b);
        gestoPinch = {
            distancia: distanciaEntre(a, b),
            zoomInicial: zoom,
            mundoX: (meio.x - panX) / zoom,
            mundoY: (meio.y - panY) / zoom
        };
    }
});

viewport.addEventListener("pointermove", event => {
    if (!ponteiros.has(event.pointerId)) return;
    const anterior = ponteiros.get(event.pointerId);
    ponteiros.set(event.pointerId, { x: event.clientX, y: event.clientY });
    movimentoAcumulado += Math.hypot(event.clientX - anterior.x, event.clientY - anterior.y);

    if (ponteiros.size === 1 && ultimoPonto) {
        panX += event.clientX - ultimoPonto.x;
        panY += event.clientY - ultimoPonto.y;
        ultimoPonto = { x: event.clientX, y: event.clientY };
        atualizarCamera();
    } else if (ponteiros.size === 2 && gestoPinch) {
        const [a, b] = [...ponteiros.values()];
        const meio = pontoMedio(a, b);
        const escala = distanciaEntre(a, b) / gestoPinch.distancia;
        zoom = limitar(gestoPinch.zoomInicial * escala, LIMITES_ZOOM.minimo, LIMITES_ZOOM.maximo);
        panX = meio.x - gestoPinch.mundoX * zoom;
        panY = meio.y - gestoPinch.mundoY * zoom;
        atualizarCamera();
    }
});

function finalizarPonteiro(event) {
    if (!ponteiros.has(event.pointerId)) return;
    ponteiros.delete(event.pointerId);

    if (movimentoAcumulado > 7) ultimoArraste = Date.now();
    if (ponteiros.size === 1) {
        const restante = [...ponteiros.values()][0];
        ultimoPonto = { ...restante };
    } else {
        ultimoPonto = null;
        gestoPinch = null;
        viewport.classList.remove("is-dragging");
    }
}

viewport.addEventListener("pointerup", finalizarPonteiro);
viewport.addEventListener("pointercancel", finalizarPonteiro);

viewport.addEventListener("wheel", event => {
    event.preventDefault();
    const intensidade = Math.exp(-event.deltaY * 0.0012);
    ajustarZoom(zoom * intensidade, event.clientX, event.clientY);
}, { passive: false });

document.getElementById("zoom-in").addEventListener("click", () => ajustarZoom(zoom * 1.22));
document.getElementById("zoom-out").addEventListener("click", () => ajustarZoom(zoom / 1.22));
document.getElementById("reset-view").addEventListener("click", () => centralizarMapa(obterZoomInicial()));
document.getElementById("fechar-modal").addEventListener("click", fecharPainel);

viewport.addEventListener("keydown", event => {
    const deslocamento = 56;
    const teclasMapa = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "+", "=", "-", "0", "Escape"];
    if (!teclasMapa.includes(event.key)) return;
    event.preventDefault();

    if (event.key === "ArrowUp") panY += deslocamento;
    if (event.key === "ArrowDown") panY -= deslocamento;
    if (event.key === "ArrowLeft") panX += deslocamento;
    if (event.key === "ArrowRight") panX -= deslocamento;
    if (event.key === "+" || event.key === "=") ajustarZoom(zoom * 1.18);
    if (event.key === "-") ajustarZoom(zoom / 1.18);
    if (event.key === "0") centralizarMapa(obterZoomInicial());
    if (event.key === "Escape") fecharPainel();
    atualizarCamera();
});

let larguraAnterior = window.innerWidth;
let alturaAnterior = window.innerHeight;
window.addEventListener("resize", () => {
    panX += (window.innerWidth - larguraAnterior) / 2;
    panY += (window.innerHeight - alturaAnterior) / 2;
    larguraAnterior = window.innerWidth;
    alturaAnterior = window.innerHeight;
    atualizarCamera();
});

const introLayer = document.getElementById("intro-layer");
let introCancelada = false;

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function revelarTexto(id, leitura = 650) {
    if (introCancelada) return;
    const elemento = document.getElementById(id);
    const texto = elemento.textContent;
    elemento.textContent = "";
    elemento.style.display = "flex";

    const letras = [...texto].map(letra => {
        const span = document.createElement("span");
        span.textContent = letra === " " ? "\u00a0" : letra;
        elemento.appendChild(span);
        return span;
    });

    const ordem = [...letras].sort(() => Math.random() - 0.5);
    ordem.forEach((letra, indice) => setTimeout(() => { letra.style.opacity = "1"; }, indice * 14));
    await esperar(ordem.length * 14 + leitura);
    if (introCancelada) return;
    elemento.style.opacity = "0";
    await esperar(420);
    elemento.style.display = "none";
}

function finalizarIntro() {
    if (introCancelada) return;
    introCancelada = true;
    introLayer.classList.add("is-finished");

    try {
        localStorage.setItem("introAssistidaV2", "true");
    } catch (erro) {
        console.info("A preferência da introdução não pôde ser salva.", erro);
    }
}

async function iniciarJornada() {
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let jaAssistiu = false;

    try {
        jaAssistiu = localStorage.getItem("introAssistidaV2") === "true";
    } catch (erro) {
        console.info("A preferência da introdução não pôde ser lida.", erro);
    }

    if (jaAssistiu || reduzirMovimento) {
        finalizarIntro();
        return;
    }

    await esperar(350);
    await revelarTexto("texto-1");
    await revelarTexto("texto-2");
    await revelarTexto("texto-3");
    await revelarTexto("texto-final", 850);
    finalizarIntro();
}

document.getElementById("pular-intro").addEventListener("click", finalizarIntro);

validarDados();
criarCeu();
renderizarMapa();
centralizarMapa(zoom);
iniciarJornada();
