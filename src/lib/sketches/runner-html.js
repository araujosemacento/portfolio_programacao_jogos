import { protectLoops } from './loop-guard.js';

/**
 * Gera o documento HTML autocontido para ser executado no iframe (srcdoc).
 * 
 * @param {object} params
 * @param {string} params.slug Identificador da pasta do sketch
 * @param {Array<{ name: string, code: string }>} params.files Lista de arquivos do sketch ordenados
 * @param {'thumbnail' | 'preview' | 'interactive'} [params.mode='interactive'] Modo de execução da sketch
 * @param {boolean} [params.isThumbnail] Legado: se true, define mode como 'thumbnail'
 * @param {boolean} [params.useLoopGuard=true] Se deve aplicar sentinela contra loops infinitos
 * @param {boolean} [params.enableSound=false] Se deve incluir p5.sound.min.js
 * @param {string} [params.basePath=''] Caminho base da aplicação (ex: /portfolio_programacao_jogos para GitHub Pages)
 * @returns {string} Código HTML completo para o iframe srcdoc
 */
export function generateRunnerHtml({
	slug,
	files = [],
	mode,
	isThumbnail,
	useLoopGuard = true,
	enableSound = false,
	basePath = ''
}) {
	// Normaliza o modo de execução
	/** @type {'thumbnail' | 'preview' | 'interactive'} */
	const currentMode = mode || (isThumbnail ? 'thumbnail' : 'interactive');
	const isCompact = currentMode === 'thumbnail' || currentMode === 'preview';
	const soundEnabled = currentMode === 'interactive' && Boolean(enableSound);

	// Normaliza basePath garantindo que não tenha barra final se existir
	const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
	const p5ScriptUrl = `${cleanBase}/p5.min.js`;
	const p5SoundScriptUrl = `${cleanBase}/p5.sound.min.js`;

	// Processa o código dos arquivos com loop-guard se habilitado
	const processedScripts = files
		.filter((f) => f.name.endsWith('.js'))
		.map((f) => {
			const safeCode = useLoopGuard ? protectLoops(f.code) : f.code;
			return `\n/* --- Arquivo: ${f.name} --- */\n${safeCode}`;
		})
		.join('\n\n');

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${slug}</title>
	${cleanBase ? `<base href="${cleanBase}/">` : ''}
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		html, body {
			width: 100%;
			height: 100%;
			overflow: hidden;
			background-color: #0d0d10;
			display: flex;
			align-items: center;
			justify-content: center;
			font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			position: relative;
		}
		${
			isCompact
				? `
		canvas {
			width: 100% !important;
			height: 100% !important;
			object-fit: cover;
			display: block;
			border: none;
		}
		input, button, select, textarea, label {
			display: none !important;
		}
		`
				: `
		canvas {
			display: block;
			border-radius: 12px;
		}
		`
		}
		#error-overlay {
			display: none;
			position: fixed;
			inset: 0;
			background: rgba(13, 13, 16, 0.95);
			color: #f87171;
			padding: 20px;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			text-align: center;
			z-index: 9999;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			font-size: 13px;
		}
		#error-overlay .badge {
			background: rgba(239, 68, 68, 0.15);
			border: 1px solid rgba(239, 68, 68, 0.4);
			color: #ef4444;
			padding: 4px 10px;
			border-radius: 6px;
			margin-bottom: 12px;
			font-weight: bold;
		}
		#error-msg {
			max-width: 90%;
			white-space: pre-wrap;
			word-break: break-word;
			color: #fca5a5;
			line-height: 1.5;
		}
	</style>
	<!-- Carregamento do p5.js com caminho base compatível com GitHub Pages -->
	<script src="${p5ScriptUrl}"></script>
	${soundEnabled ? `<script src="${p5SoundScriptUrl}"></script>` : ''}
</head>
<body>
	<div id="error-overlay">
		<div class="badge">Erro de Execução no Sketch</div>
		<div id="error-msg"></div>
	</div>

	<script>
		// Sentinela de controle de execução por frame
		window.__loopCounters = {};
		window.__loopTimers = {};
		window.__checkLoop = function(id, maxMs) {
			window.__loopCounters[id] = (window.__loopCounters[id] || 0) + 1;
			if (window.__loopCounters[id] % 200 === 0) {
				var now = performance.now();
				if (!window.__loopTimers[id]) {
					window.__loopTimers[id] = now;
					return false;
				}
				if (now - window.__loopTimers[id] > maxMs) {
					return true;
				}
			}
			return false;
		};

		// Error boundary interno do iframe
		function displayRuntimeError(msg, url, line) {
			try {
				if (typeof noLoop === 'function') noLoop();
			} catch(e) {}
			var overlay = document.getElementById('error-overlay');
			var msgBox = document.getElementById('error-msg');
			if (overlay && msgBox) {
				overlay.style.display = 'flex';
				msgBox.textContent = msg + (line ? ' [Linha: ' + line + ']' : '');
			}
		}

		window.onerror = function(msg, url, line) {
			displayRuntimeError(msg, url, line);
			return true;
		};

		window.addEventListener('unhandledrejection', function(event) {
			displayRuntimeError(event.reason ? (event.reason.message || event.reason) : 'Rejeição de Promise não tratada');
		});

		${
			currentMode === 'thumbnail'
				? `
		// Modo Thumbnail Estático: executa setup() e pausa no primeiro frame de draw() com noLoop()
		(function() {
			var _rawDraw = null;
			var _executed = false;
			Object.defineProperty(window, 'draw', {
				get: function() { return _rawDraw; },
				set: function(fn) {
					_rawDraw = function() {
						window.__loopCounters = {};
						window.__loopTimers = {};
						try {
							fn.apply(this, arguments);
						} catch(err) {
							displayRuntimeError(err.message || String(err));
						} finally {
							if (!_executed && typeof noLoop === 'function') {
								_executed = true;
								noLoop();
							}
						}
					};
				},
				configurable: true
			});
		})();
		`
				: `
		// Modo Contínuo (Preview ou Interativo): intercepta draw para monitoramento e reset seguro de timers
		(function() {
			var _rawDraw = null;
			Object.defineProperty(window, 'draw', {
				get: function() { return _rawDraw; },
				set: function(fn) {
					_rawDraw = function() {
						window.__loopCounters = {};
						window.__loopTimers = {};
						try {
							fn.apply(this, arguments);
						} catch(err) {
							displayRuntimeError(err.message || String(err));
						}
					};
				},
				configurable: true
			});
		})();
		`
		}

		${
			isCompact
				? `
		// Neutraliza eventos e callbacks de teclado nos modos de card (thumbnail e preview)
		window.addEventListener('keydown', function(e) { e.stopPropagation(); }, true);
		window.addEventListener('keyup', function(e) { e.stopPropagation(); }, true);
		window.addEventListener('keypress', function(e) { e.stopPropagation(); }, true);
		Object.defineProperty(window, 'keyPressed', { get: function() { return function(){}; }, set: function() {}, configurable: true });
		Object.defineProperty(window, 'keyReleased', { get: function() { return function(){}; }, set: function() {}, configurable: true });
		Object.defineProperty(window, 'keyTyped', { get: function() { return function(){}; }, set: function() {}, configurable: true });
		`
				: `
		// No modo interativo, foca o canvas e a janela para captura imediata de ações de teclado
		function _focusCanvas() {
			try {
				window.focus();
				var canvas = document.querySelector('canvas');
				if (canvas) {
					canvas.setAttribute('tabindex', '0');
					canvas.style.outline = 'none';
					canvas.focus();
				}
			} catch(e) {}
		}

		window.addEventListener('load', function() {
			_focusCanvas();
			setTimeout(_focusCanvas, 100);
		});

		window.addEventListener('mousedown', function() {
			_focusCanvas();
		});
		`
		}
	</script>

	<!-- Injeção dos Scripts do Sketch -->
	<script>
	try {
${processedScripts}
	} catch(err) {
		displayRuntimeError(err.message || String(err));
	}
	</script>
</body>
</html>`;
}
