<script>
	import P5Canvas from '$lib/components/P5Canvas.svelte';
	import { resolve } from '$app/paths';

	/** @type {{ project: any, onViewCode?: (p: any) => void }} */
	let { project, onViewCode = () => {} } = $props();

	/** @param {MouseEvent} event */
	function handleCodeClick(event) {
		event.preventDefault();
		event.stopPropagation();
		onViewCode(project);
	}

	let activeThumbnailSketch = $derived(
		project.thumbnailSketch || project.sketchFunction
	);
</script>

<div
	class="group relative flex aspect-16/10 w-full flex-col justify-between overflow-hidden rounded-[28px] border border-zinc-800/80 bg-[#18181b] shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ed225d]/40 hover:shadow-2xl hover:shadow-[#ed225d]/10"
>
	<!-- Background com Prévia Procedural da Sketch p5.js -->
	<div class="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105">
		{#if activeThumbnailSketch}
			<P5Canvas sketch={activeThumbnailSketch} isThumbnail={true} />
		{:else}
			<div
				class="h-full w-full"
				style="background-color: {project.accentColor || '#fff385'};"
			></div>
		{/if}
	</div>

	<!-- Overlay de gradiente sutil para legibilidade dos textos -->
	<div
		class="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/85 via-black/25 to-black/10"
	></div>

	<!-- Link de navegação que cobre o card inteiro -->
	<a
		href={resolve(`/projeto/${project.slug}`)}
		class="absolute inset-0 z-20"
		aria-label="Abrir projeto {project.title}"
	></a>

	<!-- Espaçador superior -->
	<div></div>

	<!-- Rodapé do Card: Título à esquerda, Botão </> à direita -->
	<div
		class="relative z-30 flex items-center justify-between p-6 pointer-events-none"
	>
		<!-- Título com fonte Heading (Outfit / SN Pro) -->
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
			title="Visualizar código"
		>
			&lt;/&gt;
		</button>
	</div>
</div>

