import { error } from '@sveltejs/kit';
import { getSketchBySlug } from '$lib/sketches/loader.js';

// Desabilita pré-renderização estática e SSR para permitir salas dinâmicas criadas em runtime na SPA
export const prerender = false;
export const ssr = false;

export function load({ params }) {
	const project = getSketchBySlug(params.slug);

	if (!project) {
		error(404, 'Projeto não encontrado');
	}

	return {
		project,
		roomCode: params.sala
	};
}
