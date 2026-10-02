(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.ChessEngine = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const WHITE = 'w';
    const BLACK = 'b';
    const FILES = 'abcdefgh';
    const PROMOTION_TYPES = ['Q', 'R', 'B', 'N'];

    const INITIAL_BOARD = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];

    function cloneBoard(board) {
        return board.map((row) => row.slice());
    }

    function opposite(color) {
        return color === WHITE ? BLACK : WHITE;
    }

    function inBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    function pieceColor(piece) {
        return piece ? piece[0] : null;
    }

    function pieceType(piece) {
        return piece ? piece[1] : null;
    }

    function sameSquare(a, b) {
        return a.row === b.row && a.col === b.col;
    }

    function toAlgebraic(square) {
        return `${FILES[square.col]}${8 - square.row}`;
    }

    function fromAlgebraic(value) {
        if (!/^[a-h][1-8]$/.test(value)) {
            throw new Error(`Casa inválida: ${value}`);
        }

        return {
            row: 8 - Number(value[1]),
            col: FILES.indexOf(value[0])
        };
    }

    function cloneState(state, options = {}) {
        const includeHistory = options.includeHistory !== false;

        return {
            board: cloneBoard(state.board),
            turn: state.turn,
            castling: { ...state.castling },
            enPassant: state.enPassant ? { ...state.enPassant } : null,
            halfmoveClock: state.halfmoveClock,
            fullmoveNumber: state.fullmoveNumber,
            moveHistory: includeHistory
                ? state.moveHistory.map((move) => ({
                    ...move,
                    from: { ...move.from },
                    to: { ...move.to }
                }))
                : state.moveHistory,
            lastMove: state.lastMove
                ? {
                    ...state.lastMove,
                    from: { ...state.lastMove.from },
                    to: { ...state.lastMove.to }
                }
                : null,
            positionCounts: includeHistory ? { ...state.positionCounts } : state.positionCounts
        };
    }

    function createInitialState() {
        const state = {
            board: cloneBoard(INITIAL_BOARD),
            turn: WHITE,
            castling: { wK: true, wQ: true, bK: true, bQ: true },
            enPassant: null,
            halfmoveClock: 0,
            fullmoveNumber: 1,
            moveHistory: [],
            lastMove: null,
            positionCounts: {}
        };

        state.positionCounts[positionKey(state)] = 1;
        return state;
    }

    function boardToFen(board) {
        return board.map((row) => {
            let result = '';
            let empty = 0;

            row.forEach((piece) => {
                if (!piece) {
                    empty += 1;
                    return;
                }

                if (empty) {
                    result += empty;
                    empty = 0;
                }

                const symbol = piece[1];
                result += piece[0] === WHITE ? symbol : symbol.toLowerCase();
            });

            if (empty) result += empty;
            return result;
        }).join('/');
    }

    function castlingToFen(castling) {
        const value = [
            castling.wK ? 'K' : '',
            castling.wQ ? 'Q' : '',
            castling.bK ? 'k' : '',
            castling.bQ ? 'q' : ''
        ].join('');

        return value || '-';
    }

    function hasEnPassantCapturer(state) {
        if (!state.enPassant) return false;

        const direction = state.turn === WHITE ? -1 : 1;
        const pawnRow = state.enPassant.row - direction;
        const capturedRow = state.enPassant.row - direction;
        const enemyPawn = `${opposite(state.turn)}P`;

        if (!inBounds(capturedRow, state.enPassant.col)) return false;
        if (state.board[capturedRow][state.enPassant.col] !== enemyPawn) return false;

        return [-1, 1].some((offset) => {
            const col = state.enPassant.col + offset;
            if (!inBounds(pawnRow, col) || state.board[pawnRow][col] !== `${state.turn}P`) {
                return false;
            }

            const candidate = applyMoveUnchecked(state, {
                from: { row: pawnRow, col },
                to: { ...state.enPassant },
                capture: true,
                enPassant: true
            }, { simulation: true });

            return !isInCheck(candidate, state.turn);
        });
    }

    function positionKey(state) {
        const enPassant = state.enPassant && hasEnPassantCapturer(state)
            ? toAlgebraic(state.enPassant)
            : '-';

        return [
            boardToFen(state.board),
            state.turn,
            castlingToFen(state.castling),
            enPassant
        ].join(' ');
    }

    function toFen(state) {
        return [
            boardToFen(state.board),
            state.turn,
            castlingToFen(state.castling),
            state.enPassant ? toAlgebraic(state.enPassant) : '-',
            state.halfmoveClock,
            state.fullmoveNumber
        ].join(' ');
    }

    function createStateFromFen(fen) {
        const parts = fen.trim().split(/\s+/);
        if (parts.length < 4) throw new Error('FEN incompleta.');

        const ranks = parts[0].split('/');
        if (ranks.length !== 8) throw new Error('FEN deve ter oito fileiras.');

        const board = ranks.map((rank) => {
            const row = [];

            for (const symbol of rank) {
                if (/\d/.test(symbol)) {
                    const count = Number(symbol);
                    for (let i = 0; i < count; i += 1) row.push(null);
                    continue;
                }

                if (!/[prnbqkPRNBQK]/.test(symbol)) {
                    throw new Error(`Peça inválida na FEN: ${symbol}`);
                }

                const color = symbol === symbol.toUpperCase() ? WHITE : BLACK;
                row.push(`${color}${symbol.toUpperCase()}`);
            }

            if (row.length !== 8) throw new Error('Fileira inválida na FEN.');
            return row;
        });

        const turn = parts[1];
        if (![WHITE, BLACK].includes(turn)) throw new Error('Turno inválido na FEN.');

        const castlingValue = parts[2];
        const state = {
            board,
            turn,
            castling: {
                wK: castlingValue.includes('K'),
                wQ: castlingValue.includes('Q'),
                bK: castlingValue.includes('k'),
                bQ: castlingValue.includes('q')
            },
            enPassant: parts[3] === '-' ? null : fromAlgebraic(parts[3]),
            halfmoveClock: Number(parts[4] || 0),
            fullmoveNumber: Number(parts[5] || 1),
            moveHistory: [],
            lastMove: null,
            positionCounts: {}
        };

        state.positionCounts[positionKey(state)] = 1;
        return state;
    }

    function pathIsClear(board, from, to) {
        const stepRow = Math.sign(to.row - from.row);
        const stepCol = Math.sign(to.col - from.col);
        let row = from.row + stepRow;
        let col = from.col + stepCol;

        while (row !== to.row || col !== to.col) {
            if (board[row][col]) return false;
            row += stepRow;
            col += stepCol;
        }

        return true;
    }

    function isSquareAttacked(state, row, col, byColor) {
        for (let sourceRow = 0; sourceRow < 8; sourceRow += 1) {
            for (let sourceCol = 0; sourceCol < 8; sourceCol += 1) {
                const piece = state.board[sourceRow][sourceCol];
                if (!piece || pieceColor(piece) !== byColor) continue;

                const deltaRow = row - sourceRow;
                const deltaCol = col - sourceCol;
                const distanceRow = Math.abs(deltaRow);
                const distanceCol = Math.abs(deltaCol);
                const type = pieceType(piece);

                if (type === 'P') {
                    const direction = byColor === WHITE ? -1 : 1;
                    if (deltaRow === direction && distanceCol === 1) return true;
                }

                if (type === 'N') {
                    if ((distanceRow === 2 && distanceCol === 1)
                        || (distanceRow === 1 && distanceCol === 2)) return true;
                }

                if (type === 'K' && distanceRow <= 1 && distanceCol <= 1) {
                    return true;
                }

                const from = { row: sourceRow, col: sourceCol };
                const to = { row, col };

                if ((type === 'B' || type === 'Q')
                    && distanceRow === distanceCol
                    && pathIsClear(state.board, from, to)) return true;

                if ((type === 'R' || type === 'Q')
                    && (deltaRow === 0 || deltaCol === 0)
                    && pathIsClear(state.board, from, to)) return true;
            }
        }

        return false;
    }

    function findKing(state, color) {
        for (let row = 0; row < 8; row += 1) {
            for (let col = 0; col < 8; col += 1) {
                if (state.board[row][col] === `${color}K`) return { row, col };
            }
        }

        return null;
    }

    function isInCheck(state, color = state.turn) {
        const king = findKing(state, color);
        if (!king) return true;
        return isSquareAttacked(state, king.row, king.col, opposite(color));
    }

    function createMove(from, to, extras = {}) {
        return {
            from: { row: from.row, col: from.col },
            to: { row: to.row, col: to.col },
            ...extras
        };
    }

    function addPawnMove(moves, from, to, extras = {}) {
        if (to.row === 0 || to.row === 7) {
            PROMOTION_TYPES.forEach((promotion) => {
                moves.push(createMove(from, to, { ...extras, promotion }));
            });
            return;
        }

        moves.push(createMove(from, to, extras));
    }

    function addSlidingMoves(state, from, color, directions, moves) {
        directions.forEach(([stepRow, stepCol]) => {
            let row = from.row + stepRow;
            let col = from.col + stepCol;

            while (inBounds(row, col)) {
                const target = state.board[row][col];

                if (!target) {
                    moves.push(createMove(from, { row, col }));
                } else {
                    if (pieceColor(target) !== color && pieceType(target) !== 'K') {
                        moves.push(createMove(from, { row, col }));
                    }
                    break;
                }

                row += stepRow;
                col += stepCol;
            }
        });
    }

    function addCastlingMoves(state, from, color, moves) {
        const homeRow = color === WHITE ? 7 : 0;
        if (from.row !== homeRow || from.col !== 4) return;
        if (isInCheck(state, color)) return;

        const enemy = opposite(color);
        const kingSideRight = color === WHITE ? 'wK' : 'bK';
        const queenSideRight = color === WHITE ? 'wQ' : 'bQ';

        if (state.castling[kingSideRight]
            && state.board[homeRow][7] === `${color}R`
            && !state.board[homeRow][5]
            && !state.board[homeRow][6]
            && !isSquareAttacked(state, homeRow, 5, enemy)
            && !isSquareAttacked(state, homeRow, 6, enemy)) {
            moves.push(createMove(from, { row: homeRow, col: 6 }, { castle: 'K' }));
        }

        if (state.castling[queenSideRight]
            && state.board[homeRow][0] === `${color}R`
            && !state.board[homeRow][1]
            && !state.board[homeRow][2]
            && !state.board[homeRow][3]
            && !isSquareAttacked(state, homeRow, 3, enemy)
            && !isSquareAttacked(state, homeRow, 2, enemy)) {
            moves.push(createMove(from, { row: homeRow, col: 2 }, { castle: 'Q' }));
        }
    }

    function generatePseudoLegalMoves(state, from) {
        if (!inBounds(from.row, from.col)) return [];

        const piece = state.board[from.row][from.col];
        if (!piece || pieceColor(piece) !== state.turn) return [];

        const color = pieceColor(piece);
        const type = pieceType(piece);
        const moves = [];

        if (type === 'P') {
            const direction = color === WHITE ? -1 : 1;
            const startRow = color === WHITE ? 6 : 1;
            const oneStep = { row: from.row + direction, col: from.col };
            const twoSteps = { row: from.row + (2 * direction), col: from.col };

            if (inBounds(oneStep.row, oneStep.col) && !state.board[oneStep.row][oneStep.col]) {
                addPawnMove(moves, from, oneStep);

                if (from.row === startRow && !state.board[twoSteps.row][twoSteps.col]) {
                    moves.push(createMove(from, twoSteps, { doublePawn: true }));
                }
            }

            [-1, 1].forEach((offset) => {
                const target = { row: from.row + direction, col: from.col + offset };
                if (!inBounds(target.row, target.col)) return;

                const targetPiece = state.board[target.row][target.col];
                if (targetPiece
                    && pieceColor(targetPiece) !== color
                    && pieceType(targetPiece) !== 'K') {
                    addPawnMove(moves, from, target, { capture: true });
                    return;
                }

                if (state.enPassant && sameSquare(state.enPassant, target)) {
                    const adjacentPiece = state.board[from.row][target.col];
                    if (adjacentPiece === `${opposite(color)}P`) {
                        moves.push(createMove(from, target, { capture: true, enPassant: true }));
                    }
                }
            });
        }

        if (type === 'N') {
            const offsets = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];

            offsets.forEach(([rowOffset, colOffset]) => {
                const row = from.row + rowOffset;
                const col = from.col + colOffset;
                if (!inBounds(row, col)) return;

                const target = state.board[row][col];
                if (!target || (pieceColor(target) !== color && pieceType(target) !== 'K')) {
                    moves.push(createMove(from, { row, col }, { capture: Boolean(target) }));
                }
            });
        }

        if (type === 'B' || type === 'Q') {
            addSlidingMoves(state, from, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]], moves);
        }

        if (type === 'R' || type === 'Q') {
            addSlidingMoves(state, from, color, [[-1, 0], [1, 0], [0, -1], [0, 1]], moves);
        }

        if (type === 'K') {
            for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
                for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
                    if (rowOffset === 0 && colOffset === 0) continue;

                    const row = from.row + rowOffset;
                    const col = from.col + colOffset;
                    if (!inBounds(row, col)) continue;

                    const target = state.board[row][col];
                    if (!target || (pieceColor(target) !== color && pieceType(target) !== 'K')) {
                        moves.push(createMove(from, { row, col }, { capture: Boolean(target) }));
                    }
                }
            }

            addCastlingMoves(state, from, color, moves);
        }

        return moves;
    }

    function revokeRookCastlingRight(castling, piece, square) {
        if (piece === 'wR' && square.row === 7 && square.col === 0) castling.wQ = false;
        if (piece === 'wR' && square.row === 7 && square.col === 7) castling.wK = false;
        if (piece === 'bR' && square.row === 0 && square.col === 0) castling.bQ = false;
        if (piece === 'bR' && square.row === 0 && square.col === 7) castling.bK = false;
    }

    function applyMoveUnchecked(state, move, options = {}) {
        const next = cloneState(state, { includeHistory: !options.simulation });
        const movingPiece = next.board[move.from.row][move.from.col];
        const movingColor = pieceColor(movingPiece);
        const movingType = pieceType(movingPiece);
        let captureSquare = { ...move.to };

        if (move.enPassant) {
            const direction = movingColor === WHITE ? -1 : 1;
            captureSquare = { row: move.to.row - direction, col: move.to.col };
        }

        const capturedPiece = next.board[captureSquare.row][captureSquare.col];
        next.board[move.from.row][move.from.col] = null;

        if (move.enPassant) {
            next.board[captureSquare.row][captureSquare.col] = null;
        }

        next.board[move.to.row][move.to.col] = move.promotion
            ? `${movingColor}${move.promotion}`
            : movingPiece;

        if (move.castle) {
            const rookFromCol = move.castle === 'K' ? 7 : 0;
            const rookToCol = move.castle === 'K' ? 5 : 3;
            next.board[move.to.row][rookToCol] = next.board[move.to.row][rookFromCol];
            next.board[move.to.row][rookFromCol] = null;
        }

        if (movingType === 'K') {
            if (movingColor === WHITE) {
                next.castling.wK = false;
                next.castling.wQ = false;
            } else {
                next.castling.bK = false;
                next.castling.bQ = false;
            }
        }

        revokeRookCastlingRight(next.castling, movingPiece, move.from);
        if (capturedPiece) revokeRookCastlingRight(next.castling, capturedPiece, captureSquare);

        next.enPassant = null;
        if (movingType === 'P' && Math.abs(move.to.row - move.from.row) === 2) {
            next.enPassant = {
                row: (move.from.row + move.to.row) / 2,
                col: move.from.col
            };
        }

        next.halfmoveClock = movingType === 'P' || capturedPiece
            ? 0
            : state.halfmoveClock + 1;

        next.fullmoveNumber = state.fullmoveNumber + (movingColor === BLACK ? 1 : 0);
        next.turn = opposite(state.turn);
        next.lastMove = {
            from: { ...move.from },
            to: { ...move.to },
            piece: movingPiece,
            captured: capturedPiece || null,
            promotion: move.promotion || null,
            castle: move.castle || null,
            enPassant: Boolean(move.enPassant)
        };

        return next;
    }

    function generateLegalMoves(state, from = null) {
        const sources = [];

        if (from) {
            sources.push(from);
        } else {
            for (let row = 0; row < 8; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                    if (pieceColor(state.board[row][col]) === state.turn) {
                        sources.push({ row, col });
                    }
                }
            }
        }

        const color = state.turn;
        const moves = [];

        sources.forEach((source) => {
            generatePseudoLegalMoves(state, source).forEach((move) => {
                const candidate = applyMoveUnchecked(state, move, { simulation: true });
                if (!isInCheck(candidate, color)) moves.push(move);
            });
        });

        return moves;
    }

    function findLegalMoves(state, from, to) {
        return generateLegalMoves(state, from).filter((move) => sameSquare(move.to, to));
    }

    function isInsufficientMaterial(state) {
        const pieces = [];

        for (let row = 0; row < 8; row += 1) {
            for (let col = 0; col < 8; col += 1) {
                const piece = state.board[row][col];
                if (piece && pieceType(piece) !== 'K') pieces.push({ piece, row, col });
            }
        }

        if (pieces.some(({ piece }) => ['P', 'R', 'Q'].includes(pieceType(piece)))) return false;
        if (pieces.length === 0) return true;
        if (pieces.length === 1) return ['B', 'N'].includes(pieceType(pieces[0].piece));

        if (pieces.every(({ piece }) => pieceType(piece) === 'B')) {
            const squareColors = new Set(pieces.map(({ row, col }) => (row + col) % 2));
            return squareColors.size === 1;
        }

        return false;
    }

    function getGameStatus(state) {
        const inCheck = isInCheck(state, state.turn);
        const legalMoves = generateLegalMoves(state);

        if (legalMoves.length === 0) {
            if (inCheck) {
                return { type: 'checkmate', winner: opposite(state.turn), inCheck: true };
            }
            return { type: 'stalemate', winner: null, inCheck: false };
        }

        if (isInsufficientMaterial(state)) {
            return { type: 'draw-insufficient', winner: null, inCheck };
        }

        if ((state.positionCounts[positionKey(state)] || 0) >= 3) {
            return { type: 'draw-repetition', winner: null, inCheck };
        }

        if (state.halfmoveClock >= 100) {
            return { type: 'draw-50-move', winner: null, inCheck };
        }

        return { type: inCheck ? 'check' : 'active', winner: null, inCheck };
    }

    function formatSan(state, move, nextState, allLegalMoves) {
        if (move.castle === 'K') return `O-O${getSanSuffix(nextState)}`;
        if (move.castle === 'Q') return `O-O-O${getSanSuffix(nextState)}`;

        const movingPiece = state.board[move.from.row][move.from.col];
        const type = pieceType(movingPiece);
        const capture = Boolean(state.board[move.to.row][move.to.col]) || move.enPassant;
        let san = type === 'P' ? '' : type;

        if (type !== 'P') {
            const conflicts = allLegalMoves.filter((candidate) => {
                if (sameSquare(candidate.from, move.from) || !sameSquare(candidate.to, move.to)) return false;
                const candidatePiece = state.board[candidate.from.row][candidate.from.col];
                return candidatePiece === movingPiece;
            });

            if (conflicts.length) {
                const sameFile = conflicts.some((candidate) => candidate.from.col === move.from.col);
                const sameRank = conflicts.some((candidate) => candidate.from.row === move.from.row);

                if (!sameFile) san += FILES[move.from.col];
                else if (!sameRank) san += 8 - move.from.row;
                else san += toAlgebraic(move.from);
            }
        } else if (capture) {
            san += FILES[move.from.col];
        }

        if (capture) san += 'x';
        san += toAlgebraic(move.to);
        if (move.promotion) san += `=${move.promotion}`;
        san += getSanSuffix(nextState);
        return san;
    }

    function getSanSuffix(state) {
        const status = getGameStatus(state);
        if (status.type === 'checkmate') return '#';
        if (status.inCheck) return '+';
        return '';
    }

    function makeMove(state, requestedMove) {
        const allLegalMoves = generateLegalMoves(state);
        const candidates = allLegalMoves.filter((move) => (
            sameSquare(move.from, requestedMove.from)
            && sameSquare(move.to, requestedMove.to)
        ));

        if (!candidates.length) throw new Error('Movimento ilegal.');

        let move;
        if (requestedMove.promotion) {
            move = candidates.find((candidate) => candidate.promotion === requestedMove.promotion);
        } else if (candidates.some((candidate) => candidate.promotion)) {
            throw new Error('A promoção precisa ser escolhida.');
        } else {
            [move] = candidates;
        }

        if (!move) throw new Error('Promoção inválida.');

        const movingColor = state.turn;
        const moveNumber = state.fullmoveNumber;
        const next = applyMoveUnchecked(state, move);
        const key = positionKey(next);
        next.positionCounts[key] = (next.positionCounts[key] || 0) + 1;

        const san = formatSan(state, move, next, allLegalMoves);
        const record = {
            ...next.lastMove,
            color: movingColor,
            moveNumber,
            san
        };

        next.lastMove = record;
        next.moveHistory = [...state.moveHistory, record];
        return next;
    }

    function perft(state, depth) {
        if (depth === 0) return 1;

        let nodes = 0;
        generateLegalMoves(state).forEach((move) => {
            nodes += perft(applyMoveUnchecked(state, move, { simulation: true }), depth - 1);
        });
        return nodes;
    }

    return {
        WHITE,
        BLACK,
        PROMOTION_TYPES: PROMOTION_TYPES.slice(),
        createInitialState,
        createStateFromFen,
        cloneState,
        toFen,
        positionKey,
        toAlgebraic,
        fromAlgebraic,
        opposite,
        pieceColor,
        pieceType,
        isSquareAttacked,
        isInCheck,
        isInsufficientMaterial,
        generatePseudoLegalMoves,
        generateLegalMoves,
        findLegalMoves,
        makeMove,
        getGameStatus,
        perft
    };
});
