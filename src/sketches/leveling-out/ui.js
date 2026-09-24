// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Interface e Renderização Visual em p5.js
 * Desenha a interface responsiva, botões táteis e feedbacks de estado.
 */

class UIRenderer {
	constructor() {
		this.buttons = [];
		this.nextRoundBtn = null;
	}

	render(game, network) {
		background(13, 13, 16);

		const opponentOnline = network.isOpponentOnline();

		// Se o oponente desconectar durante o jogo
		if (!opponentOnline && network.isConnected && game.state !== 'CONECTANDO') {
			game.state = 'AGUARDANDO_OPONENTE';
			game.statusMessage = `Sala: ${network.roomCode} | Aguardando oponente reconectar...`;
		}

		// 1. Cabeçalho com indicador E2EE e rede
		this.drawHeader(network, opponentOnline);

		// 2. Placar da partida
		this.drawScoreboard(game);

		// 3. Telas de estado
		if (game.state === 'CONECTANDO' || game.state === 'AGUARDANDO_OPONENTE') {
			this.drawWaitingScreen(network, opponentOnline);
		} else if (game.state === 'ESCOLHENDO' || game.state === 'AGUARDANDO_OPONENTE_JOGADA') {
			this.drawActionScreen(game);
		} else if (game.state === 'RESULTADO') {
			this.drawResultScreen(game);
		}
	}

	drawHeader(network, opponentOnline) {
		push();
		noStroke();
		fill(24, 24, 28);
		rect(width / 2, 28, width, 56);

		// Indicador de Status da Rede
		textSize(12);
		textStyle(BOLD);

		if (!network.isConnected) {
			fill(239, 68, 68);
			text('DESCONECTADO', 65, 28);
		} else if (!opponentOnline) {
			fill(245, 158, 11);
			text('1 JOGADOR NA SALA', 75, 28);
		} else {
			fill(16, 185, 129);
			text('2 CONECTADOS (E2EE)', 85, 28);
		}

		// Identificador da Sala
		fill(212, 212, 216);
		textSize(12);
		textStyle(NORMAL);
		text(`Sala: ${network.roomCode}`, width / 2, 28);

		// ID persistente do jogador
		fill(161, 161, 170);
		textSize(11);
		text(`Você: ${network.myId.replace('player_', '#')}`, width - 70, 28);
		pop();
	}

	drawScoreboard(game) {
		push();
		const cy = 80;
		fill(255);
		textSize(15);
		textStyle(BOLD);
		text(`RODADA ${game.roundId}`, width / 2, cy - 10);

		// Placar
		fill(244, 63, 94);
		text(`Você: ${game.myScore}`, width / 2 - 80, cy + 16);

		fill(113, 113, 122);
		text('vs', width / 2, cy + 16);

		fill(59, 130, 246);
		text(`Oponente: ${game.opponentScore}`, width / 2 + 80, cy + 16);
		pop();
	}

	drawWaitingScreen(network, opponentOnline) {
		push();
		const cy = height / 2;

		fill(255);
		textSize(26);
		textStyle(BOLD);
		text('Aguardando Jogador...', width / 2, cy - 30);

		fill(161, 161, 170);
		textSize(14);
		textStyle(NORMAL);
		text('Abra esta mesma sala em outro celular ou janela:', width / 2, cy + 10);

		fill(244, 63, 94);
		textSize(16);
		textStyle(BOLD);
		text(`Código: ${network.roomCode}`, width / 2, cy + 45);
		pop();
	}

	drawActionScreen(game) {
		push();
		const cy = height * 0.32;

		fill(255);
		textSize(22);
		textStyle(BOLD);
		text(game.statusMessage, width / 2, cy);

		const moves = [
			{ id: 'pedra', label: 'Pedra' },
			{ id: 'papel', label: 'Papel' },
			{ id: 'tesoura', label: 'Tesoura' }
		];

		const btnW = min(130, width * 0.26);
		const btnH = 100;
		const spacing = min(24, width * 0.04);
		const totalW = moves.length * btnW + (moves.length - 1) * spacing;
		const startX = width / 2 - totalW / 2 + btnW / 2;
		const btnY = height * 0.58;

		this.buttons = [];

		for (let i = 0; i < moves.length; i++) {
			const m = moves[i];
			const bx = startX + i * (btnW + spacing);
			const by = btnY;

			const isHover =
				mouseX >= bx - btnW / 2 &&
				mouseX <= bx + btnW / 2 &&
				mouseY >= by - btnH / 2 &&
				mouseY <= by + btnH / 2;

			const isSelected = game.myMove === m.id;

			this.buttons.push({ id: m.id, x: bx, y: by, w: btnW, h: btnH });

			push();
			if (isSelected) {
				fill(244, 63, 94, 220);
				stroke(255);
				strokeWeight(3);
			} else if (isHover && game.state === 'ESCOLHENDO') {
				fill(39, 39, 42);
				stroke(244, 63, 94);
				strokeWeight(2);
			} else {
				fill(24, 24, 27);
				stroke(63, 63, 70);
				strokeWeight(1);
			}

			rect(bx, by, btnW, btnH, 16);

			// Rótulo da Jogada
			textSize(18);
			textStyle(BOLD);
			fill(isSelected ? 255 : 228);
			noStroke();
			text(m.label, bx, isSelected ? by - 10 : by);

			if (isSelected) {
				fill(255);
				textSize(11);
				text('SUA ESCOLHA', bx, by + 18);
			}
			pop();
		}

		// Status do Oponente
		const statusY = height * 0.85;
		textSize(13);
		if (game.opponentMove) {
			fill(16, 185, 129);
			text('Oponente já fez a jogada!', width / 2, statusY);
		} else {
			fill(245, 158, 11);
			text('Aguardando jogada do oponente...', width / 2, statusY);
		}
		pop();
	}

	drawResultScreen(game) {
		push();
		const cy = height * 0.36;

		textSize(34);
		textStyle(BOLD);
		if (game.roundResult === 'VITÓRIA') {
			fill(16, 185, 129);
			text('VOCÊ VENCEU!', width / 2, cy - 30);
		} else if (game.roundResult === 'DERROTA') {
			fill(239, 68, 68);
			text('VOCÊ PERDEU!', width / 2, cy - 30);
		} else {
			fill(245, 158, 11);
			text('EMPATE!', width / 2, cy - 30);
		}

		const iconMap = { pedra: 'Pedra', papel: 'Papel', tesoura: 'Tesoura' };

		fill(244, 63, 94);
		textSize(18);
		textStyle(BOLD);
		text(`Você: ${iconMap[game.myMove] || game.myMove}`, width / 2 - 100, cy + 40);

		fill(113, 113, 122);
		textSize(16);
		text('vs', width / 2, cy + 40);

		fill(59, 130, 246);
		textSize(18);
		text(`Oponente: ${iconMap[game.opponentMove] || game.opponentMove}`, width / 2 + 100, cy + 40);

		// Botão Próxima Rodada
		const btnW = min(220, width * 0.7);
		const btnH = 50;
		const btnY = height * 0.68;

		this.nextRoundBtn = { x: width / 2, y: btnY, w: btnW, h: btnH };

		const isHover =
			mouseX >= width / 2 - btnW / 2 &&
			mouseX <= width / 2 + btnW / 2 &&
			mouseY >= btnY - btnH / 2 &&
			mouseY <= btnY + btnH / 2;

		fill(isHover ? color(225, 29, 72) : color(244, 63, 94));
		noStroke();
		rect(width / 2, btnY, btnW, btnH, 12);

		fill(255);
		textSize(16);
		textStyle(BOLD);
		text('Próxima Rodada', width / 2, btnY);
		pop();
	}

	getMoveAt(x, y) {
		for (const b of this.buttons) {
			if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 && y >= b.y - b.h / 2 && y <= b.y + b.h / 2) {
				return b.id;
			}
		}
		return null;
	}

	isNextRoundClicked(x, y) {
		if (!this.nextRoundBtn) return false;
		const b = this.nextRoundBtn;
		return x >= b.x - b.w / 2 && x <= b.x + b.w / 2 && y >= b.y - b.h / 2 && y <= b.y + b.h / 2;
	}
}
