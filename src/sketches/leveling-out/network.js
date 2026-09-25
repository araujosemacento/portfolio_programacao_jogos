// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Rede e Persistência de Sessão
 * Conecta diretamente ao PocketBase via REST e Server-Sent Events (SSE).
 * Inclui Re-hidratação de Estado (Full State Resync), Heartbeat com Auto-recuperação
 * e tratamento rigoroso contra desconexões órfãs e dados obsoletos.
 */

class NetworkManager {
	constructor(roomCode, onMessage, onStatusChange) {
		this.roomCode = roomCode;
		this.onMessage = onMessage;
		this.onStatusChange = onStatusChange;
		this.backendUrl = window.__BACKEND_URL__ || 'http://localhost:8090';

		this.pb = null;
		this.isConnected = false;
		this.isSynchronizing = false;
		this.syncError = null;

		this.opponentId = null;
		this.opponentLastSeen = 0;
		this.myEquipe = null; // 'A' ou 'B'
		this.salaRecord = null;
		this.jogadorRecord = null;

		// Persistência de Identidade: recupera ou gera um ID fixo para esta sala
		this.myId = this.loadOrGeneratePlayerId();
		this.statusPollingTimer = null;
		this._lastHeartbeat = 0;

		// Monitor de visibilidade de aba para reconciliação automática
		this.setupVisibilityListener();
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

	setupVisibilityListener() {
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'visible' && this.isConnected) {
					console.log('[Network] Aba visível novamente. Engatilhando reconciliação de estado...');
					this.reconcileState();
				}
			});
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
			await this.reconcileState(true);
			this.setupRealtimeSubscriptions();
		} catch (err) {
			console.error('[PocketBase Connect Error]', err);
			this.isConnected = false;
			this.syncError = 'Falha de conexão com o servidor. Verifique a URL do backend.';
			this.onStatusChange('Falha de conexão com o PocketBase. Tentando novamente...');
			setTimeout(() => this.connect(), 3000);
		}
	}

	/**
	 * Re-hidratação de Estado (Full State Resync)
	 * Busca o estado autoritativo no banco de dados e sobrescreve o cache local.
	 * Protegido por timeout e retry com exponential backoff.
	 */
	async reconcileState(isInitial = false) {
		if (!this.pb) return;

		this.isSynchronizing = true;
		this.syncError = null;

		let retries = 3;
		let delay = 1000;

		while (retries > 0) {
			try {
				await this._performReconcile();
				this.isSynchronizing = false;
				this.syncError = null;
				this.isConnected = true;
				return;
			} catch (err) {
				retries--;
				console.warn(`[Network Reconcile] Tentativa falhou (${3 - retries}/3):`, err);
				if (retries === 0) {
					this.isSynchronizing = false;
					this.syncError = 'Não foi possível sincronizar com o servidor. Verifique sua conexão.';
					this.onStatusChange('Servidor indisponível.');
					return;
				}
				await new Promise((res) => setTimeout(res, delay));
				delay *= 2;
			}
		}
	}

	async _performReconcile() {
		// Timeout de segurança de 5 segundos para a requisição
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(() => reject(new Error('Timeout de sincronização excedido')), 5000)
		);

		const syncWork = async () => {
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

			// 2. Obter jogadores ativos na sala
			const jogadores = await this.pb.collection('jogadores').getList(1, 10, {
				filter: `sala_codigo = "${this.roomCode}"`
			});

			// Verifica se este jogador já possui cadastro ativo na sala
			let myRecord = jogadores.items.find((j) => j.player_id === this.myId);

			if (!myRecord) {
				// Equipe A para o primeiro jogador, Equipe B para o segundo
				const hasTeamA = jogadores.items.some((j) => j.equipe === 'A');
				this.myEquipe = hasTeamA ? 'B' : 'A';

				myRecord = await this.pb.collection('jogadores').create({
					sala_codigo: this.roomCode,
					player_id: this.myId,
					nome: this.myId.replace('player_', 'Jogador '),
					equipe: this.myEquipe,
					papel: 'CODIFICADOR',
					last_seen: new Date().toISOString()
				});
			} else {
				this.myEquipe = myRecord.equipe;
				// Atualiza o last_seen imediatamente
				try {
					myRecord = await this.pb.collection('jogadores').update(myRecord.id, {
						last_seen: new Date().toISOString()
					});
				} catch (_) {}
			}
			this.jogadorRecord = myRecord;

			// 3. Atualizar oponente ativo
			const otherPlayer = jogadores.items.find((j) => j.player_id !== this.myId);
			if (otherPlayer) {
				this.opponentId = otherPlayer.player_id;
				this.opponentLastSeen = millis();
			} else {
				this.opponentId = null;
				this.opponentLastSeen = 0;
			}

			// 4. Verificar status de lances da rodada atual
			let pptStatus = null;
			try {
				const currentRound = this.salaRecord.rodada_atual || 1;
				pptStatus = await this.pb.send(
					`/api/ppt/status?sala_codigo=${encodeURIComponent(this.roomCode)}&rodada=${currentRound}`,
					{ method: 'GET' }
				);
			} catch (_) {}

			// 5. Notificar motor de jogo para hidratação autoritativa completa
			this.onMessage({
				type: 'FULL_SYNC',
				sala: this.salaRecord,
				myEquipe: this.myEquipe,
				opponent: otherPlayer || null,
				pptStatus: pptStatus
			});

			const statusEquipe = this.opponentId ? '2 jogadores na sala' : 'Aguardando oponente entrar';
			this.onStatusChange(`Conectado como Equipe ${this.myEquipe}. ${statusEquipe}.`);
		};

		return Promise.race([syncWork(), timeoutPromise]);
	}

	async setupRealtimeSubscriptions() {
		try {
			// Cancela inscrições anteriores se existirem
			try {
				this.pb.collection('salas').unsubscribe();
				this.pb.collection('jogadores').unsubscribe();
			} catch (_) {}

			// 1. Assinar atualizações da sala via SSE
			await this.pb.collection('salas').subscribe(this.salaRecord.id, async (e) => {
				if (e.action === 'update') {
					this.salaRecord = e.record;
					this.onMessage({
						type: 'SALA_UPDATE',
						sala: e.record
					});

					// Consulta status de lances para feedback instantâneo de jogada do oponente
					this.verificarStatusOponente(e.record.rodada_atual || 1);
				}
			});

			// 2. Assinar presença de jogadores via SSE com tratamento rigoroso de deleção
			await this.pb.collection('jogadores').subscribe('*', (e) => {
				if (e.record.sala_codigo !== this.roomCode) return;

				if (e.action === 'delete') {
					if (e.record.player_id !== this.myId) {
						if (this.opponentId === e.record.player_id) {
							console.log('[Presence SSE] Oponente deletado pelo servidor.');
							this.opponentId = null;
							this.opponentLastSeen = 0;
							this.onMessage({
								type: 'OPPONENT_OFFLINE',
								opponentId: e.record.player_id
							});
						}
					} else {
						// O próprio jogador foi expurgado por inatividade pelo cleanup
						console.log('[Presence SSE] Registro próprio foi purgado. Re-cadastrando...');
						this.jogadorRecord = null;
						this.reconcileState();
					}
				} else if (e.action === 'create' || e.action === 'update') {
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
		} catch (err) {
			console.warn('[SSE Subscription Warning]', err);
		}
	}

	async verificarStatusOponente(rodada) {
		if (!this.pb) return;
		try {
			const res = await this.pb.send(
				`/api/ppt/status?sala_codigo=${encodeURIComponent(this.roomCode)}&rodada=${rodada}`,
				{ method: 'GET' }
			);

			if (res.status === 'RESOLVIDO') {
				this.stopStatusPolling();
				this.onMessage({
					type: 'PPT_RESOLVIDO',
					data: res
				});
			} else if (res.equipes_enviadas && Array.isArray(res.equipes_enviadas)) {
				const opponentTeam = this.myEquipe === 'A' ? 'B' : 'A';
				if (res.equipes_enviadas.includes(opponentTeam)) {
					this.onMessage({
						type: 'OPPONENT_MOVED',
						rodada: rodada
					});
				}
			}
		} catch (_) {}
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
		if (!this.isConnected || !this.pb) return;

		const now = millis();
		if (!this._lastHeartbeat || now - this._lastHeartbeat > 8000) {
			this._lastHeartbeat = now;

			if (!this.jogadorRecord) {
				this.reconcileState();
				return;
			}

			this.pb
				.collection('jogadores')
				.update(this.jogadorRecord.id, {
					last_seen: new Date().toISOString()
				})
				.catch((err) => {
					// Se o registro não existe mais (404), fomos purgados pelo cleanup
					if (err && err.status === 404) {
						console.log('[Heartbeat] Registro de jogador não encontrado (404). Reconciliando...');
						this.jogadorRecord = null;
						this.reconcileState();
					}
				});
		}
	}

	isOpponentOnline() {
		if (!this.opponentId) return false;
		return millis() - this.opponentLastSeen < 30000;
	}
}
