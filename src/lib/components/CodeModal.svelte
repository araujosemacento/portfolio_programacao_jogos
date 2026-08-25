<script>
	/** @type {{ isOpen?: boolean, project?: any }} */
	let { isOpen = $bindable(false), project = null } = $props();
	let copied = $state(false);

	function copyCode() {
		if (project?.code) {
			navigator.clipboard.writeText(project.code);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && project}
	<!-- Backdrop com blur e acessibilidade -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm transition-opacity"
		onclick={(e) => {
			if (e.target === e.currentTarget) isOpen = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') isOpen = false;
		}}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Modal Card -->
		<div
			class="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-700/70 bg-[#18181b] shadow-2xl"
		>
			<!-- Header do Modal -->
			<div
				class="flex items-center justify-between border-b border-zinc-800 bg-[#121214] px-6 py-4"
			>
				<div class="flex items-center gap-3">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ed225d]/30 bg-[#ed225d]/10 text-xs font-semibold text-[#ed225d] font-code shadow-[0_0_10px_rgba(237,34,93,0.15)]"
					>
						&lt;/&gt;
					</span>
					<h2 id="modal-title" class="font-heading text-lg font-bold text-zinc-100">
						{project.title} &mdash; <span class="text-sm font-normal text-zinc-400">sketch.js</span>
					</h2>
				</div>

				<div class="flex items-center gap-2">
					<button
						onclick={copyCode}
						class="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-[#ed225d]/60 hover:bg-[#ed225d]/10 hover:text-[#ed225d]"
					>
						{#if copied}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3.5 w-3.5 text-emerald-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2.5"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
							<span class="text-emerald-400">Copiado!</span>
						{:else}
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
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							<span>Copiar</span>
						{/if}
					</button>

					<button
						onclick={() => (isOpen = false)}
						class="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
						aria-label="Fechar"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Conteúdo do Código -->
			<div class="flex-1 overflow-auto p-6 bg-[#0e0e10]">
				<pre class="font-code text-sm leading-relaxed text-zinc-200 selection:bg-[#ed225d] selection:text-white"><code>{project.code}</code></pre>
			</div>
		</div>
	</div>
{/if}
