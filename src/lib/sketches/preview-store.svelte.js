/**
 * Store Singleton para gerenciar qual sketch está ativa em modo de preview animada.
 * Garante que em toda a aplicação apenas 1 sketch execute loop contínuo de preview simultaneamente.
 */

let activeSlug = $state(/** @type {string | null} */ (null));

export const previewStore = {
	get activeSlug() {
		return activeSlug;
	},
	/**
	 * Define a sketch ativa para preview.
	 * @param {string} slug
	 */
	setActive(slug) {
		activeSlug = slug;
	},
	/**
	 * Limpa a sketch ativa caso coincida com o slug informado.
	 * @param {string} slug
	 */
	clear(slug) {
		if (activeSlug === slug) {
			activeSlug = null;
		}
	},
	/**
	 * Força a limpeza total do preview.
	 */
	reset() {
		activeSlug = null;
	}
};
