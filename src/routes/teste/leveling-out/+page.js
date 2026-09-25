import { getSketchBySlug } from '$lib/sketches/loader.js';

export const prerender = false;
export const ssr = false;

export function load() {
	const project = getSketchBySlug('leveling-out');
	return {
		project
	};
}
