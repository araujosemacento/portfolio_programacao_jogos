<script>
	import P5Frame from '$lib/components/P5Frame.svelte';
	import CodeModal from '$lib/components/CodeModal.svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let project = $derived(data.project);

	let isModalOpen = $state(false);
	let reloadKey = $state(0);
	let customRoom = $state('');

	function restartSketch() {
		reloadKey += 1;
	}

	/** @param {SubmitEvent} [e] */
	function enterRoom(e) {
		if (e) e.preventDefault();
		const roomName = customRoom.trim() || `sala-${Math.floor(1000 + Math.random() * 9000)}`;
		goto(resolve(`/projeto/${project.slug}/${encodeURIComponent(roomName)}`));
	}
</script>

<svelte:head>
	<title>{project.title} | Programação para Jogos I</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
	{#if project.enableRealtime}
		<!-- Banner de Criação / Entrada em Sala Multiplayer -->
		<div
			class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 backdrop-blur-sm"
		>
			<div class="flex items-center gap-2">
				<span
					class="font-code rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300"
					>Multiplayer</span
				>
				<span class="font-body text-xs text-zinc-300 sm:text-sm"
					>Crie ou acesse uma sala compartilhada com outro jogador:</span
				>
			</div>
			<form onsubmit={enterRoom} class="flex items-center gap-2">
				<input
					type="text"
					bind:value={customRoom}
					placeholder="Ex: sala-amigos"
					class="font-code w-36 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none sm:w-44"
				/>
				<button
					type="submit"
					class="font-heading rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
				>
					Entrar na Sala
				</button>
			</form>
		</div>
	{/if}

	<!-- Container Principal da Sketch p5.js -->
	<div
		class="relative flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#141417] p-4 shadow-2xl backdrop-blur-sm sm:p-6"
	>
		<!-- Canvas Frame com Isolamento Seguro (sempre inicia limpo e zerado) -->
		{#key reloadKey}
			<div
				class="relative flex h-135 w-full items-center justify-center overflow-hidden rounded-xl bg-[#0a0a0c]"
			>
				<P5Frame sketch={project} className="h-full w-full" />
			</div>
		{/key}

		<!-- Barra de Ações e Informações abaixo do Canvas -->
		<div
			class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-4"
		>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="font-heading text-xl font-bold text-zinc-100">{project.title}</h2>
					<span
						class="font-code rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400"
					>
						{project.files.length}
						{project.files.length === 1 ? 'arquivo' : 'arquivos'}
					</span>
				</div>
				<p class="font-body mt-1 text-sm text-zinc-400">{project.description}</p>
			</div>

			<div class="flex items-center gap-2">
				<!-- Botão de Reiniciar Sketch -->
				<button
					onclick={restartSketch}
					class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
					title="Reiniciar sketch com estado inicial limpo"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
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
