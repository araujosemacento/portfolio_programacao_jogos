<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	/** @type {{ sketch?: any, className?: string, isThumbnail?: boolean }} */
	let { sketch = () => {}, className = '', isThumbnail = false } = $props();

	/** @type {any} */
	let P5Component = $state(null);

	onMount(async () => {
		if (browser) {
			try {
				const module = await import('p5-svelte');
				P5Component = module.default;
			} catch (e) {
				console.error('Erro ao carregar p5-svelte:', e);
			}
		}
	});
</script>

<div
	class="p5-canvas-wrapper relative flex items-center justify-center {className}"
	class:is-thumbnail={isThumbnail}
>
	{#if browser && P5Component && sketch}
		<P5Component {sketch} />
	{:else}
		<div class="flex items-center justify-center p-8 text-zinc-400 font-body text-sm animate-pulse">
			Carregando sketch...
		</div>
	{/if}
</div>

<style>
	:global(.p5-canvas-wrapper:not(.is-thumbnail) canvas) {
		max-width: 100%;
		height: auto !important;
		border-radius: 1rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.p5-canvas-wrapper.is-thumbnail) {
		width: 100%;
		height: 100%;
	}

	:global(.p5-canvas-wrapper.is-thumbnail canvas) {
		width: 100% !important;
		height: 100% !important;
		object-fit: cover;
		display: block;
		border: none;
		border-radius: 0;
	}
</style>

