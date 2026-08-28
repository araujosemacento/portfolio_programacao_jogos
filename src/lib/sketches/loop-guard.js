/**
 * Proteção robusta contra loops infinitos em sketches p5.js.
 * Injeta sentinelas dentro do corpo de laços (for, while, do-while) sem quebrar
 * sintaxes com parênteses aninhados ou contextos de instrução única.
 * 
 * @param {string} code Código JavaScript original
 * @param {number} maxDurationMs Tempo máximo permitido em um único loop (padrão: 1500ms)
 * @returns {string} Código instrumentado com proteção
 */
export function protectLoops(code, maxDurationMs = 1500) {
	if (!code || typeof code !== 'string') return '';

	let loopIndex = 0;
	let result = '';
	let i = 0;
	const len = code.length;

	while (i < len) {
		// Ignora comentários de linha //...
		if (code[i] === '/' && code[i + 1] === '/') {
			const end = code.indexOf('\n', i + 2);
			if (end === -1) {
				result += code.slice(i);
				break;
			}
			result += code.slice(i, end + 1);
			i = end + 1;
			continue;
		}

		// Ignora comentários de bloco /*...*/
		if (code[i] === '/' && code[i + 1] === '*') {
			const end = code.indexOf('*/', i + 2);
			if (end === -1) {
				result += code.slice(i);
				break;
			}
			result += code.slice(i, end + 2);
			i = end + 2;
			continue;
		}

		// Ignora strings literais '...', "...", `...`
		if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
			const quote = code[i];
			result += quote;
			i++;
			while (i < len) {
				if (code[i] === '\\') {
					result += code[i] + (code[i + 1] || '');
					i += 2;
					continue;
				}
				if (code[i] === quote) {
					result += quote;
					i++;
					break;
				}
				result += code[i];
				i++;
			}
			continue;
		}

		// Detecta início de 'for' ou 'while'
		const isFor = isKeywordAt(code, i, 'for');
		const isWhile = isKeywordAt(code, i, 'while');
		const isDo = isKeywordAt(code, i, 'do');

		if (isFor || isWhile) {
			const keyword = isFor ? 'for' : 'while';
			result += keyword;
			i += keyword.length;

			// Avança até o parêntese de abertura '('
			while (i < len && code[i] !== '(') {
				result += code[i];
				i++;
			}

			if (i < len && code[i] === '(') {
				// Avança consumindo a expressão com suporte a parênteses aninhados
				let parenDepth = 1;
				result += '(';
				i++;

				while (i < len && parenDepth > 0) {
					if (code[i] === '(') parenDepth++;
					else if (code[i] === ')') parenDepth--;
					result += code[i];
					i++;
				}

				// Avança espaços em branco até encontrar a chave '{'
				while (i < len && /\s/.test(code[i])) {
					result += code[i];
					i++;
				}

				if (i < len && code[i] === '{') {
					const id = ++loopIndex;
					result += '{ ' + getLoopGuardSnippet(id, maxDurationMs);
					i++;
				}
			}
			continue;
		}

		if (isDo) {
			result += 'do';
			i += 2;

			// Avança espaços em branco até encontrar a chave '{'
			while (i < len && /\s/.test(code[i])) {
				result += code[i];
				i++;
			}

			if (i < len && code[i] === '{') {
				const id = ++loopIndex;
				result += '{ ' + getLoopGuardSnippet(id, maxDurationMs);
				i++;
			}
			continue;
		}

		result += code[i];
		i++;
	}

	return result;
}

/**
 * Verifica se uma palavra-chave está em uma posição delimitada por bordas de palavra.
 * @param {string} str
 * @param {number} idx
 * @param {string} word
 * @returns {boolean}
 */
function isKeywordAt(str, idx, word) {
	if (!str.startsWith(word, idx)) return false;
	const prevChar = idx > 0 ? str[idx - 1] : ' ';
	const nextChar = idx + word.length < str.length ? str[idx + word.length] : ' ';
	return !/[a-zA-Z0-9_$]/.test(prevChar) && !/[a-zA-Z0-9_$]/.test(nextChar);
}

/**
 * Gera o snippet de sentinela a ser injetado dentro do laço.
 * @param {number} id
 * @param {number} maxDurationMs
 * @returns {string}
 */
function getLoopGuardSnippet(id, maxDurationMs) {
	return `if (window.__checkLoop && window.__checkLoop(${id}, ${maxDurationMs})) { throw new Error('Loop infinito detectado (tempo limite de ${maxDurationMs}ms excedido).'); } `;
}
