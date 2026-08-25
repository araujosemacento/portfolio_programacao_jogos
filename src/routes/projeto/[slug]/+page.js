import { error } from '@sveltejs/kit';
import { projects } from '$lib/data/projects.js';

export function load({ params }) {
	const project = projects.find((p) => p.slug === params.slug);

	if (!project) {
		error(404, 'Projeto não encontrado');
	}

	return {
		project
	};
}

export function entries() {
	return projects.map((p) => ({ slug: p.slug }));
}

