// @ts-nocheck
/* eslint-disable */

/**
 * Leveling Out - Prova de Conceito Multiplayer (Pedra, Papel e Tesoura)
 * Conexão em tempo real entre diferentes redes via WebSocket/MQTT
 */

let roomCode = 'sala-padrao';
let client = null;
let myId = '';
let opponentId = null;
let opponentLastSeen = 0;
let isConnected = false;

// Estado do Jogo: 'CONECTANDO' | 'AGUARDANDO_OPONENTE' | 'ESCOLHENDO' | 'AGUARDANDO_OPONENTE_JOGADA' | 'RESULTADO'
let gameState = 'CONECTANDO';
let myMove = null;
let opponentMove = null;
let roundResult = null; // 'VITÓRIA' | 'DERROTA' | 'EMPATE'
let myScore = 0;
let opponentScore = 0;
let roundId = 1;
let statusMessage = 'Conectando ao servidor WebSocket...';

// Botões da interface
let buttons = [];
let nextRoundBtn = null;

function setup() {
	createCanvas(windowWidth, windowHeight);
	textAlign(CENTER, CENTER);
	rectMode(CENTER);

	// Resgata a sala injetada pelo SvelteKit
	roomCode = window.__ROOM_CODE__ || 'sala-demo';
	myId = 'player_' + Math.random().toString(36).substring(2, 8);

	initNetwork();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function initNetwork() {
	if (typeof mqtt === 'undefined') {
		statusMessage = 'Aguardando biblioteca de rede...';
		setTimeout(initNetwork, 500);
		return;
	}

	const topic = `levelingout/poc/${roomCode}`;
	statusMessage = `Conectando à sala: ${roomCode}...`;

	try {
		client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
			clientId: myId,
			clean: true,
			connectTimeout: 8000
		});

		client.on('connect', () => {
			isConnected = true;
			statusMessage = `Conectado à sala "${roomCode}". Aguardando oponente...`;
			client.subscribe(topic, (err) => {
				if (!err) {
					// Envia presença inicial
					sendMsg({ type: 'PRESENCE', id: myId });
				}
			});
		});

		client.on('message', (t, payload) => {
			try {
				const data = JSON.parse(payload.toString());
				if (data.id === myId) return; // Ignora mensagens próprias
				handleNetworkMessage(data);
			} catch (e) {
				console.error('Erro ao processar mensagem:', e);
			}
		});

		client.on('error', (err) => {
			console.error('Erro de conexão MQTT:', err);
			statusMessage = 'Erro de conexão na rede. Tentando reconectar...';
		});

		client.on('close', () => {
			isConnected = false;
			statusMessage = 'Conexão perdida. Reconectando...';
		});
	} catch (e) {
		console.error('Falha ao iniciar MQTT:', e);
		statusMessage = 'Falha ao inicializar socket de rede.';
	}
}

function sendMsg(obj) {
	if (client && isConnected) {
		const topic = `levelingout/poc/${roomCode}`;
		client.publish(topic, JSON.stringify(obj));
	}
}

function handleNetworkMessage(data) {
	opponentId = data.id;
	opponentLastSeen = millis();

	if (data.type === 'PRESENCE') {
		// Responde presença para que o novo jogador saiba que estamos aqui
		sendMsg({ type: 'PRESENCE_ACK', id: myId });
		if (gameState === 'CONECTANDO' || gameState === 'AGUARDANDO_OPONENTE') {
			startNewRound();
		}
	} else if (data.type === 'PRESENCE_ACK') {
		if (gameState === 'CONECTANDO' || gameState === 'AGUARDANDO_OPONENTE') {
			startNewRound();
		}
	} else if (data.type === 'MOVE') {
		if (data.roundId === roundId) {
			opponentMove = data.move;
			checkRoundCompletion();
		}
	} else if (data.type === 'RESTART') {
		roundId = data.roundId;
		startNewRound(false);
	}
}

function startNewRound(broadcast = true) {
	myMove = null;
	opponentMove = null;
	roundResult = null;
	gameState = 'ESCOLHENDO';
	statusMessage = 'Faça sua jogada!';

	if (broadcast) {
		sendMsg({ type: 'RESTART', id: myId, roundId: roundId });
	}
}

function chooseMove(move) {
	if (gameState !== 'ESCOLHENDO') return;

	myMove = move;
	gameState = 'AGUARDANDO_OPONENTE_JOGADA';
	statusMessage = 'Jogada enviada! Aguardando o oponente...';

	sendMsg({
		type: 'MOVE',
		id: myId,
		move: myMove,
		roundId: roundId
	});

	checkRoundCompletion();
}

function checkRoundCompletion() {
	if (myMove && opponentMove) {
		calculateResult();
		gameState = 'RESULTADO';
	}
}

function calculateResult() {
	if (myMove === opponentMove) {
		roundResult = 'EMPATE';
	} else if (
		(myMove === 'pedra' && opponentMove === 'tesoura') ||
		(myMove === 'papel' && opponentMove === 'pedra') ||
		(myMove === 'tesoura' && opponentMove === 'papel')
	) {
		roundResult = 'VITÓRIA';
		myScore += 1;
	} else {
		roundResult = 'DERROTA';
		opponentScore += 1;
	}
}

function draw() {
	background(13, 13, 16);

	// Envio periódico de presença para confirmar oponente online
	if (frameCount % 120 === 0 && isConnected) {
		sendMsg({ type: 'PRESENCE', id: myId });
	}

	const opponentOnline = opponentId && millis() - opponentLastSeen < 6000;

	// Atualiza estado caso oponente desconecte
	if (!opponentOnline && isConnected && gameState !== 'CONECTANDO') {
		gameState = 'AGUARDANDO_OPONENTE';
		statusMessage = `Sala: ${roomCode} | Aguardando oponente entrar em outra rede...`;
	}

	// 1. Cabeçalho Superior
	drawHeader(opponentOnline);

	// 2. Placar
	drawScoreboard();

	// 3. Área Central de Ação do Jogo
	if (gameState === 'CONECTANDO' || gameState === 'AGUARDANDO_OPONENTE') {
		drawWaitingScreen(opponentOnline);
	} else if (gameState === 'ESCOLHENDO' || gameState === 'AGUARDANDO_OPONENTE_JOGADA') {
		drawActionScreen();
	} else if (gameState === 'RESULTADO') {
		drawResultScreen();
	}
}

function drawHeader(opponentOnline) {
	push();
	noStroke();
	fill(24, 24, 28);
	rect(width / 2, 28, width, 56);

	// Indicador de Status da Rede
	textSize(13);
	textStyle(BOLD);

	if (!isConnected) {
		fill(239, 68, 68);
		text('● DESCONECTADO', 80, 28);
	} else if (!opponentOnline) {
		fill(245, 158, 11);
		text('● 1 JOGADOR NA SALA', 90, 28);
	} else {
		fill(16, 185, 129);
		text('● 2 JOGADORES CONECTADOS', 110, 28);
	}

	// Identificador da Sala
	fill(212, 212, 216);
	textSize(12);
	textStyle(NORMAL);
	text(`Sala: ${roomCode}`, width / 2, 28);

	// Meu ID de jogador
	fill(161, 161, 170);
	textSize(11);
	text(`Você: ${myId.replace('player_', '#')}`, width - 70, 28);
	pop();
}

function drawScoreboard() {
	push();
	const cy = 80;
	fill(255);
	textSize(15);
	textStyle(BOLD);
	text(`RODADA ${roundId}`, width / 2, cy - 10);

	// Placar estilizado
	fill(244, 63, 94);
	text(`Você: ${myScore}`, width / 2 - 80, cy + 16);

	fill(113, 113, 122);
	text(`vs`, width / 2, cy + 16);

	fill(59, 130, 246);
	text(`Oponente: ${opponentScore}`, width / 2 + 80, cy + 16);
	pop();
}

function drawWaitingScreen(opponentOnline) {
	push();
	const cy = height / 2;

	fill(255);
	textSize(26);
	textStyle(BOLD);
	text('Aguardando Jogador...', width / 2, cy - 40);

	fill(161, 161, 170);
	textSize(14);
	textStyle(NORMAL);
	text(`Abra esta mesma página em outro celular ou aba:`, width / 2, cy);

	fill(244, 63, 94);
	textSize(16);
	textStyle(BOLD);
	text(`Código: ${roomCode}`, width / 2, cy + 30);

	// Efeito de pulso
	const pulse = (sin(frameCount * 0.08) + 1) * 0.5;
	fill(244, 63, 94, 100 + pulse * 155);
	noStroke();
	circle(width / 2, cy + 80, 16 + pulse * 8);
	pop();
}

function drawActionScreen() {
	push();
	const cy = height * 0.32;

	fill(255);
	textSize(22);
	textStyle(BOLD);
	text(statusMessage, width / 2, cy);

	// Desenha os 3 botões de jogada
	const moves = [
		{ id: 'pedra', label: 'Pedra', icon: '🪨', color: color(100, 116, 139) },
		{ id: 'papel', label: 'Papel', icon: '📄', color: color(56, 189, 248) },
		{ id: 'tesoura', label: 'Tesoura', icon: '✂️', color: color(244, 63, 94) }
	];

	const btnW = min(130, width * 0.26);
	const btnH = 140;
	const spacing = min(24, width * 0.04);
	const totalW = moves.length * btnW + (moves.length - 1) * spacing;
	const startX = width / 2 - totalW / 2 + btnW / 2;
	const btnY = height * 0.58;

	buttons = [];

	for (let i = 0; i < moves.length; i++) {
		const m = moves[i];
		const bx = startX + i * (btnW + spacing);
		const by = btnY;

		// Detecta hover
		const isHover =
			mouseX >= bx - btnW / 2 &&
			mouseX <= bx + btnW / 2 &&
			mouseY >= by - btnH / 2 &&
			mouseY <= by + btnH / 2;

		const isSelected = myMove === m.id;

		buttons.push({
			id: m.id,
			x: bx,
			y: by,
			w: btnW,
			h: btnH
		});

		// Fundo do botão
		push();
		if (isSelected) {
			fill(244, 63, 94, 220);
			stroke(255);
			strokeWeight(3);
		} else if (isHover && gameState === 'ESCOLHENDO') {
			fill(39, 39, 42);
			stroke(244, 63, 94);
			strokeWeight(2);
		} else {
			fill(24, 24, 27);
			stroke(63, 63, 70);
			strokeWeight(1);
		}

		rect(bx, by, btnW, btnH, 16);

		// Ícone
		textSize(40);
		text(m.icon, bx, by - 16);

		// Texto
		textSize(15);
		textStyle(BOLD);
		fill(isSelected ? 255 : 228);
		noStroke();
		text(m.label, bx, by + 32);

		if (isSelected) {
			fill(255);
			textSize(11);
			text('✓ SUA ESCOLHA', bx, by + 52);
		}
		pop();
	}

	// Status do oponente
	const statusY = height * 0.85;
	fill(161, 161, 170);
	textSize(13);
	if (opponentMove) {
		fill(16, 185, 129);
		text('● Oponente já fez a jogada!', width / 2, statusY);
	} else {
		fill(245, 158, 11);
		text('○ Aguardando jogada do oponente...', width / 2, statusY);
	}
	pop();
}

function drawResultScreen() {
	push();
	const cy = height * 0.36;

	// Título do Resultado
	textSize(34);
	textStyle(BOLD);
	if (roundResult === 'VITÓRIA') {
		fill(16, 185, 129);
		text('VOCÊ VENCEU! 🎉', width / 2, cy - 30);
	} else if (roundResult === 'DERROTA') {
		fill(239, 68, 68);
		text('VOCÊ PERDEU! 😢', width / 2, cy - 30);
	} else {
		fill(245, 158, 11);
		text('EMPATE! 🤝', width / 2, cy - 30);
	}

	// Comparação das Jogadas
	const iconMap = { pedra: '🪨 Pedra', papel: '📄 Papel', tesoura: '✂️ Tesoura' };

	fill(244, 63, 94);
	textSize(18);
	textStyle(BOLD);
	text(`Você: ${iconMap[myMove] || myMove}`, width / 2 - 100, cy + 40);

	fill(113, 113, 122);
	textSize(16);
	text('vs', width / 2, cy + 40);

	fill(59, 130, 246);
	textSize(18);
	text(`Oponente: ${iconMap[opponentMove] || opponentMove}`, width / 2 + 100, cy + 40);

	// Botão Próxima Rodada
	const btnW = min(220, width * 0.7);
	const btnH = 50;
	const btnY = height * 0.68;

	nextRoundBtn = { x: width / 2, y: btnY, w: btnW, h: btnH };

	const isHover =
		mouseX >= width / 2 - btnW / 2 &&
		mouseX <= width / 2 + btnW / 2 &&
		mouseY >= btnY - btnH / 2 &&
		mouseY <= btnY + btnH / 2;

	if (isHover) {
		fill(225, 29, 72);
	} else {
		fill(244, 63, 94);
	}

	noStroke();
	rect(width / 2, btnY, btnW, btnH, 12);

	fill(255);
	textSize(16);
	textStyle(BOLD);
	text('Próxima Rodada ➔', width / 2, btnY);
	pop();
}

function mousePressed() {
	handleInteraction(mouseX, mouseY);
}

function touchStarted() {
	handleInteraction(touches.length > 0 ? touches[0].x : mouseX, touches.length > 0 ? touches[0].y : mouseY);
	return false;
}

function handleInteraction(x, y) {
	if (gameState === 'ESCOLHENDO') {
		for (const b of buttons) {
			if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 && y >= b.y - b.h / 2 && y <= b.y + b.h / 2) {
				chooseMove(b.id);
				return;
			}
		}
	} else if (gameState === 'RESULTADO' && nextRoundBtn) {
		const b = nextRoundBtn;
		if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 && y >= b.y - b.h / 2 && y <= b.y + b.h / 2) {
			roundId += 1;
			startNewRound(true);
			return;
		}
	}
}

function keyPressed() {
	if (gameState === 'ESCOLHENDO') {
		if (key === '1') chooseMove('pedra');
		if (key === '2') chooseMove('papel');
		if (key === '3') chooseMove('tesoura');
	} else if (gameState === 'RESULTADO' && key === ' ') {
		roundId += 1;
		startNewRound(true);
	}
}
