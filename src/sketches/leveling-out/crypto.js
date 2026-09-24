// @ts-nocheck
/* eslint-disable */

/**
 * Módulo de Criptografia de Ponta a Ponta (E2EE)
 * Utiliza a Web Crypto API nativa do navegador com algoritmo AES-GCM (256 bits).
 */

const E2EEService = (function () {
	let cryptoKey = null;

	/**
	 * Deriva uma chave simétrica AES-GCM a partir do código da sala usando SHA-256.
	 * @param {string} roomCode
	 */
	async function initKey(roomCode) {
		const enc = new TextEncoder();
		const salt = enc.encode('leveling-out-salt-v1');
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			enc.encode(roomCode || 'default-room'),
			{ name: 'PBKDF2' },
			false,
			['deriveKey']
		);

		cryptoKey = await crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt,
				iterations: 10000,
				hash: 'SHA-256'
			},
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);

		return cryptoKey;
	}

	/**
	 * Cifra um objeto JavaScript para uma string Base64 compacta contendo IV + Texto Cifrado.
	 * @param {object} dataObj
	 * @returns {Promise<string>}
	 */
	async function encrypt(dataObj) {
		if (!cryptoKey) {
			throw new Error('Chave de criptografia não inicializada');
		}

		// Vetor de Inicialização (IV) de 12 bytes único para cada mensagem
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encoded = new TextEncoder().encode(JSON.stringify(dataObj));

		const ciphertext = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			cryptoKey,
			encoded
		);

		// Combina IV (12 bytes) + Ciphertext para transmissão
		const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
		combined.set(iv, 0);
		combined.set(new Uint8Array(ciphertext), iv.byteLength);

		// Converte para Base64 de forma eficiente
		let binary = '';
		for (let i = 0; i < combined.byteLength; i++) {
			binary += String.fromCharCode(combined[i]);
		}
		return btoa(binary);
	}

	/**
	 * Decifra uma string Base64 e devolve o objeto original.
	 * @param {string} base64Str
	 * @returns {Promise<object>}
	 */
	async function decrypt(base64Str) {
		if (!cryptoKey) {
			throw new Error('Chave de criptografia não inicializada');
		}

		const binary = atob(base64Str);
		const combined = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			combined[i] = binary.charCodeAt(i);
		}

		const iv = combined.slice(0, 12);
		const ciphertext = combined.slice(12);

		const decrypted = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv },
			cryptoKey,
			ciphertext
		);

		return JSON.parse(new TextDecoder().decode(decrypted));
	}

	return {
		initKey,
		encrypt,
		decrypt,
		isReady: () => cryptoKey !== null
	};
})();
