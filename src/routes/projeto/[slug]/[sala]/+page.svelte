<script>
	import P5Frame from '$lib/components/P5Frame.svelte';
	import CodeModal from '$lib/components/CodeModal.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let project = $derived(data.project);
	let roomCode = $derived(data.roomCode);

	let isModalOpen = $state(false);
	let reloadKey = $state(0);
	let copied = $state(false);

	function restartSketch() {
		reloadKey += 1;
	}

	async function copyRoomLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch (e) {
			console.error('Falha ao copiar:', e);
		}
	}
</script>

<svelte:head>
	<title>{project.title} - Sala: {roomCode} | Programação para Jogos I</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
	<!-- Barra de Informações da Sala Conectada -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 backdrop-blur-sm">
		<div class="flex items-center gap-2">
			<span class="relative flex h-2.5 w-2.5">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
				<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
			</span>
			<span class="font-heading text-sm font-semibold text-zinc-200">
				Sala Ativa: <strong class="font-code text-rose-400">{roomCode}</strong>
			</span>
		</div>

		<div class="flex items-center gap-2">
			<!-- Botão de Copiar Link -->
			<button
				onclick={copyRoomLink}
				class="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-700"
				title="Copiar link para enviar a outro jogador em outra rede"
			>
				{#if copied}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span class="text-emerald-400">Link Copiado!</span>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
					<span>Copiar Link da Sala</span>
				{/if}
			</button>

			<!-- Botão de Sair / Trocar de Sala -->
			<a
				href={resolve(`/projeto/${project.slug}`)}
				class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
			>
				Trocar de Sala
			</a>
		</div>
	</div>

	<!-- Container Principal da Sketch p5.js -->
	<div
		class="relative flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#141417] p-4 sm:p-6 shadow-2xl backdrop-blur-sm"
	>
		<!-- Canvas Frame com Isolamento Seguro e Injeção da Sala -->
		{#key reloadKey}
			<div class="relative flex h-135 w-full items-center justify-center overflow-hidden rounded-xl bg-[#0a0a0c]">
				<P5Frame sketch={project} {roomCode} className="h-full w-full" />
			</div>
		{/key}

		<!-- Barra de Ações e Informações abaixo do Canvas -->
		<div class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-4">
			<div>
				<div class="flex items-center gap-2">
					<h2 class="font-heading text-xl font-bold text-zinc-100">{project.title}</h2>
					<span class="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-code text-[11px] text-zinc-400">
						{project.files.length} {project.files.length === 1 ? 'arquivo' : 'arquivos'}
					</span>
				</div>
				<p class="mt-1 font-body text-sm text-zinc-400">{project.description}</p>
			</div>

			<div class="flex items-center gap-2">
				<!-- Botão de Reiniciar Sketch -->
				<button
					onclick={restartSketch}
					class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
					title="Reiniciar sketch com estado inicial limpo"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<span>Reiniciar</span>
				</button>

				<!-- Botão de Ver Código em Abas -->
				<button
					onclick={() => (isModalOpen = true)}
					class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-sm transition hover:border-[#ed225d]/60 hover:bg-[#ed225d]/10 hover:text-[#ed225d] hover:shadow-[0_0_15px_rgba(237,34,93,0.25)]"
				>
					<span class="font-code text-xs font-semibold">&lt;/&gt;</span>
					<span>Ver Código ({project.codeTabs.length})</span>
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Modal de Código com Múltiplas Abas -->
<CodeModal bind:isOpen={isModalOpen} {project} />
