<script>
	import Icon from '@iconify/svelte';
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
			<Icon icon="game-icons:test-tubes" class="h-4.5 w-4.5 text-rose-400" />
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
					<Icon icon="lucide:check" class="h-3.5 w-3.5 text-emerald-400" />
					<span class="text-emerald-400">Link Copiado!</span>
				{:else}
					<Icon icon="lucide:copy" class="h-3.5 w-3.5 text-zinc-400" />
					<span>Copiar Link da Sala</span>
				{/if}
			</button>

			<!-- Botão de Sair / Trocar de Sala -->
			<a
				href={resolve(`/projeto/${project.slug}`)}
				class="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
			>
				<Icon icon="lucide:arrow-left-right" class="h-3 w-3" />
				<span>Trocar de Sala</span>
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
					<Icon icon="lucide:rotate-ccw" class="h-3.5 w-3.5" />
					<span>Reiniciar</span>
				</button>

				<!-- Botão de Ver Código em Abas -->
				<button
					onclick={() => (isModalOpen = true)}
					class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-sm transition hover:border-[#ed225d]/60 hover:bg-[#ed225d]/10 hover:text-[#ed225d] hover:shadow-[0_0_15px_rgba(237,34,93,0.25)]"
				>
					<Icon icon="lucide:code" class="h-3.5 w-3.5" />
					<span>Ver Código ({project.codeTabs.length})</span>
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Modal de Código com Múltiplas Abas -->
<CodeModal bind:isOpen={isModalOpen} {project} />
