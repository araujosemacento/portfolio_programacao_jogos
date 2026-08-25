<script>
	import { projects } from '$lib/data/projects.js';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import CodeModal from '$lib/components/CodeModal.svelte';

	let isModalOpen = $state(false);
	/** @type {any} */
	let selectedProject = $state(null);

	/** @param {any} project */
	function handleViewCode(project) {
		selectedProject = project;
		isModalOpen = true;
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Grid de Cards de Jogos / Sketches -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each projects as project (project.id)}
			<ProjectCard {project} onViewCode={handleViewCode} />
		{/each}
	</div>
</div>

<!-- Modal de visualização de código -->
<CodeModal bind:isOpen={isModalOpen} project={selectedProject} />

