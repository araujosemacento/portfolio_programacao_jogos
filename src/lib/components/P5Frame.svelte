<script>
	import { onDestroy } from 'svelte';
	import { generateRunnerHtml } from '$lib/sketches/runner-html.js';

	/** 
	 * @type {{
	 *   sketch: { slug?: string, files?: Array<{ name: string, code: string }>, enableSound?: boolean },
	 *   isThumbnail?: boolean,
	 *   className?: string,
	 *   debounceMs?: number
	 * }} 
	 */
	let {
		sketch,
		isThumbnail = false,
		className = '',
		debounceMs = 300
	} = $props();

	/** @type {HTMLIFrameElement | null} */
	let iframeEl = $state(null);
	let currentSrcdoc = $state('');
	let isLoaded = $state(false);
	/** @type {any} */
	let debounceTimer = null;

	// Atualização debounced do HTML srcdoc para estabilidade durante digitação no dev
	$effect(() => {
		if (!sketch || !sketch.files) return;

		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			currentSrcdoc = generateRunnerHtml({
				slug: sketch.slug || 'sketch',
				files: sketch.files || [],
				isThumbnail,
				enableSound: Boolean(sketch.enableSound)
			});
		}, debounceMs);

		return () => {
			clearTimeout(debounceTimer);
		};
	});

	function handleLoad() {
		isLoaded = true;
	}

	onDestroy(() => {
		clearTimeout(debounceTimer);
		if (iframeEl) {
			// Descarrega o iframe para liberar memória, loops de animação e contextos de áudio
			iframeEl.src = 'about:blank';
		}
	});
</script>

<div
	class="p5-frame-container relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0d0d10] {className}"
	class:is-thumbnail={isThumbnail}
>
	{#if currentSrcdoc}
		<iframe
			bind:this={iframeEl}
			srcdoc={currentSrcdoc}
			sandbox="allow-scripts"
			title={sketch.slug || 'p5-sketch'}
			onload={handleLoad}
			class="h-full w-full border-none transition-opacity duration-300"
			class:opacity-0={!isLoaded}
			class:opacity-100={isLoaded}
		></iframe>
	{/if}

	{#if !isLoaded}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0d0d10] text-xs font-code text-zinc-500 animate-pulse">
			Iniciando sketch...
		</div>
	{/if}
</div>

<style>
	.p5-frame-container {
		border-radius: inherit;
	}

	iframe {
		display: block;
	}
</style>
