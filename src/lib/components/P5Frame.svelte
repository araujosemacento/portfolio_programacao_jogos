<script>
	import { onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { generateRunnerHtml } from '$lib/sketches/runner-html.js';

	/** 
	 * @type {{
	 *   sketch: { slug?: string, files?: Array<{ name: string, code: string }>, enableSound?: boolean },
	 *   mode?: 'thumbnail' | 'preview' | 'interactive',
	 *   isThumbnail?: boolean,
	 *   className?: string,
	 *   debounceMs?: number
	 * }} 
	 */
	let {
		sketch,
		mode,
		isThumbnail = false,
		className = '',
		debounceMs = 300
	} = $props();

	// Normaliza o modo efetivo
	let effectiveMode = $derived(mode || (isThumbnail ? 'thumbnail' : 'interactive'));

	/** @type {HTMLIFrameElement | null} */
	let iframeEl = $state(null);
	let currentSrcdoc = $state('');
	let isLoaded = $state(false);
	/** @type {any} */
	let debounceTimer = null;

	// Atualização debounced do HTML srcdoc para estabilidade durante digitação no dev
	$effect(() => {
		if (!sketch || !sketch.files) return;

		const currentTargetMode = effectiveMode;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			currentSrcdoc = generateRunnerHtml({
				slug: sketch.slug || 'sketch',
				files: sketch.files || [],
				mode: currentTargetMode,
				enableSound: Boolean(sketch.enableSound),
				basePath: base
			});
		}, debounceMs);

		return () => {
			clearTimeout(debounceTimer);
		};
	});

	function handleLoad() {
		isLoaded = true;
		if (effectiveMode === 'interactive' && iframeEl) {
			setTimeout(() => {
				try {
					iframeEl?.focus();
					iframeEl?.contentWindow?.focus();
				// eslint-disable-next-line no-unused-vars
				} catch (e) { /* empty */ }
			}, 50);
		}
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
	class:is-compact={effectiveMode !== 'interactive'}
>
	{#if currentSrcdoc}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<iframe
			bind:this={iframeEl}
			srcdoc={currentSrcdoc}
			sandbox="allow-scripts allow-same-origin"
			allow="autoplay"
			title={sketch.slug || 'p5-sketch'}
			onload={handleLoad}
			tabindex={effectiveMode !== 'interactive' ? -1 : 0}
			class="h-full w-full border-none transition-opacity duration-300 {effectiveMode !== 'interactive' ? 'pointer-events-none' : 'pointer-events-auto'}"
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
