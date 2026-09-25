// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Interface e Renderização Visual em p5.js
 * Desenha a interface responsiva, botões táteis e feedbacks de estado.
 * Rigorosamente em conformidade com as diretrizes: sem emojis, sem cards genéricos,
 * sem travessões e sem marcadores circulares.
 */

class UIRenderer {
	constructor() {
		this.buttons = [];
		this.nextRoundBtn = null;
		this.retryBtn = null;
	}

	render(game, network) {
		background(13, 13, 16);

		const opponentOnline = network.isOpponentOnline();

		// Se o oponente desconectar durante o jogo
		if (!opponentOnline && network.isConnected && game.state !== 'CONECTANDO') {
			if (game.state !== 'AGUARDANDO_OPONENTE') {
				game.state = 'AGUARDANDO_OPONENTE';
				game.statusMessage = 'Oponente desconectou. Aguardando retorno...';
			}
		}

		// 1. Cabeçalho com indicador de rede e sala
		this.drawHeader(network, opponentOnline);

		// 2. Placar da partida
		this.drawScoreboard(game);

		// 3. Telas de estado
		if (game.state === 'CONECTANDO' || game.state === 'AGUARDANDO_OPONENTE') {
			this.drawWaitingScreen(network);
		} else if (game.state === 'ESCOLHENDO' || game.state === 'AGUARDANDO_OPONENTE_JOGADA') {
			this.drawActionScreen(game);
		} else if (game.state === 'REVELANDO') {
			this.drawRevealingScreen(game);
		} else if (game.state === 'RESULTADO') {
			this.drawResultScreen(game);
		}

		// 4. Overlays de Sincronização e Erro Crítico (Salva-guarda de Hidratação)
		if (network.isSynchronizing) {
			this.drawSynchronizingOverlay();
		} else if (network.syncError) {
			this.drawErrorOverlay(network.syncError);
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
			text('DESCONECTADO', 70, 28);
		} else if (!opponentOnline) {
			fill(245, 158, 11);
			text('1 JOGADOR NA SALA', 80, 28);
		} else {
			fill(16, 185, 129);
			text('2 CONECTADOS (POCKETBASE)', 100, 28);
		}

		// Identificador da Sala
		fill(212, 212, 216);
		textSize(12);
		textStyle(NORMAL);
		text(`Sala: ${network.roomCode}`, width / 2, 28);

		// ID persistente do jogador
		fill(161, 161, 170);
		textSize(11);
		text(`Você: #${network.myId.replace('player_', '')}`, width - 70, 28);
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

	drawWaitingScreen(network) {
		push();
		const cy = height / 2;

		// Ícone vetorial do Tubo de Ensaio graduado (Identidade Leveling Out)
		this.drawTestTubeIcon(width / 2, cy - 75, 1.4);

		fill(255);
		textSize(24);
		textStyle(BOLD);
		text('Aguardando Jogador...', width / 2, cy - 10);

		fill(161, 161, 170);
		textSize(14);
		textStyle(NORMAL);
		text('Abra esta mesma sala em outro celular ou janela:', width / 2, cy + 25);

		fill(244, 63, 94);
		textSize(16);
		textStyle(BOLD);
		text(`Código: ${network.roomCode}`, width / 2, cy + 55);
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

			// Ícone Vetorial da Jogada
			this.drawMoveIcon(m.id, bx, by - 14, 28, isSelected);

			// Rótulo da Jogada
			textSize(16);
			textStyle(BOLD);
			fill(isSelected ? 255 : 228);
			noStroke();
			text(m.label, bx, isSelected ? by + 16 : by + 22);

			if (isSelected) {
				fill(255);
				textSize(10);
				text('SUA ESCOLHA', bx, by + 32);
			}
			pop();
		}

		// Status do Oponente em tempo real
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
			text('VOCÊ VENCEU!', width / 2, cy - 40);
		} else if (game.roundResult === 'DERROTA') {
			fill(239, 68, 68);
			text('VOCÊ PERDEU!', width / 2, cy - 40);
		} else {
			fill(245, 158, 11);
			text('EMPATE!', width / 2, cy - 40);
		}

		const iconMap = { pedra: 'Pedra', papel: 'Papel', tesoura: 'Tesoura' };

		// Ícones das jogadas em confronto
		this.drawMoveIcon(game.myMove, width / 2 - 100, cy + 10, 36, true);
		this.drawMoveIcon(game.opponentMove, width / 2 + 100, cy + 10, 36, false);

		fill(244, 63, 94);
		textSize(16);
		textStyle(BOLD);
		text(`Você: ${iconMap[game.myMove] || game.myMove}`, width / 2 - 100, cy + 46);

		fill(113, 113, 122);
		textSize(16);
		text('vs', width / 2, cy + 46);

		fill(59, 130, 246);
		textSize(16);
		text(`Oponente: ${iconMap[game.opponentMove] || game.opponentMove}`, width / 2 + 100, cy + 46);

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

	drawRevealingScreen(game) {
		push();
		const cy = height * 0.45;
		const elapsed = millis() - (game.revealStartTime || millis());

		let stageWord = 'Pedra...';
		let wordColor = color(244, 63, 94);
		let scaleFactor = 1.0;
		let activeIcon = 'pedra';

		if (elapsed < 380) {
			stageWord = 'Pedra...';
			wordColor = color(244, 63, 94);
			scaleFactor = 1.0 + (elapsed / 380) * 0.15;
			activeIcon = 'pedra';
		} else if (elapsed < 760) {
			stageWord = 'Papel...';
			wordColor = color(245, 158, 11);
			scaleFactor = 1.0 + ((elapsed - 380) / 380) * 0.15;
			activeIcon = 'papel';
		} else if (elapsed < 1140) {
			stageWord = 'Tesoura...';
			wordColor = color(59, 130, 246);
			scaleFactor = 1.0 + ((elapsed - 760) / 380) * 0.15;
			activeIcon = 'tesoura';
		} else {
			stageWord = 'JÁ!';
			wordColor = color(16, 185, 129);
			scaleFactor = 1.3;
			activeIcon = game.myMove || 'pedra';
		}

		// Ícone vetorial dinâmico do lance no ritmo da contagem
		this.drawMoveIcon(activeIcon, width / 2, cy - 70, 44 * scaleFactor, elapsed >= 1140);

		textSize(36 * scaleFactor);
		textStyle(BOLD);
		fill(wordColor);
		text(stageWord, width / 2, cy - 15);

		fill(161, 161, 170);
		textSize(15);
		textStyle(NORMAL);
		text('Revelando lances simultaneamente...', width / 2, cy + 42);

		const myMoveStr = game.myMove ? (game.myMove.charAt(0).toUpperCase() + game.myMove.slice(1)) : 'Pronto';
		fill(244, 63, 94);
		textSize(16);
		textStyle(BOLD);
		text(`Você: ${myMoveStr}`, width / 2 - 90, cy + 85);

		fill(113, 113, 122);
		text('vs', width / 2, cy + 85);

		fill(59, 130, 246);
		text('Oponente: ?', width / 2 + 90, cy + 85);
		pop();
	}

	drawMoveIcon(type, x, y, size = 28, isSelected = false) {
		push();
		translate(x, y);
		const s = size / 2;
		strokeJoin(ROUND);
		strokeCap(ROUND);

		if (type === 'pedra') {
			// Rocha facetada geométrica
			if (isSelected) {
				fill(255);
				stroke(255);
			} else {
				fill(161, 161, 170);
				stroke(212, 212, 216);
			}
			strokeWeight(1.5);
			beginShape();
			vertex(-s * 0.75, -s * 0.2);
			vertex(-s * 0.35, -s * 0.85);
			vertex(s * 0.45, -s * 0.7);
			vertex(s * 0.85, s * 0.15);
			vertex(s * 0.35, s * 0.85);
			vertex(-s * 0.55, s * 0.65);
			endShape(CLOSE);

			stroke(isSelected ? color(244, 63, 94) : color(24, 24, 27));
			strokeWeight(1.2);
			line(-s * 0.35, -s * 0.85, 0, 0);
			line(s * 0.45, -s * 0.7, 0, 0);
			line(s * 0.85, s * 0.15, 0, 0);
			line(s * 0.35, s * 0.85, 0, 0);
			line(-s * 0.55, s * 0.65, 0, 0);
			line(-s * 0.75, -s * 0.2, 0, 0);
		} else if (type === 'papel') {
			// Folha de documento com dobra superior direita
			if (isSelected) {
				fill(255);
				stroke(255);
			} else {
				fill(161, 161, 170);
				stroke(212, 212, 216);
			}
			strokeWeight(1.5);
			const w = s * 1.3;
			const h = s * 1.7;
			const fold = s * 0.55;

			beginShape();
			vertex(-w / 2, -h / 2);
			vertex(w / 2 - fold, -h / 2);
			vertex(w / 2, -h / 2 + fold);
			vertex(w / 2, h / 2);
			vertex(-w / 2, h / 2);
			endShape(CLOSE);

			line(w / 2 - fold, -h / 2, w / 2 - fold, -h / 2 + fold);
			line(w / 2 - fold, -h / 2 + fold, w / 2, -h / 2 + fold);

			stroke(isSelected ? color(244, 63, 94) : color(24, 24, 27));
			strokeWeight(1.2);
			line(-w / 2 + s * 0.35, -h / 2 + fold + s * 0.25, w / 2 - s * 0.35, -h / 2 + fold + s * 0.25);
			line(-w / 2 + s * 0.35, 0, w / 2 - s * 0.35, 0);
			line(-w / 2 + s * 0.35, s * 0.4, w / 2 - s * 0.35, s * 0.4);
		} else if (type === 'tesoura') {
			// Lâminas de tesoura cruzadas estilizadas
			stroke(isSelected ? 255 : 212);
			strokeWeight(2);
			noFill();

			line(-s * 0.25, s * 0.1, s * 0.85, -s * 0.85);
			line(s * 0.25, s * 0.1, -s * 0.85, -s * 0.85);

			fill(isSelected ? color(244, 63, 94) : color(24, 24, 27));
			strokeWeight(1.5);
			ellipse(0, -s * 0.2, s * 0.4, s * 0.4);

			noFill();
			strokeWeight(1.8);
			ellipse(-s * 0.45, s * 0.55, s * 0.6, s * 0.6);
			ellipse(s * 0.45, s * 0.55, s * 0.6, s * 0.6);
		}
		pop();
	}

	drawTestTubeIcon(x, y, scaleFactor = 1.0) {
		push();
		translate(x, y);
		scale(scaleFactor);
		rectMode(CENTER);

		// Bocal
		noStroke();
		fill(63, 63, 70);
		rect(0, -28, 20, 4, 2);

		// Vidro do Tubo de Ensaio
		stroke(113, 113, 122);
		strokeWeight(2);
		fill(24, 24, 27, 200);
		beginShape();
		vertex(-7, -26);
		vertex(-7, 18);
		bezierVertex(-7, 28, 7, 28, 7, 18);
		vertex(7, -26);
		endShape();

		// Líquido Rosa Leveling Out com menisco
		noStroke();
		fill(244, 63, 94, 220);
		beginShape();
		vertex(-5, 0);
		vertex(-5, 18);
		bezierVertex(-5, 26, 5, 26, 5, 18);
		vertex(5, 0);
		bezierVertex(2.5, 2, -2.5, 2, -5, 0);
		endShape();

		// Graduações do vidro
		stroke(255, 255, 255, 90);
		strokeWeight(1);
		line(-5, -16, -1, -16);
		line(-5, -8, -2, -8);
		line(-5, 0, -1, 0);
		line(-5, 8, -2, 8);
		line(-5, 16, -1, 16);
		pop();
	}

	drawSynchronizingOverlay() {
		push();
		fill(13, 13, 16, 210);
		noStroke();
		rect(width / 2, height / 2, width, height);

		fill(255);
		textSize(16);
		textStyle(BOLD);
		text('Sincronizando com o servidor...', width / 2, height / 2);
		pop();
	}

	drawErrorOverlay(errorMsg) {
		push();
		fill(13, 13, 16, 240);
		noStroke();
		rect(width / 2, height / 2, width, height);

		fill(239, 68, 68);
		textSize(20);
		textStyle(BOLD);
		text('Conexão Interrompida', width / 2, height / 2 - 35);

		fill(212, 212, 216);
		textSize(13);
		textStyle(NORMAL);
		text(errorMsg || 'Servidor inalcançável.', width / 2, height / 2);

		const btnW = 180;
		const btnH = 44;
		const btnY = height / 2 + 45;
		this.retryBtn = { x: width / 2, y: btnY, w: btnW, h: btnH };

		const isHover =
			mouseX >= width / 2 - btnW / 2 &&
			mouseX <= width / 2 + btnW / 2 &&
			mouseY >= btnY - btnH / 2 &&
			mouseY <= btnY + btnH / 2;

		fill(isHover ? color(225, 29, 72) : color(244, 63, 94));
		rect(width / 2, btnY, btnW, btnH, 8);

		fill(255);
		textSize(14);
		textStyle(BOLD);
		text('Tentar Novamente', width / 2, btnY);
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

	isRetryClicked(x, y) {
		if (!this.retryBtn) return false;
		const b = this.retryBtn;
		return x >= b.x - b.w / 2 && x <= b.x + b.w / 2 && y >= b.y - b.h / 2 && y <= b.y + b.h / 2;
	}
}
