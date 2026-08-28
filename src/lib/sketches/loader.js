/**
 * Módulo de Descoberta e Carregamento Automático de Sketches.
 * Lê dinamicamente todas as subpastas em /src/sketches/ e organiza os arquivos e metadados.
 */

// Importa o conteúdo bruto de todos os arquivos de texto dentro de src/sketches/*/*
const rawFiles = import.meta.glob('/src/sketches/*/*', { query: '?raw', eager: true, import: 'default' });

// Importa URLs de imagens/thumbnails que existirem dentro das pastas
const imageFiles = import.meta.glob('/src/sketches/*/*.{png,jpg,jpeg,webp,svg}', {
	eager: true,
	import: 'default'
});

/**
 * Converte o nome da pasta em um título legível caso não haja meta.json.
 * Exemplo: "01-campo-de-estrelas" -> "Campo de Estrelas"
 * @param {string} folder
 * @returns {string}
 */
function formatTitleFromFolder(folder) {
	const cleaned = folder.replace(/^\d+[-_]/, '');
	return cleaned
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Ordena os arquivos JS para garantir que classes e utilitários carreguem antes do ponto de entrada (sketch.js/main.js).
 * @param {Array<{ name: string, code: string }>} files
 * @param {string[]} [customOrder]
 * @returns {Array<{ name: string, code: string }>}
 */
function sortSketchFiles(files, customOrder) {
	if (customOrder && Array.isArray(customOrder)) {
		return [...files].sort((a, b) => {
			const idxA = customOrder.indexOf(a.name);
			const idxB = customOrder.indexOf(b.name);
			if (idxA !== -1 && idxB !== -1) return idxA - idxB;
			if (idxA !== -1) return -1;
			if (idxB !== -1) return 1;
			return a.name.localeCompare(b.name);
		});
	}

	const entryNames = ['main.js', 'sketch.js', 'index.js'];

	return [...files].sort((a, b) => {
		const isAEntry = entryNames.includes(a.name.toLowerCase());
		const isBEntry = entryNames.includes(b.name.toLowerCase());

		if (!isAEntry && isBEntry) return -1;
		if (isAEntry && !isBEntry) return 1;
		return a.name.localeCompare(b.name);
	});
}

/**
 * Coleta e estrutura todos os sketches da pasta src/sketches/.
 * @returns {Array<any>}
 */
export function getAllSketches() {
	/** @type {Record<string, { folder: string, rawFiles: Record<string, string>, thumbnail?: string }>} */
	const folderMap = {};

	// Agrupa arquivos brutos por subpasta
	for (const [path, content] of Object.entries(rawFiles)) {
		const match = path.match(/\/src\/sketches\/([^/]+)\/(.+)$/);
		if (match) {
			const [, folder, filename] = match;
			if (!folderMap[folder]) {
				folderMap[folder] = { folder, rawFiles: {} };
			}
			folderMap[folder].rawFiles[filename] = String(content);
		}
	}

	// Associa thumbnails encontradas
	for (const [path, imgUrl] of Object.entries(imageFiles)) {
		const match = path.match(/\/src\/sketches\/([^/]+)\/(.+)$/);
		if (match) {
			const [, folder] = match;
			if (folderMap[folder]) {
				folderMap[folder].thumbnail = String(imgUrl);
			}
		}
	}

	const sketches = Object.values(folderMap).map(({ folder, rawFiles: filesMap, thumbnail }) => {
		const slug = folder.toLowerCase();

		// Tenta carregar meta.json se existir
		let meta = {};
		if (filesMap['meta.json']) {
			try {
				meta = JSON.parse(filesMap['meta.json']);
			} catch (e) {
				console.warn(`[sketches] Erro ao fazer parse de meta.json em ${folder}:`, e);
			}
		}

		// Lista de arquivos .js
		const jsFiles = Object.entries(filesMap)
			.filter(([name]) => name.endsWith('.js'))
			.map(([name, code]) => ({ name, code }));

		// Ordenação inteligente de scripts
		// @ts-ignore
		const orderedJsFiles = sortSketchFiles(jsFiles, meta.filesOrder);

		// Lista de todos os arquivos visíveis para o visualizador de código (incluindo JSON/CSS se houver)
		const codeTabs = Object.entries(filesMap)
			.filter(([name]) => !name.endsWith('.png') && !name.endsWith('.jpg'))
			.map(([name, code]) => ({ name, code }))
			.sort((a, b) => {
				// Coloca o arquivo principal ou primeiro JS no início das abas
				if (a.name === 'sketch.js' || a.name === 'main.js') return -1;
				if (b.name === 'sketch.js' || b.name === 'main.js') return 1;
				return a.name.localeCompare(b.name);
			});

		// Código consolidado principal (para cópia rápida)
		const mainCode =
			codeTabs.find((t) => t.name === 'sketch.js' || t.name === 'main.js')?.code ||
			codeTabs[0]?.code ||
			'';

		return {
			id: slug,
			slug,
			folder,
			// @ts-ignore
			title: meta.title || formatTitleFromFolder(folder),
			// @ts-ignore
			description: meta.description || 'Sketch p5.js.',
			// @ts-ignore
			accentColor: meta.accentColor || '#ed225d',
			// @ts-ignore
			textColor: meta.textColor || '#f4f4f5',
			// @ts-ignore
			enableSound: Boolean(meta.enableSound),
			// @ts-ignore
			thumbnailUrl: thumbnail || meta.thumbnail || null,
			files: orderedJsFiles,
			codeTabs,
			code: mainCode
		};
	});

	// Ordena por pasta (ex: 01-, 02- mantêm a ordem numérica)
	return sketches.sort((a, b) => a.folder.localeCompare(b.folder, undefined, { numeric: true }));
}

/**
 * Busca um sketch específico pelo slug.
 * @param {string} slug
 * @returns {any | null}
 */
export function getSketchBySlug(slug) {
	const all = getAllSketches();
	return all.find((s) => s.slug === slug || s.folder === slug) || null;
}
