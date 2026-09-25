// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Rede e Persistência de Sessão
 * Conecta diretamente ao PocketBase via REST e Server-Sent Events (SSE).
 */

class NetworkManager {
	constructor(roomCode, onMessage, onStatusChange) {
		this.roomCode = roomCode;
		this.onMessage = onMessage;
		this.onStatusChange = onStatusChange;
		this.backendUrl = window.__BACKEND_URL__ || 'http://localhost:8090';

		this.pb = null;
		this.isConnected = false;
		this.opponentId = null;
		this.opponentLastSeen = 0;
		this.myEquipe = null; // 'A' ou 'B'
		this.salaRecord = null;
		this.jogadorRecord = null;

		// Persistência de Identidade: recupera ou gera um ID fixo para esta sala
		this.myId = this.loadOrGeneratePlayerId();
		this.heartbeatTimer = null;
		this.statusPollingTimer = null;
		this._lastHeartbeat = 0;
	}

	loadOrGeneratePlayerId() {
		try {
			const storageKey = `leveling_player_${this.roomCode}`;
			const saved = sessionStorage.getItem(storageKey);
			if (saved) {
				return saved;
			}
			const newId = 'player_' + Math.random().toString(36).substring(2, 8);
			sessionStorage.setItem(storageKey, newId);
			return newId;
		} catch (e) {
			return 'player_' + Math.random().toString(36).substring(2, 8);
		}
	}

	async connect() {
		this.onStatusChange(`Conectando ao PocketBase (${this.backendUrl})...`);

		if (typeof PocketBase === 'undefined') {
			this.onStatusChange('Aguardando cliente PocketBase carregar...');
			setTimeout(() => this.connect(), 300);
			return;
		}

		try {
			this.pb = new PocketBase(this.backendUrl);

			// 1. Obter ou Criar a Sala no PocketBase
			const salas = await this.pb.collection('salas').getList(1, 1, {
				filter: `codigo = "${this.roomCode}"`
			});

			if (salas.items.length > 0) {
				this.salaRecord = salas.items[0];
			} else {
				this.salaRecord = await this.pb.collection('salas').create({
					codigo: this.roomCode,
					fase: 'INICIATIVA',
					rodada_atual: 1,
					equipe_ativa: 'A',
					placar_a: 0,
					placar_b: 0
				});
			}

			// 2. Determinar equipe e registrar o jogador em 'jogadores'
			const jogadores = await this.pb.collection('jogadores').getList(1, 10, {
				filter: `sala_codigo = "${this.roomCode}"`
			});

			// Verifica se este jogador já possui cadastro na sala
			const existing = jogadores.items.find((j) => j.player_id === this.myId);
			if (existing) {
				this.jogadorRecord = existing;
				this.myEquipe = existing.equipe;
			} else {
				// Equipe A para o primeiro jogador, Equipe B para o segundo
				const hasTeamA = jogadores.items.some((j) => j.equipe === 'A');
				this.myEquipe = hasTeamA ? 'B' : 'A';

				this.jogadorRecord = await this.pb.collection('jogadores').create({
					sala_codigo: this.roomCode,
					player_id: this.myId,
					nome: this.myId.replace('player_', 'Jogador '),
					equipe: this.myEquipe,
					papel: 'CODIFICADOR',
					last_seen: new Date().toISOString()
				});
			}

			this.isConnected = true;
			this.onStatusChange(`Conectado como Equipe ${this.myEquipe}. Aguardando oponente...`);

			// Sincroniza o estado inicial da sala com o jogo
			this.onMessage({
				type: 'SALA_UPDATE',
				sala: this.salaRecord
			});

			// 3. Assinar atualizações da sala via SSE
			await this.pb.collection('salas').subscribe(this.salaRecord.id, (e) => {
				if (e.action === 'update') {
					this.salaRecord = e.record;
					this.onMessage({
						type: 'SALA_UPDATE',
						sala: e.record
					});
				}
			});

			// 4. Assinar presença de jogadores via SSE
			await this.pb.collection('jogadores').subscribe('*', (e) => {
				if (e.record.sala_codigo === this.roomCode) {
					if (e.record.player_id !== this.myId) {
						this.opponentId = e.record.player_id;
						this.opponentLastSeen = millis();
						this.onMessage({
							type: 'OPPONENT_ONLINE',
							opponent: e.record
						});
					}
				}
			});

			// Identifica se já existe outro participante online na sala
			const otherPlayer = jogadores.items.find((j) => j.player_id !== this.myId);
			if (otherPlayer) {
				this.opponentId = otherPlayer.player_id;
				this.opponentLastSeen = millis();
				this.onMessage({
					type: 'OPPONENT_ONLINE',
					opponent: otherPlayer
				});
			}
		} catch (err) {
			console.error('[PocketBase Error]', err);
			this.isConnected = false;
			this.onStatusChange('Falha de conexão com o PocketBase. Tentando novamente...');
			setTimeout(() => this.connect(), 2000);
		}
	}

	async enviarLance(lance, rodada) {
		if (!this.isConnected || !this.pb) return;

		try {
			const response = await this.pb.send('/api/ppt/lance', {
				method: 'POST',
				body: {
					sala_codigo: this.roomCode,
					player_id: this.myId,
					equipe: this.myEquipe,
					lance: lance,
					rodada: rodada
				}
			});

			if (response.status === 'RESOLVIDO') {
				this.stopStatusPolling();
				this.onMessage({
					type: 'PPT_RESOLVIDO',
					data: response
				});
			} else if (response.status === 'AGUARDANDO_OPONENTE') {
				this.startStatusPolling(rodada);
			}
		} catch (err) {
			console.error('[Lance Error]', err);
		}
	}

	startStatusPolling(rodada) {
		this.stopStatusPolling();
		this.statusPollingTimer = setInterval(async () => {
			if (!this.pb) return;
			try {
				const response = await this.pb.send(
					`/api/ppt/status?sala_codigo=${encodeURIComponent(this.roomCode)}&rodada=${rodada}`,
					{ method: 'GET' }
				);
				if (response.status === 'RESOLVIDO') {
					this.stopStatusPolling();
					this.onMessage({
						type: 'PPT_RESOLVIDO',
						data: response
					});
				}
			} catch (err) {
				console.warn('[Polling Status Error]', err);
			}
		}, 800);
	}

	stopStatusPolling() {
		if (this.statusPollingTimer) {
			clearInterval(this.statusPollingTimer);
			this.statusPollingTimer = null;
		}
	}

	updateHeartbeat() {
		if (!this.isConnected || !this.pb || !this.jogadorRecord) return;

		const now = millis();
		if (!this._lastHeartbeat || now - this._lastHeartbeat > 10000) {
			this._lastHeartbeat = now;
			this.pb
				.collection('jogadores')
				.update(this.jogadorRecord.id, {
					last_seen: new Date().toISOString()
				})
				.catch(() => {});
		}
	}

	isOpponentOnline() {
		if (!this.opponentId) return false;
		return millis() - this.opponentLastSeen < 30000;
	}
}
