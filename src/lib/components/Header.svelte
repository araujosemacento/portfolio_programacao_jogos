<script>
	import Icon from '@iconify/svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getSketchBySlug } from '$lib/sketches/loader.js';

	// Determina se estamos na página inicial ou em um projeto específico
	let isProjectPage = $derived(!!page.params.slug);
	let currentProject = $derived(
		isProjectPage
			// @ts-ignore
			? getSketchBySlug(page.params.slug)
			: null
	);
	let projectTitle = $derived(currentProject?.title || 'Projeto');
</script>

<header
	class="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#121214]/85 backdrop-blur-md transition-colors"
>
	<div class="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
		{#if isProjectPage}
			<!-- Header em página de projeto: seta para voltar e breadcrumb do projeto -->
			<div class="flex items-center gap-3">
				<a
					href={resolve('/')}
					class="group flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 transition hover:border-[#ed225d]/50 hover:bg-[#ed225d]/10 hover:text-[#ed225d] hover:shadow-[0_0_12px_rgba(237,34,93,0.25)]"
					aria-label="Voltar para a página inicial"
					title="Voltar para a página inicial"
				>
					<Icon icon="lucide:arrow-left" class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
				</a>
				<div class="flex items-center gap-2">
					<a
						href={resolve('/')}
						class="hidden text-xs font-semibold text-zinc-400 transition hover:text-zinc-200 sm:inline"
					>
						Portfólio
					</a>
					<span class="hidden text-zinc-600 sm:inline">/</span>
					<h1 class="font-heading text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">
						{projectTitle}
					</h1>
				</div>
			</div>
		{:else}
			<!-- Header na página inicial: ícone e título com fonte Heading -->
			<div class="flex items-center gap-2.5">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ed225d]/30 bg-[#ed225d]/10 text-[#ed225d]">
					<Icon icon="lucide:gamepad-2" class="h-4.5 w-4.5" />
				</div>
				<h1 class="font-heading text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">
					Programação para Jogos I
				</h1>
			</div>
		{/if}
	</div>
</header>
