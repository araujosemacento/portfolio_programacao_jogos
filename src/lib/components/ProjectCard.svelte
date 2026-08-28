<script>
	import { onDestroy } from 'svelte';
	import P5Frame from '$lib/components/P5Frame.svelte';
	import { previewStore } from '$lib/sketches/preview-store.svelte.js';
	import { resolve } from '$app/paths';

	/** @type {{ project: any, onViewCode?: (p: any) => void }} */
	let { project, onViewCode = () => {} } = $props();

	/** @type {HTMLDivElement | null} */
	let cardEl = $state(null);
	let isVisible = $state(false);
	let isHovered = $state(false);
	/** @type {any} */
	let hoverTimeout = null;

	// O preview só é ativado se for este o card ativo no singleton do previewStore
	let isPreviewActive = $derived(isVisible && previewStore.activeSlug === project.slug);

	// Configuração do IntersectionObserver para carregar apenas cards visíveis (Lazy Loading)
	$effect(() => {
		if (!cardEl) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					isVisible = entry.isIntersecting;
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(cardEl);

		return () => {
			observer.disconnect();
		};
	});

	function handleMouseEnter() {
		isHovered = true;
		clearTimeout(hoverTimeout);
		// Debounce de 200ms para evitar disparar previews durante rolagens rápidas do mouse
		hoverTimeout = setTimeout(() => {
			if (isHovered && isVisible) {
				previewStore.setActive(project.slug);
			}
		}, 200);
	}

	function handleMouseLeave() {
		isHovered = false;
		clearTimeout(hoverTimeout);
		// Libera imediatamente o singleton ao retirar o mouse
		previewStore.clear(project.slug);
	}

	onDestroy(() => {
		clearTimeout(hoverTimeout);
		previewStore.clear(project.slug);
	});

	/** @param {MouseEvent} event */
	function handleCodeClick(event) {
		event.preventDefault();
		event.stopPropagation();
		onViewCode(project);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={cardEl}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	class="group relative flex aspect-16/10 w-full flex-col justify-between overflow-hidden rounded-[28px] border border-zinc-800/80 bg-[#141417] shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ed225d]/40 hover:shadow-2xl hover:shadow-[#ed225d]/10"
>
	<!-- Background com Placeholder, Thumbnail Estática ou Preview Animada no Hover -->
	<div class="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105">
		{#if !isVisible}
			<!-- Estado 1: Fora da tela - Placeholder leve CSS puro -->
			<div
				class="relative h-full w-full flex items-center justify-center overflow-hidden"
				style="background: radial-gradient(circle at 50% 50%, {project.accentColor}18 0%, #0d0d10 80%);"
			>
				<div
					class="absolute inset-0 opacity-10"
					style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"
				></div>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-code text-sm font-bold text-zinc-400 backdrop-blur-xs"
					style="color: {project.accentColor};"
				>
					p5*
				</div>
			</div>
		{:else if isPreviewActive}
			<!-- Estado 2: Hover Ativo e Exclusivo - Sketch rodando em loop animado -->
			<P5Frame sketch={project} mode="preview" debounceMs={0} />
		{:else if project.thumbnailUrl}
			<!-- Estado 3A: Repouso Visível com Thumbnail Estática Customizada -->
			<img
				src={project.thumbnailUrl}
				alt="Thumbnail do projeto {project.title}"
				class="h-full w-full object-cover"
				loading="lazy"
			/>
		{:else}
			<!-- Estado 3B: Repouso Visível sem Imagem - Thumbnail Procedural gerada via noLoop() -->
			<P5Frame sketch={project} mode="thumbnail" debounceMs={0} />
		{/if}
	</div>

	<!-- Overlay de gradiente sutil para contraste dos textos -->
	<div
		class="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/90 via-black/30 to-black/10"
	></div>

	<!-- Link de navegação que cobre o card inteiro (clique prioritário garantido) -->
	<a
		href={resolve(`/projeto/${project.slug}`)}
		class="absolute inset-0 z-20"
		aria-label="Abrir projeto {project.title}"
	></a>

	<!-- Espaçador superior -->
	<div></div>

	<!-- Rodapé do Card: Título à esquerda, Botão </> à direita -->
	<div class="relative z-30 flex items-center justify-between p-6 pointer-events-none">
		<!-- Título com fonte Heading -->
		<h3
			class="font-heading text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none"
		>
			{project.title}
		</h3>

		<!-- Botão de código com fonte Fira Code e destaque rosa/vermelho p5 -->
		<button
			onclick={handleCodeClick}
			class="pointer-events-auto flex items-center justify-center rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-sm font-semibold font-code tracking-wider text-zinc-100 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-[#ed225d]/80 hover:bg-[#ed225d]/20 hover:text-[#ed225d] hover:shadow-[0_0_15px_rgba(237,34,93,0.35)] active:scale-95 shadow-md"
			aria-label="Visualizar código do projeto {project.title}"
			title="Visualizar código em abas"
		>
			&lt;/&gt;
		</button>
	</div>
</div>
