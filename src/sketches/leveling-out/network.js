// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Rede e Persistência de Sessão
 * Conecta via WebSocket ao broker MQTT com criptografia E2EE e recuperação de sessão.
 */

class NetworkManager {
	constructor(roomCode, onMessage, onStatusChange) {
		this.roomCode = roomCode;
		this.onMessage = onMessage;
		this.onStatusChange = onStatusChange;

		this.client = null;
		this.isConnected = false;
		this.opponentId = null;
		this.opponentLastSeen = 0;

		// Persistência de Identidade: recupera ou gera um ID fixo para esta sala
		this.myId = this.loadOrGeneratePlayerId();
		this.topic = `levelingout/poc/${this.roomCode}`;
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
		this.onStatusChange(`Derivando chaves criptográficas para "${this.roomCode}"...`);
		await E2EEService.initKey(this.roomCode);

		if (typeof mqtt === 'undefined') {
			this.onStatusChange('Aguardando cliente MQTT carregar...');
			setTimeout(() => this.connect(), 400);
			return;
		}

		this.onStatusChange(`Conectando de forma segura à sala "${this.roomCode}"...`);

		try {
			this.client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
				clientId: this.myId,
				clean: true,
				connectTimeout: 8000
			});

			this.client.on('connect', () => {
				this.isConnected = true;
				this.onStatusChange(`Conectado à sala "${this.roomCode}". Aguardando oponente...`);
				this.client.subscribe(this.topic, (err) => {
					if (!err) {
						// Notifica entrada na sala com mensagem cifrada
						this.send({ type: 'PRESENCE', id: this.myId });
					}
				});
			});

			this.client.on('message', async (t, payload) => {
				try {
					const decrypted = await E2EEService.decrypt(payload.toString());
					if (decrypted.id === this.myId) return; // Ignora pacotes próprios

					this.opponentId = decrypted.id;
					this.opponentLastSeen = millis();
					this.onMessage(decrypted);
				} catch (err) {
					// Pacote ilegível ou de chave divergente (segurança mantida)
					console.warn('[E2EE] Pacote descartado (falha de autenticidade/cifra):', err);
				}
			});

			this.client.on('error', (err) => {
				console.error('[MQTT Error]', err);
				this.onStatusChange('Erro de conexão na rede. Tentando reconectar...');
			});

			this.client.on('close', () => {
				this.isConnected = false;
				this.onStatusChange('Conexão perdida. Tentando reconectar...');
			});
		} catch (e) {
			console.error('Falha de inicialização de rede:', e);
			this.onStatusChange('Falha ao inicializar o socket de rede.');
		}
	}

	async send(dataObj, retain = false) {
		if (this.client && this.isConnected && E2EEService.isReady()) {
			try {
				const encrypted = await E2EEService.encrypt(dataObj);
				this.client.publish(this.topic, encrypted, { retain });
			} catch (e) {
				console.error('[E2EE] Erro ao cifrar mensagem:', e);
			}
		}
	}

	updateHeartbeat() {
		// Dispara presença periódica a cada ~2 segundos
		if (frameCount % 120 === 0 && this.isConnected) {
			this.send({ type: 'PRESENCE', id: this.myId });
		}
	}

	isOpponentOnline() {
		return Boolean(this.opponentId && millis() - this.opponentLastSeen < 6500);
	}
}
