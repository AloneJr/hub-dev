(() => {
    'use strict';

    const Engine = window.ChessEngine;
    if (!Engine) throw new Error('O motor de xadrez não foi carregado.');

    const boardElement = document.getElementById('board');
    const turnElement = document.getElementById('turno');
    const gameStatusElement = document.getElementById('estado-jogo');
    const gameMessageElement = document.getElementById('mensagem-jogo');
    const cursor = document.getElementById('game-cursor');
    const turnCursor = document.getElementById('turn-cursor');
    const undoButton = document.getElementById('btn-undo');
    const resetButton = document.getElementById('btn-reset');
    const themeButton = document.getElementById('btn-tema');
    const themeIcon = document.getElementById('tema-icone');
    const treeEgg = document.getElementById('tree-egg');
    const treeTooltip = document.getElementById('tree-tooltip');
    const eggAudio = document.getElementById('sfx-egg');
    const achievementAudio = document.getElementById('sfx-achievement');
    const capturedByWhiteElement = document.getElementById('captures-white');
    const capturedByBlackElement = document.getElementById('captures-black');
    const historyElement = document.getElementById('move-history');
    const promotionModal = document.getElementById('promotion-modal');
    const promotionOptions = document.getElementById('promotion-options');
    const cancelPromotionButton = document.getElementById('cancel-promotion');

    const PIECE_NAMES = {
        P: 'Peão',
        R: 'Torre',
        N: 'Cavalo',
        B: 'Bispo',
        Q: 'Dama',
        K: 'Rei'
    };

    const PIECE_ASSETS = {
        P: 'pawn',
        R: 'rook',
        N: 'knight',
        B: 'bishop',
        Q: 'queen',
        K: 'king'
    };

    const FINISHED_STATUSES = new Set([
        'checkmate',
        'stalemate',
        'draw-insufficient',
        'draw-repetition',
        'draw-50-move'
    ]);

    let gameState = Engine.createInitialState();
    let currentStatus = Engine.getGameStatus(gameState);
    let undoStack = [];
    let selectedSquare = null;
    let pendingPromotion = null;
    let interactionMessage = '';
    let dragState = null;
    let suppressClickUntil = 0;
    let themeDrag = null;
    let suppressThemeClick = false;

    function isGameFinished() {
        return FINISHED_STATUSES.has(currentStatus.type);
    }

    function colorName(color, lowercase = false) {
        const name = color === Engine.WHITE ? 'Brancas' : 'Pretas';
        return lowercase ? name.toLowerCase() : name;
    }

    function pieceName(piece, lowercase = false) {
        const name = PIECE_NAMES[Engine.pieceType(piece)];
        return lowercase ? name.toLowerCase() : name;
    }

    function pieceAsset(piece) {
        return `assets/pieces/${piece[0]}_${PIECE_ASSETS[Engine.pieceType(piece)]}.png`;
    }

    function squareLabel(row, col) {
        return Engine.toAlgebraic({ row, col });
    }

    function sameSquare(a, b) {
        return Boolean(a && b && a.row === b.row && a.col === b.col);
    }

    function safePlay(audio) {
        if (!audio) return;
        audio.currentTime = 0;
        const playback = audio.play();
        if (playback && typeof playback.catch === 'function') playback.catch(() => {});
    }

    function setCursorState(state) {
        cursor.classList.remove('idle', 'grab', 'hold', 'drop');
        cursor.classList.add(state);
    }

    function updateTurnCursor() {
        const isWhiteTurn = gameState.turn === Engine.WHITE;
        cursor.classList.toggle('user-turn', isWhiteTurn);
        cursor.classList.toggle('ai-turn', !isWhiteTurn);
        turnCursor.classList.toggle('user-turn', isWhiteTurn);
        turnCursor.classList.toggle('ai-turn', !isWhiteTurn);
        setCursorState('idle');
    }

    function createCoordinateLabel(text, className) {
        const label = document.createElement('span');
        label.className = `coordinate ${className}`;
        label.textContent = text;
        label.setAttribute('aria-hidden', 'true');
        return label;
    }

    function getSelectedMoves() {
        if (!selectedSquare || isGameFinished()) return [];
        return Engine.generateLegalMoves(gameState, selectedSquare);
    }

    function createPieceImage(piece, row, col) {
        const image = document.createElement('img');
        image.src = pieceAsset(piece);
        image.className = `piece piece-${Engine.pieceColor(piece) === Engine.WHITE ? 'white' : 'black'}`;
        image.alt = `${pieceName(piece)} ${colorName(Engine.pieceColor(piece), true)}`;
        image.draggable = false;
        image.dataset.row = row;
        image.dataset.col = col;

        if (!isGameFinished() && Engine.pieceColor(piece) === gameState.turn) {
            image.classList.add('movable');
            image.addEventListener('pointerdown', startPieceDrag);
            image.addEventListener('pointerenter', () => setCursorState('grab'));
            image.addEventListener('pointerleave', () => {
                if (!dragState) setCursorState('idle');
            });
        }

        return image;
    }

    function describeSquare(piece, row, col, legalTarget) {
        const coordinate = squareLabel(row, col);
        const contents = piece
            ? `${pieceName(piece)} ${colorName(Engine.pieceColor(piece), true)}`
            : 'vazia';
        return `${coordinate}, ${contents}${legalTarget ? ', movimento legal' : ''}`;
    }

    function renderBoard() {
        const selectedMoves = getSelectedMoves();
        const legalTargets = new Map();

        selectedMoves.forEach((move) => {
            const key = `${move.to.row},${move.to.col}`;
            const existing = legalTargets.get(key) || { capture: false };
            existing.capture = existing.capture
                || Boolean(gameState.board[move.to.row][move.to.col])
                || Boolean(move.enPassant);
            legalTargets.set(key, existing);
        });

        const fragment = document.createDocumentFragment();
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row += 1) {
            for (let col = 0; col < 8; col += 1) {
                const piece = gameState.board[row][col];
                const targetData = legalTargets.get(`${row},${col}`);
                const square = document.createElement('div');

                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.setAttribute('role', 'gridcell');
                square.setAttribute('aria-label', describeSquare(piece, row, col, Boolean(targetData)));
                square.tabIndex = 0;
                square.addEventListener('click', () => handleSquareActivation(row, col));
                square.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSquareActivation(row, col);
                    }
                });

                if (sameSquare(selectedSquare, { row, col })) square.classList.add('selected');

                if (targetData) {
                    square.classList.add('legal-target');
                    if (targetData.capture) square.classList.add('capture-target');
                    const hint = document.createElement('span');
                    hint.className = 'hint-move';
                    hint.setAttribute('aria-hidden', 'true');
                    square.appendChild(hint);
                }

                if (gameState.lastMove
                    && (sameSquare(gameState.lastMove.from, { row, col })
                        || sameSquare(gameState.lastMove.to, { row, col }))) {
                    square.classList.add('last-move');
                }

                if (currentStatus.inCheck && piece === `${gameState.turn}K`) {
                    square.classList.add('king-in-check');
                }

                if (piece) square.appendChild(createPieceImage(piece, row, col));
                if (col === 0) square.appendChild(createCoordinateLabel(String(8 - row), 'rank-label'));
                if (row === 7) square.appendChild(createCoordinateLabel('abcdefgh'[col], 'file-label'));

                fragment.appendChild(square);
            }
        }

        boardElement.appendChild(fragment);
        boardElement.classList.toggle('game-over', isGameFinished());
    }

    function statusPresentation(status) {
        const player = colorName(gameState.turn);
        const winner = status.winner ? colorName(status.winner) : '';

        const presentations = {
            active: {
                label: 'Jogando',
                message: `${player} jogam. Arraste uma peça ou toque para selecionar.`
            },
            check: {
                label: 'Xeque',
                message: `${player} estão em xeque. Escolha uma resposta legal.`
            },
            checkmate: {
                label: 'Xeque-mate',
                message: `${winner} venceram por xeque-mate.`
            },
            stalemate: {
                label: 'Empate',
                message: 'Empate por afogamento: não há jogadas legais.'
            },
            'draw-insufficient': {
                label: 'Empate',
                message: 'Empate por material insuficiente.'
            },
            'draw-repetition': {
                label: 'Empate',
                message: 'Empate por repetição tripla da posição.'
            },
            'draw-50-move': {
                label: 'Empate',
                message: 'Empate pela regra dos 50 movimentos.'
            }
        };

        return presentations[status.type];
    }

    function renderStatus() {
        const presentation = statusPresentation(currentStatus);
        turnElement.textContent = colorName(gameState.turn);
        gameStatusElement.textContent = presentation.label;
        gameStatusElement.dataset.status = currentStatus.type;
        gameMessageElement.textContent = interactionMessage || presentation.message;
        undoButton.disabled = undoStack.length === 0;
        updateTurnCursor();
    }

    function renderCapturedList(element, moves, emptyText) {
        element.innerHTML = '';

        if (!moves.length) {
            const empty = document.createElement('span');
            empty.className = 'empty-state';
            empty.textContent = emptyText;
            element.appendChild(empty);
            return;
        }

        moves.forEach((move) => {
            const image = document.createElement('img');
            image.src = pieceAsset(move.captured);
            image.alt = `${pieceName(move.captured)} ${colorName(Engine.pieceColor(move.captured), true)}`;
            image.title = image.alt;
            element.appendChild(image);
        });
    }

    function renderCapturedPieces() {
        const capturesByWhite = gameState.moveHistory.filter((move) => (
            move.color === Engine.WHITE && move.captured
        ));
        const capturesByBlack = gameState.moveHistory.filter((move) => (
            move.color === Engine.BLACK && move.captured
        ));

        renderCapturedList(capturedByWhiteElement, capturesByWhite, 'Nenhuma');
        renderCapturedList(capturedByBlackElement, capturesByBlack, 'Nenhuma');
    }

    function renderHistory() {
        historyElement.innerHTML = '';

        if (!gameState.moveHistory.length) {
            const empty = document.createElement('li');
            empty.className = 'empty-history';
            empty.textContent = 'A partida ainda não começou.';
            historyElement.appendChild(empty);
            return;
        }

        const rows = [];
        const rowsByNumber = new Map();
        gameState.moveHistory.forEach((move) => {
            let row = rowsByNumber.get(move.moveNumber);
            if (!row) {
                row = { number: move.moveNumber, white: '', black: '' };
                rows.push(row);
                rowsByNumber.set(move.moveNumber, row);
            }
            row[move.color === Engine.WHITE ? 'white' : 'black'] = move.san;
        });

        rows.forEach((row) => {
            const item = document.createElement('li');
            item.className = 'history-row';

            const number = document.createElement('span');
            number.className = 'move-number';
            number.textContent = `${row.number}.`;

            const white = document.createElement('span');
            white.textContent = row.white || '—';

            const black = document.createElement('span');
            black.textContent = row.black || '—';

            item.append(number, white, black);
            historyElement.appendChild(item);
        });

        historyElement.scrollTop = historyElement.scrollHeight;
    }

    function renderAll() {
        currentStatus = Engine.getGameStatus(gameState);
        renderBoard();
        renderStatus();
        renderCapturedPieces();
        renderHistory();
    }

    function selectSquare(row, col) {
        selectedSquare = { row, col };
        const piece = gameState.board[row][col];
        interactionMessage = `${pieceName(piece)} selecionado em ${squareLabel(row, col)}.`;
        renderBoard();
        renderStatus();
    }

    function flashInvalidSquare(row, col) {
        const square = boardElement.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        if (!square) return;
        square.classList.add('invalid-move');
        window.setTimeout(() => square.classList.remove('invalid-move'), 850);
    }

    function handleSquareActivation(row, col) {
        if (Date.now() < suppressClickUntil || pendingPromotion) return;

        if (isGameFinished()) {
            interactionMessage = 'A partida terminou. Desfaça uma jogada ou reinicie para continuar.';
            renderStatus();
            return;
        }

        const piece = gameState.board[row][col];

        if (!selectedSquare) {
            if (piece && Engine.pieceColor(piece) === gameState.turn) {
                selectSquare(row, col);
            } else {
                interactionMessage = `É a vez das ${colorName(gameState.turn, true)}.`;
                renderStatus();
            }
            return;
        }

        if (sameSquare(selectedSquare, { row, col })) {
            selectedSquare = null;
            interactionMessage = '';
            renderBoard();
            renderStatus();
            return;
        }

        if (piece && Engine.pieceColor(piece) === gameState.turn) {
            selectSquare(row, col);
            return;
        }

        attemptMove(selectedSquare, { row, col });
    }

    function attemptMove(from, to) {
        const candidates = Engine.findLegalMoves(gameState, from, to);

        if (!candidates.length) {
            interactionMessage = `${squareLabel(from.row, from.col)} → ${squareLabel(to.row, to.col)} não é uma jogada legal.`;
            renderStatus();
            flashInvalidSquare(to.row, to.col);
            return false;
        }

        if (candidates.some((move) => move.promotion)) {
            openPromotion(candidates);
            return true;
        }

        commitMove(candidates[0]);
        return true;
    }

    function commitMove(move) {
        const previousStatus = currentStatus.type;
        undoStack.push(gameState);
        gameState = Engine.makeMove(gameState, move);
        selectedSquare = null;
        interactionMessage = '';
        closePromotion();
        renderAll();
        setCursorState('drop');
        window.setTimeout(() => setCursorState('idle'), 180);

        if (!FINISHED_STATUSES.has(previousStatus) && isGameFinished()) {
            safePlay(achievementAudio);
        }
    }

    function openPromotion(candidates) {
        pendingPromotion = candidates;
        const prefix = gameState.turn;

        promotionOptions.querySelectorAll('[data-promotion]').forEach((button) => {
            const type = button.dataset.promotion;
            button.querySelector('img').src = pieceAsset(`${prefix}${type}`);
        });

        promotionModal.classList.remove('is-hidden');
        promotionOptions.querySelector('button').focus();
    }

    function closePromotion() {
        pendingPromotion = null;
        promotionModal.classList.add('is-hidden');
    }

    function cancelPromotion() {
        closePromotion();
        interactionMessage = 'Promoção cancelada. Escolha outro movimento ou tente novamente.';
        renderStatus();
        const selected = selectedSquare
            ? boardElement.querySelector(`.square[data-row="${selectedSquare.row}"][data-col="${selectedSquare.col}"]`)
            : null;
        if (selected) selected.focus();
    }

    function startPieceDrag(event) {
        if (event.button !== 0 || pendingPromotion || isGameFinished()) return;

        const row = Number(event.currentTarget.dataset.row);
        const col = Number(event.currentTarget.dataset.col);
        const piece = gameState.board[row][col];
        if (!piece || Engine.pieceColor(piece) !== gameState.turn) return;

        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        dragState = {
            pointerId: event.pointerId,
            from: { row, col },
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
            ghost: null,
            source: event.currentTarget.src,
            size: Math.max(bounds.width, bounds.height)
        };

        selectedSquare = { row, col };
        interactionMessage = `${pieceName(piece)} selecionado em ${squareLabel(row, col)}.`;
        renderBoard();
        renderStatus();
        setCursorState('hold');
        document.addEventListener('pointermove', movePieceDrag, { passive: false });
        document.addEventListener('pointerup', finishPieceDrag);
        document.addEventListener('pointercancel', cancelPieceDrag);
    }

    function createDragGhost() {
        const ghost = document.createElement('img');
        ghost.src = dragState.source;
        ghost.alt = '';
        ghost.className = 'floating-piece';
        ghost.style.width = `${dragState.size}px`;
        ghost.style.height = `${dragState.size}px`;
        document.body.appendChild(ghost);
        dragState.ghost = ghost;

        const originPiece = boardElement.querySelector(
            `.piece[data-row="${dragState.from.row}"][data-col="${dragState.from.col}"]`
        );
        if (originPiece) originPiece.classList.add('drag-origin');
    }

    function movePieceDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        event.preventDefault();

        const distance = Math.hypot(
            event.clientX - dragState.startX,
            event.clientY - dragState.startY
        );

        if (!dragState.moved && distance > 6) {
            dragState.moved = true;
            createDragGhost();
        }

        if (dragState.ghost) {
            dragState.ghost.style.left = `${event.clientX}px`;
            dragState.ghost.style.top = `${event.clientY}px`;
        }
    }

    function clearDragListeners() {
        document.removeEventListener('pointermove', movePieceDrag);
        document.removeEventListener('pointerup', finishPieceDrag);
        document.removeEventListener('pointercancel', cancelPieceDrag);
    }

    function cleanupDrag() {
        if (dragState?.ghost) dragState.ghost.remove();
        boardElement.querySelectorAll('.drag-origin').forEach((piece) => piece.classList.remove('drag-origin'));
        clearDragListeners();
    }

    function finishPieceDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;

        const completedDrag = dragState;
        const targetElement = document.elementFromPoint(event.clientX, event.clientY);
        const targetSquare = targetElement ? targetElement.closest('.square') : null;
        cleanupDrag();
        dragState = null;
        suppressClickUntil = Date.now() + 120;

        if (completedDrag.moved) {
            if (targetSquare) {
                attemptMove(completedDrag.from, {
                    row: Number(targetSquare.dataset.row),
                    col: Number(targetSquare.dataset.col)
                });
            } else {
                interactionMessage = 'Solte a peça dentro do tabuleiro.';
                renderBoard();
                renderStatus();
            }
        } else {
            renderBoard();
            renderStatus();
        }

        if (!pendingPromotion) setCursorState('idle');
    }

    function cancelPieceDrag() {
        cleanupDrag();
        dragState = null;
        renderBoard();
        setCursorState('idle');
    }

    function undoMove() {
        if (!undoStack.length) return;
        gameState = undoStack.pop();
        selectedSquare = null;
        interactionMessage = 'Última jogada desfeita.';
        closePromotion();
        renderAll();
    }

    function resetGame() {
        gameState = Engine.createInitialState();
        undoStack = [];
        selectedSquare = null;
        interactionMessage = '';
        closePromotion();
        renderAll();
    }

    function readSavedTheme() {
        try {
            return window.localStorage.getItem('pixel-chess-theme');
        } catch (error) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            window.localStorage.setItem('pixel-chess-theme', theme);
        } catch (error) {
            // O tema continua funcionando mesmo quando o armazenamento está indisponível.
        }
    }

    function applyTheme(theme) {
        const dark = theme === 'dark';
        document.body.classList.toggle('dark', dark);
        themeIcon.src = dark ? 'assets/buttons/sun.png' : 'assets/buttons/moon.png';
        themeButton.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
        themeButton.title = themeButton.getAttribute('aria-label');
        treeEgg.classList.toggle('is-hidden', !dark);
        if (!dark) treeTooltip.classList.add('is-hidden');
    }

    function toggleTheme() {
        if (suppressThemeClick) {
            suppressThemeClick = false;
            return;
        }

        const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(nextTheme);
        saveTheme(nextTheme);
    }

    function startThemeDrag(event) {
        if (!document.body.classList.contains('dark') || event.button !== 0) return;
        themeDrag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };
        themeButton.setPointerCapture?.(event.pointerId);
    }

    function moveThemeDrag(event) {
        if (!themeDrag || event.pointerId !== themeDrag.pointerId) return;
        const deltaX = event.clientX - themeDrag.startX;
        const deltaY = event.clientY - themeDrag.startY;

        if (Math.hypot(deltaX, deltaY) > 6) themeDrag.moved = true;
        if (!themeDrag.moved) return;

        event.preventDefault();
        themeButton.classList.add('dragging');
        themeButton.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    function finishThemeDrag(event) {
        if (!themeDrag || event.pointerId !== themeDrag.pointerId) return;
        const wasDragged = themeDrag.moved;
        themeDrag = null;

        if (wasDragged) {
            const buttonRect = themeButton.getBoundingClientRect();
            const treeRect = treeEgg.getBoundingClientRect();
            const collided = !(
                buttonRect.right < treeRect.left
                || buttonRect.left > treeRect.right
                || buttonRect.bottom < treeRect.top
                || buttonRect.top > treeRect.bottom
            );

            if (collided) {
                safePlay(eggAudio);
                treeEgg.classList.add('discovered');
                treeTooltip.classList.remove('is-hidden');
                window.setTimeout(() => treeEgg.classList.remove('discovered'), 350);
                window.setTimeout(() => treeTooltip.classList.add('is-hidden'), 2200);
            }

            suppressThemeClick = true;
            window.setTimeout(() => {
                suppressThemeClick = false;
            }, 250);
            themeButton.classList.remove('dragging');
            themeButton.classList.add('returning');
            themeButton.style.transform = 'translate(0, 0)';
            window.setTimeout(() => themeButton.classList.remove('returning'), 500);
        }
    }

    promotionOptions.addEventListener('click', (event) => {
        const button = event.target.closest('[data-promotion]');
        if (!button || !pendingPromotion) return;

        const selectedMove = pendingPromotion.find((move) => (
            move.promotion === button.dataset.promotion
        ));
        if (selectedMove) commitMove(selectedMove);
    });

    cancelPromotionButton.addEventListener('click', cancelPromotion);
    promotionModal.addEventListener('click', (event) => {
        if (event.target === promotionModal) cancelPromotion();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && pendingPromotion) cancelPromotion();
    });

    document.addEventListener('pointermove', (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
    });

    undoButton.addEventListener('click', undoMove);
    resetButton.addEventListener('click', resetGame);
    themeButton.addEventListener('click', toggleTheme);
    themeButton.addEventListener('pointerdown', startThemeDrag);
    themeButton.addEventListener('pointermove', moveThemeDrag);
    themeButton.addEventListener('pointerup', finishThemeDrag);
    themeButton.addEventListener('pointercancel', finishThemeDrag);

    applyTheme(readSavedTheme() === 'dark' ? 'dark' : 'light');
    renderAll();
})();
