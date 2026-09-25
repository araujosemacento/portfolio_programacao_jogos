import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

/**
 * Retorna a URL base do PocketBase de acordo com o ambiente (DEV ou PROD).
 * Em DEV: http://localhost:8090
 * Em PROD: valor de env.PUBLIC_BACKEND_URL (URL do Funnel / túnel) ou fallback.
 * @returns {string}
 */
export function getBackendUrl() {
	if (dev) {
		return 'http://localhost:8090';
	}

	return env.PUBLIC_BACKEND_URL || 'http://localhost:8090';
}
