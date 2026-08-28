import { protectLoops } from './loop-guard.js';

/**
 * Gera o documento HTML autocontido para ser executado no iframe (srcdoc).
 * 
 * @param {object} params
 * @param {string} params.slug Identificador da pasta do sketch
 * @param {Array<{ name: string, code: string }>} params.files Lista de arquivos do sketch ordenados
 * @param {boolean} [params.isThumbnail=false] Se a renderização é para thumbnail de card
 * @param {boolean} [params.useLoopGuard=true] Se deve aplicar sentinela contra loops infinitos
 * @param {boolean} [params.enableSound=false] Se deve incluir p5.sound.min.js
 * @returns {string} Código HTML completo para o iframe srcdoc
 */
export function generateRunnerHtml({
	slug,
	files = [],
	isThumbnail = false,
	useLoopGuard = true,
	enableSound = false
}) {
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
			isThumbnail
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
			max-width: 100%;
			max-height: 100%;
			height: auto !important;
			display: block;
			border-radius: 12px;
			box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
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
	<!-- Carregamento do p5.js -->
	<script src="/p5.min.js"></script>
	${enableSound ? '<script src="/p5.sound.min.js"></script>' : ''}
</head>
<body>
	<div id="error-overlay">
		<div class="badge">Erro de Execução no Sketch</div>
		<div id="error-msg"></div>
	</div>

	<script>
		// Sentinela de timeout para prevenção de loops infinitos por frame
		window.__loopTimers = {};
		window.__checkLoop = function(id, maxMs) {
			var now = performance.now();
			if (!window.__loopTimers[id]) {
				window.__loopTimers[id] = now;
				return false;
			}
			return (now - window.__loopTimers[id] > maxMs);
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
			isThumbnail
				? `
		// Modo Thumbnail: renderiza 1 frame e pausa o loop com noLoop() para economizar GPU/CPU
		window.addEventListener('load', function() {
			setTimeout(function() {
				if (typeof noLoop === 'function') {
					noLoop();
				}
			}, 40);
		});
		`
				: ''
		}

		// Hook de ciclo de vida para resetar os sentinelas a cada frame de draw()
		window.addEventListener('load', function() {
			if (typeof window.draw === 'function') {
				var originalDraw = window.draw;
				window.draw = function() {
					window.__loopTimers = {};
					try {
						originalDraw.apply(this, arguments);
					} catch(err) {
						displayRuntimeError(err.message || String(err));
					}
				};
			}
		});
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
