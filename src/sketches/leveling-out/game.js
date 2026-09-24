// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Lógica de Jogo e Máquina de Estados
 * Controla turnos, regras de Pedra-Papel-Tesoura e pontuação.
 */

class GameEngine {
	constructor(roomCode) {
		this.roomCode = roomCode;
		this.state = 'CONECTANDO';
		this.myMove = null;
		this.opponentMove = null;
		this.roundResult = null; // 'VITÓRIA' | 'DERROTA' | 'EMPATE'
		this.myScore = 0;
		this.opponentScore = 0;
		this.roundId = 1;
		this.statusMessage = 'Inicializando...';

		this.loadSavedState();
	}

	loadSavedState() {
		try {
			const saved = sessionStorage.getItem(`leveling_game_${this.roomCode}`);
			if (saved) {
				const data = JSON.parse(saved);
				this.myScore = data.myScore || 0;
				this.opponentScore = data.opponentScore || 0;
				this.roundId = data.roundId || 1;
			}
		} catch (e) {
			console.warn('Erro ao carregar estado salvo:', e);
		}
	}

	saveState() {
		try {
			sessionStorage.setItem(
				`leveling_game_${this.roomCode}`,
				JSON.stringify({
					myScore: this.myScore,
					opponentScore: this.opponentScore,
					roundId: this.roundId
				})
			);
		} catch (e) {
			console.warn('Erro ao salvar estado:', e);
		}
	}

	setStatus(msg) {
		this.statusMessage = msg;
	}

	handleMessage(data, network) {
		if (data.type === 'PRESENCE') {
			network.send({ type: 'PRESENCE_ACK', id: network.myId });
			if (this.state === 'CONECTANDO' || this.state === 'AGUARDANDO_OPONENTE') {
				this.startNewRound(network, false);
			}
		} else if (data.type === 'PRESENCE_ACK') {
			if (this.state === 'CONECTANDO' || this.state === 'AGUARDANDO_OPONENTE') {
				this.startNewRound(network, false);
			}
		} else if (data.type === 'MOVE') {
			if (data.roundId === this.roundId) {
				this.opponentMove = data.move;
				this.checkRoundCompletion();
			}
		} else if (data.type === 'RESTART') {
			this.roundId = data.roundId;
			this.startNewRound(network, false);
		}
	}

	startNewRound(network, broadcast = true) {
		this.myMove = null;
		this.opponentMove = null;
		this.roundResult = null;
		this.state = 'ESCOLHENDO';
		this.statusMessage = 'Faça sua jogada!';

		if (broadcast && network) {
			network.send({ type: 'RESTART', id: network.myId, roundId: this.roundId });
		}
	}

	chooseMove(move, network) {
		if (this.state !== 'ESCOLHENDO') return;

		this.myMove = move;
		this.state = 'AGUARDANDO_OPONENTE_JOGADA';
		this.statusMessage = 'Jogada enviada! Aguardando o oponente...';

		network.send({
			type: 'MOVE',
			id: network.myId,
			move: this.myMove,
			roundId: this.roundId
		});

		this.checkRoundCompletion();
	}

	checkRoundCompletion() {
		if (this.myMove && this.opponentMove) {
			this.calculateResult();
			this.state = 'RESULTADO';
			this.saveState();
		}
	}

	calculateResult() {
		if (this.myMove === this.opponentMove) {
			this.roundResult = 'EMPATE';
		} else if (
			(this.myMove === 'pedra' && this.opponentMove === 'tesoura') ||
			(this.myMove === 'papel' && this.opponentMove === 'pedra') ||
			(this.myMove === 'tesoura' && this.opponentMove === 'papel')
		) {
			this.roundResult = 'VITÓRIA';
			this.myScore += 1;
		} else {
			this.roundResult = 'DERROTA';
			this.opponentScore += 1;
		}
	}
}
