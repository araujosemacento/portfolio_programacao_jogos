import { error } from '@sveltejs/kit';
import { getAllSketches, getSketchBySlug } from '$lib/sketches/loader.js';

export function load({ params }) {
	const project = getSketchBySlug(params.slug);

	if (!project) {
		error(404, 'Projeto não encontrado');
	}

	return {
		project
	};
}

export function entries() {
	return getAllSketches().map((p) => ({ slug: p.slug }));
}
