// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Lógica de Jogo e Máquina de Estados
 * Controla turnos, regras de Pedra, Papel e Tesoura e sincronização de pontuação via PocketBase.
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
		if (data.type === 'OPPONENT_ONLINE') {
			if (this.state === 'CONECTANDO' || this.state === 'AGUARDANDO_OPONENTE') {
				this.startNewRound(network, false);
			}
		} else if (data.type === 'SALA_UPDATE') {
			const sala = data.sala;
			if (network.myEquipe === 'A') {
				this.myScore = sala.placar_a || 0;
				this.opponentScore = sala.placar_b || 0;
			} else {
				this.myScore = sala.placar_b || 0;
				this.opponentScore = sala.placar_a || 0;
			}
			if (sala.rodada_atual && sala.rodada_atual > this.roundId && this.state !== 'ESCOLHENDO') {
				this.roundId = sala.rodada_atual;
			}
			this.saveState();
		} else if (data.type === 'PPT_RESOLVIDO') {
			const res = data.data;
			const myTeam = network.myEquipe || 'A';
			const opponentTeam = myTeam === 'A' ? 'B' : 'A';

			this.myMove = (res.lances && res.lances[myTeam]) || this.myMove;
			this.opponentMove = (res.lances && res.lances[opponentTeam]) || null;

			if (res.vencedor === 'EMPATE') {
				this.roundResult = 'EMPATE';
				this.statusMessage = 'Empate!';
			} else if (res.vencedor === myTeam) {
				this.roundResult = 'VITÓRIA';
				this.statusMessage = 'Você venceu!';
			} else {
				this.roundResult = 'DERROTA';
				this.statusMessage = 'Oponente venceu!';
			}

			this.state = 'RESULTADO';
			this.saveState();
		}
	}

	startNewRound(network) {
		this.myMove = null;
		this.opponentMove = null;
		this.roundResult = null;
		if (network && network.salaRecord && network.salaRecord.rodada_atual) {
			this.roundId = network.salaRecord.rodada_atual;
		}
		this.state = 'ESCOLHENDO';
		this.statusMessage = 'Faça sua jogada!';
		this.saveState();
	}

	chooseMove(move, network) {
		if (this.state !== 'ESCOLHENDO') return;

		this.myMove = move;
		this.state = 'AGUARDANDO_OPONENTE_JOGADA';
		this.statusMessage = 'Jogada enviada! Aguardando o oponente...';

		if (network) {
			network.enviarLance(this.myMove, this.roundId);
		}
	}
}
