/**
 * Proteção leve contra loops infinitos em sketches p5.js.
 * Injeta sentinelas em laços (for, while, do-while) que verificam o tempo de execução por frame.
 * 
 * @param {string} code Código JavaScript original
 * @param {number} maxDurationMs Tempo máximo permitido por frame em um único loop (padrão: 1500ms)
 * @returns {string} Código instrumentado com proteção
 */
export function protectLoops(code, maxDurationMs = 1500) {
	if (!code) return '';

	let loopIndex = 0;

	// Injeta verificador em laços com chaves: for (...), while (...), do {
	return code.replace(
		/\b(for\s*\([^)]*\)\s*\{|while\s*\([^)]*\)\s*\{|do\s*\{)/g,
		(match) => {
			const id = ++loopIndex;
			return `let _loop_cnt_${id} = 0; ${match} if (++_loop_cnt_${id} % 500 === 0 && window.__checkLoop && window.__checkLoop(${id}, ${maxDurationMs})) { throw new Error('Loop infinito detectado (tempo limite de ${maxDurationMs}ms excedido).'); }`;
		}
	);
}
