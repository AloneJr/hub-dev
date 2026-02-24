const boardElement = document.getElementById('board');
const turnoElement = document.getElementById('turno');
const cursor = document.getElementById('cursor-user');

// Estado do Jogo
let turno = 'white'; 
let tabuleiro = []; 

// Controle de Arraste (Xadrez)
let pecaArrastada = null;
let origemArraste = null; 
let startX, startY;

// ==========================================
// 1. CONFIGURAÇÃO (RESET CORRIGIDO)
// ==========================================

// CONSTANTE IMUTÁVEL: O Layout padrão do início do jogo
const LAYOUT_PADRAO = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

// Variável que muda durante o jogo (Cópia profunda do padrão)
let configuracaoAtual = JSON.parse(JSON.stringify(LAYOUT_PADRAO));

// --- CURSORES ---
document.addEventListener('mousemove', (e) => {
    if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
    // Move peça de xadrez
    if (pecaArrastada) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        pecaArrastada.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
});

function setCursor(estado) {
    if (cursor) {
        cursor.className = `cursor ${estado}`;
        if (estado === 'drop') {
            setTimeout(() => { if (!pecaArrastada) cursor.className = 'cursor idle'; }, 200);
        }
    }
}

// --- CRIAÇÃO DO TABULEIRO ---
function criarTabuleiro() {
    boardElement.innerHTML = ''; 
    tabuleiro = []; 

    for (let i = 0; i < 8; i++) {
        const linhaLogica = [];
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + j) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = i;
            square.dataset.col = j;

            const codigoPeca = configuracaoAtual[i][j];
            let objetoPeca = null;

            if (codigoPeca) {
                const cor = codigoPeca[0] === 'w' ? 'white' : 'black';
                const tipo = getNomePeca(codigoPeca[1]);
                objetoPeca = { cor, tipo, codigo: codigoPeca };

                const img = document.createElement('img');
                img.src = `assets/pieces/${codigoPeca[0]}_${tipo}.png`;
                img.classList.add('piece');
                img.draggable = false; 

                adicionarEventosPeca(img, i, j, objetoPeca);
                square.appendChild(img);
            }
            linhaLogica.push(objetoPeca);
            boardElement.appendChild(square);
        }
        tabuleiro.push(linhaLogica);
    }
}

function getNomePeca(char) {
    const mapa = { 'P': 'pawn', 'R': 'rook', 'N': 'knight', 'B': 'bishop', 'Q': 'queen', 'K': 'king' };
    return mapa[char];
}

// ==========================================
// 2. LÓGICA DE JOGO (MOVER E VALIDAR)
// ==========================================

function adicionarEventosPeca(img, linha, coluna, pecaObj) {
    img.addEventListener('mouseenter', () => {
        if (!pecaArrastada && pecaObj.cor === turno) {
            setCursor('grab');
            mostrarDicas(pecaObj, linha, coluna);
        }
    });

    img.addEventListener('mouseleave', () => {
        if (!pecaArrastada) {
            setCursor('idle');
            limparDicas();
        }
    });

    img.addEventListener('mousedown', (e) => iniciarArraste(e, img, linha, coluna));
    img.addEventListener('touchstart', (e) => iniciarArraste(e.touches[0], img, linha, coluna), {passive: false});
}

function iniciarArraste(e, img, linha, coluna) {
    const pecaObj = tabuleiro[linha][coluna];
    if (!pecaObj || pecaObj.cor !== turno) return;

    e.preventDefault();
    pecaArrastada = img;
    origemArraste = { linha, coluna };
    startX = e.clientX;
    startY = e.clientY;
    
    setCursor('hold');
    img.style.position = 'relative'; 
    img.style.zIndex = 9999; 
    img.style.pointerEvents = 'none'; 
    mostrarDicas(pecaObj, linha, coluna);

    document.addEventListener('mouseup', soltarPeca);
    document.addEventListener('touchend', soltarPeca);
}

function soltarPeca(e) {
    if (!pecaArrastada) return;

    document.removeEventListener('mouseup', soltarPeca);
    document.removeEventListener('touchend', soltarPeca);

    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const elementoAlvo = document.elementFromPoint(touch.clientX, touch.clientY);
    const casaAlvo = elementoAlvo ? elementoAlvo.closest('.square') : null;

    limparDicas();
    let movimentoValido = false;

    if (casaAlvo) {
        const linhaDestino = parseInt(casaAlvo.dataset.row);
        const colunaDestino = parseInt(casaAlvo.dataset.col);
        const pecaObj = tabuleiro[origemArraste.linha][origemArraste.coluna];

        if (validarMovimento(pecaObj, origemArraste, {linha: linhaDestino, coluna: colunaDestino}, tabuleiro)) {
            movimentoValido = true;
            executarMovimento(casaAlvo, linhaDestino, colunaDestino);
            setCursor('drop'); 
        } else {
            mostrarErro(casaAlvo);
            setCursor('idle');
        }
    } else {
        setCursor('idle');
    }

    if (!movimentoValido) animarRetorno();
}

function animarRetorno() {
    pecaArrastada.classList.add('snap-back');
    pecaArrastada.style.transform = 'translate(0px, 0px)';
    setTimeout(() => {
        if (pecaArrastada) {
            pecaArrastada.classList.remove('snap-back');
            pecaArrastada.style.zIndex = '';
            pecaArrastada.style.pointerEvents = 'auto';
            pecaArrastada = null;
        }
    }, 300);
}

function executarMovimento(casaDestino, r, c) {
    const pecaMovida = tabuleiro[origemArraste.linha][origemArraste.coluna];
    
    // Atualiza a Matriz de Configuração para persistir
    configuracaoAtual[origemArraste.linha][origemArraste.coluna] = null;
    configuracaoAtual[r][c] = pecaMovida.codigo; 
    
    // Troca Turno
    turno = turno === 'white' ? 'black' : 'white';
    turnoElement.innerText = turno === 'white' ? 'Brancas' : 'Pretas';
    
    pecaArrastada = null;
    
    // Recarrega o board
    criarTabuleiro(); 
}

// --- FUNÇÕES AUXILIARES DE REGRAS (Resumidas) ---
function validarMovimento(peca, origem, destino, matriz) {
    const diffL = destino.linha - origem.linha;
    const diffC = destino.coluna - origem.coluna;
    const distL = Math.abs(diffL);
    const distC = Math.abs(diffC);
    const alvo = matriz[destino.linha][destino.coluna];

    if (alvo && alvo.cor === peca.cor) return false;

    switch (peca.tipo) {
        case 'rook': return (distL === 0 || distC === 0) && isCaminhoLivre(origem, destino, matriz);
        case 'bishop': return (distL === distC) && isCaminhoLivre(origem, destino, matriz);
        case 'queen': return ((distL === 0 || distC === 0) || (distL === distC)) && isCaminhoLivre(origem, destino, matriz);
        case 'knight': return (distL === 2 && distC === 1) || (distL === 1 && distC === 2);
        case 'king': return distL <= 1 && distC <= 1;
        case 'pawn':
            const dir = (peca.cor === 'white') ? -1 : 1;
            const start = (peca.cor === 'white') ? 6 : 1;
            if (diffC === 0 && diffL === dir) return alvo === null;
            if (diffC === 0 && diffL === (2*dir) && origem.linha === start) return alvo === null && isCaminhoLivre(origem, destino, matriz);
            if (distC === 1 && diffL === dir) return alvo !== null;
            return false;
    }
    return false;
}

function isCaminhoLivre(origem, destino, matriz) {
    const passL = Math.sign(destino.linha - origem.linha);
    const passC = Math.sign(destino.coluna - origem.coluna);
    let l = origem.linha + passL, c = origem.coluna + passC;
    while (l !== destino.linha || c !== destino.coluna) {
        if (matriz[l][c] !== null) return false;
        l += passL; c += passC;
    }
    return true;
}

function mostrarDicas(peca, linha, coluna) {
    limparDicas();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (validarMovimento(peca, {linha, coluna}, {linha: r, coluna: c}, tabuleiro)) {
                const casa = document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
                if (casa) {
                    const dica = document.createElement('div');
                    dica.classList.add('hint-move');
                    casa.appendChild(dica);
                }
            }
        }
    }
}
function limparDicas() { document.querySelectorAll('.hint-move').forEach(d => d.remove()); }
function mostrarErro(casa) {
    const erro = document.createElement('div');
    erro.classList.add('error-move');
    casa.appendChild(erro);
    setTimeout(() => erro.classList.add('fade-out'), 100);
    setTimeout(() => erro.remove(), 2000);
}

// ==========================================
// 3. TEMA, RESET E EASTER EGG
// ==========================================

const btnTema = document.getElementById('btn-tema');
const btnReset = document.getElementById('btn-reset');
const body = document.body;
const treeEgg = document.getElementById('tree-egg');
const audioEgg = document.getElementById('sfx-egg');

// --- BOTÃO DE RESET (CORRIGIDO) ---
btnReset.addEventListener('click', () => {
    // 1. Clona a matriz padrão novamente (Reseta estado real)
    configuracaoAtual = JSON.parse(JSON.stringify(LAYOUT_PADRAO));
    
    // 2. Reseta variaveis
    turno = 'white';
    turnoElement.innerText = 'Brancas';
    
    // 3. Redesenha
    criarTabuleiro();
});

// --- TEMA (DARK MODE) ---
btnTema.addEventListener('click', (e) => {
    // Se estiver arrastando, não clica
    if (btnTema.classList.contains('dragging')) return;

    body.classList.toggle('dark');
    const img = btnTema.querySelector('img');
    
    if (body.classList.contains('dark')) {
        img.src = 'assets/buttons/sun.png';
        // Mostra árvore no Dark Mode
        treeEgg.classList.remove('hidden');
    } else {
        img.src = 'assets/buttons/moon.png';
        // Esconde árvore no Light Mode
        treeEgg.classList.add('hidden');
    }
});

// --- EASTER EGG (DRAG DO BOTÃO SOL) ---

let isDraggingBtn = false;
let btnStartX, btnStartY;
let btnInitialLeft, btnInitialTop;

btnTema.addEventListener('mousedown', (e) => {
    // Só arrasta se for Dark Mode (Sol)
    if (!body.classList.contains('dark')) return;

    e.preventDefault();
    isDraggingBtn = true;
    
    // Salva pos inicial do mouse
    btnStartX = e.clientX;
    btnStartY = e.clientY;

    // Prepara botão
    btnTema.classList.add('dragging');
    btnTema.classList.remove('returning'); // Para animação de volta se houver
    
    document.addEventListener('mousemove', moveBtnTema);
    document.addEventListener('mouseup', dropBtnTema);
});

function moveBtnTema(e) {
    if (!isDraggingBtn) return;
    
    const deltaX = e.clientX - btnStartX;
    const deltaY = e.clientY - btnStartY;
    
    btnTema.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
}

function dropBtnTema(e) {
    if (!isDraggingBtn) return;
    isDraggingBtn = false;

    document.removeEventListener('mousemove', moveBtnTema);
    document.removeEventListener('mouseup', dropBtnTema);

    // CHECA COLISÃO COM A ÁRVORE
    const btnRect = btnTema.getBoundingClientRect();
    const treeRect = treeEgg.getBoundingClientRect();

    // Lógica simples de colisão (sobreposição de retângulos)
    const colidiu = !(btnRect.right < treeRect.left || 
                      btnRect.left > treeRect.right || 
                      btnRect.bottom < treeRect.top || 
                      btnRect.top > treeRect.bottom);

    if (colidiu) {
        // Toca o som!
        audioEgg.currentTime = 0;
        audioEgg.play();
        
        // Efeito visual (opcional: a árvore balança ou algo assim)
        treeEgg.style.filter = "brightness(1.5)";
        setTimeout(() => treeEgg.style.filter = "", 200);
    }

    // Retorna o botão pro lugar (efeito elástico)
    btnTema.classList.remove('dragging');
    btnTema.classList.add('returning');
    btnTema.style.transform = `translate(0px, 0px)`;
}


// Inicialização
criarTabuleiro();
setCursor('idle');