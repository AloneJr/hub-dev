const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../engine.js');

function square(value) {
    return chess.fromAlgebraic(value);
}

function play(state, from, to, promotion) {
    return chess.makeMove(state, {
        from: square(from),
        to: square(to),
        ...(promotion ? { promotion } : {})
    });
}

test('posição inicial tem a contagem de movimentos de referência', () => {
    const state = chess.createInitialState();
    assert.equal(chess.generateLegalMoves(state).length, 20);
    assert.equal(chess.perft(state, 2), 400);
    assert.equal(chess.perft(state, 3), 8902);
    assert.equal(chess.perft(state, 4), 197281);
});

test('movimento que expõe o próprio rei é rejeitado', () => {
    const state = chess.createStateFromFen('k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1');
    const moves = chess.findLegalMoves(state, square('e2'), square('d2'));
    assert.equal(moves.length, 0);
});

test('o rei adversário não pode ser capturado', () => {
    const state = chess.createStateFromFen('4k3/4Q3/8/8/8/8/8/4K3 w - - 0 1');
    const moves = chess.findLegalMoves(state, square('e7'), square('e8'));
    assert.equal(moves.length, 0);
});

test('roques pequeno e grande movem rei e torre corretamente', () => {
    const state = chess.createStateFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const kingMoves = chess.generateLegalMoves(state, square('e1'));

    assert.ok(kingMoves.some((move) => move.castle === 'K'));
    assert.ok(kingMoves.some((move) => move.castle === 'Q'));

    const castled = play(state, 'e1', 'g1');
    assert.equal(castled.board[7][6], 'wK');
    assert.equal(castled.board[7][5], 'wR');
    assert.equal(castled.board[7][7], null);
    assert.equal(castled.lastMove.san, 'O-O');
});

test('roque não atravessa uma casa atacada', () => {
    const state = chess.createStateFromFen('k4r2/8/8/8/8/8/8/4K2R w K - 0 1');
    const moves = chess.findLegalMoves(state, square('e1'), square('g1'));
    assert.equal(moves.length, 0);
});

test('en passant remove o peão ultrapassado', () => {
    let state = chess.createInitialState();
    state = play(state, 'e2', 'e4');
    state = play(state, 'a7', 'a6');
    state = play(state, 'e4', 'e5');
    state = play(state, 'd7', 'd5');

    const candidates = chess.findLegalMoves(state, square('e5'), square('d6'));
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].enPassant, true);

    state = play(state, 'e5', 'd6');
    assert.equal(state.board[2][3], 'wP');
    assert.equal(state.board[3][3], null);
    assert.equal(state.lastMove.captured, 'bP');
});

test('promoção exige escolha e aceita as quatro peças', () => {
    const state = chess.createStateFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const candidates = chess.findLegalMoves(state, square('a7'), square('a8'));
    assert.deepEqual(candidates.map((move) => move.promotion).sort(), ['B', 'N', 'Q', 'R']);
    assert.throws(() => play(state, 'a7', 'a8'), /promoção/i);

    const promoted = play(state, 'a7', 'a8', 'Q');
    assert.equal(promoted.board[0][0], 'wQ');
    assert.equal(promoted.lastMove.san, 'a8=Q+');
});

test('xeque-mate encerra a partida e gera notação com cerquilha', () => {
    let state = chess.createInitialState();
    state = play(state, 'f2', 'f3');
    state = play(state, 'e7', 'e5');
    state = play(state, 'g2', 'g4');
    state = play(state, 'd8', 'h4');

    const status = chess.getGameStatus(state);
    assert.equal(status.type, 'checkmate');
    assert.equal(status.winner, chess.BLACK);
    assert.equal(state.lastMove.san, 'Qh4#');
});

test('afogamento é reconhecido sem declarar xeque', () => {
    const state = chess.createStateFromFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    const status = chess.getGameStatus(state);
    assert.equal(status.type, 'stalemate');
    assert.equal(status.inCheck, false);
});

test('empate por material insuficiente é reconhecido', () => {
    const state = chess.createStateFromFen('4k3/8/8/8/8/8/2B5/4K3 w - - 0 1');
    assert.equal(chess.getGameStatus(state).type, 'draw-insufficient');
});

test('regra dos cinquenta movimentos é reconhecida', () => {
    const state = chess.createStateFromFen('4k3/8/8/8/8/8/8/R3K3 w - - 100 51');
    assert.equal(chess.getGameStatus(state).type, 'draw-50-move');
});

test('terceira repetição da posição encerra em empate', () => {
    let state = chess.createInitialState();

    for (let cycle = 0; cycle < 2; cycle += 1) {
        state = play(state, 'g1', 'f3');
        state = play(state, 'g8', 'f6');
        state = play(state, 'f3', 'g1');
        state = play(state, 'f6', 'g8');
    }

    assert.equal(chess.getGameStatus(state).type, 'draw-repetition');
});

test('alvo de en passant ilegal por cravada não altera a chave de repetição', () => {
    const state = chess.createStateFromFen('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
    assert.equal(chess.positionKey(state).endsWith(' -'), true);
    assert.equal(chess.findLegalMoves(state, square('e5'), square('d6')).length, 0);
});
