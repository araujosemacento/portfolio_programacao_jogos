<script>
	import { getAllSketches } from '$lib/sketches/loader.js';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import CodeModal from '$lib/components/CodeModal.svelte';

	let sketches = $derived(getAllSketches());
	let isModalOpen = $state(false);
	/** @type {any} */
	let selectedProject = $state(null);

	/** @param {any} project */
	function handleViewCode(project) {
		selectedProject = project;
		isModalOpen = true;
	}
</script>

<svelte:head>
	<title>Programação para Jogos I | Sketches & Projetos</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Grid de Cards de Jogos / Sketches -->
	{#if sketches.length > 0}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each sketches as project (project.id)}
				<ProjectCard {project} onViewCode={handleViewCode} />
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#121215] p-12 text-center">
			<p class="font-heading text-lg font-semibold text-zinc-300">Nenhum sketch encontrado</p>
			<p class="mt-2 text-sm text-zinc-500">Adicione uma subpasta em <code>src/sketches/</code> para criar novos projetos automaticamente.</p>
		</div>
	{/if}
</div>

<!-- Modal de visualização de código em abas -->
<CodeModal bind:isOpen={isModalOpen} project={selectedProject} />
