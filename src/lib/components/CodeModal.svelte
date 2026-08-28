<script>
	import CodeHighlight from '$lib/components/CodeHighlight.svelte';

	/** @type {{ isOpen?: boolean, project?: any }} */
	let { isOpen = $bindable(false), project = null } = $props();

	let activeTabIndex = $state(0);
	let copiedTab = $state(false);
	let copiedAll = $state(false);

	// Lista de abas normalizada
	let tabs = $derived.by(() => {
		if (!project) return [];
		if (project.codeTabs && project.codeTabs.length > 0) {
			return project.codeTabs;
		}
		return [{ name: 'sketch.js', code: project.code || '' }];
	});

	// Reseta a aba selecionada quando o projeto mudar
	$effect(() => {
		if (project) {
			activeTabIndex = 0;
		}
	});

	let activeTab = $derived(tabs[activeTabIndex] || tabs[0] || { name: 'sketch.js', code: '' });

	let activeLanguage = $derived.by(() => {
		if (activeTab.name.endsWith('.json')) return 'json';
		if (activeTab.name.endsWith('.css')) return 'css';
		return 'javascript';
	});

	/**
	 * Formata o código para a área de transferência.
	 * Arquivos que não são JS executável (como meta.json) são comentados em bloco
	 * para não quebrar a execução se colados diretamente no editor do p5.js.
	 * @param {{ name: string, code: string }} tab
	 */
	function getCopyContent(tab) {
		if (!tab || !tab.code) return '';
		if (tab.name.endsWith('.json') || tab.name.startsWith('meta')) {
			return `/* ==========================================\n   [${tab.name}] - Metadados do Projeto\n   ==========================================\n${tab.code}\n*/`;
		}
		return tab.code;
	}

	function copyCurrentFile() {
		if (activeTab?.code) {
			navigator.clipboard.writeText(getCopyContent(activeTab));
			copiedTab = true;
			setTimeout(() => {
				copiedTab = false;
			}, 2000);
		}
	}

	function copyAllFiles() {
		if (tabs.length > 0) {
			const formattedAll = tabs
				// @ts-ignore
				.map((t) => {
					if (t.name.endsWith('.json') || t.name.startsWith('meta')) {
						return `// ================= [ ${t.name} (Metadados) ] =================\n/*\n${t.code}\n*/`;
					}
					return `// ================= [ ${t.name} ] =================\n\n${t.code}`;
				})
				.join('\n\n\n');
			navigator.clipboard.writeText(formattedAll);
			copiedAll = true;
			setTimeout(() => {
				copiedAll = false;
			}, 2000);
		}
	}

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}

	/**
	 * Retorna estilo de badge dependendo da extensão do arquivo
	 * @param {string} filename
	 * @param {boolean} isActive
	 */
	function getBadgeClass(filename, isActive) {
		const ext = filename.split('.').pop()?.toLowerCase();
		if (ext === 'json') {
			return isActive
				? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
				: 'bg-emerald-500/0 text-emerald-500/60 border border-emerald-500/20';
		}
		if (ext === 'css') {
			return isActive
				? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
				: 'bg-sky-500/10 text-sky-500/80 border border-sky-500/20';
		}
		return isActive
			? 'bg-[#ed225d]/20 text-[#ed225d] border border-[#ed225d]/40'
			: 'bg-zinc-800 text-zinc-400 border border-zinc-700';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && project}
	<!-- Backdrop com blur e acessibilidade -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity"
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
			class="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-700/70 bg-[#141417] shadow-2xl"
		>
			<!-- Header do Modal com Título e Ações -->
			<div
				class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-[#0d0d10] px-6 py-4"
			>
				<div class="flex items-center gap-3">
					<span
						class="font-code flex h-8 w-8 items-center justify-center rounded-xl border border-[#ed225d]/30 bg-[#ed225d]/10 text-xs font-semibold text-[#ed225d] shadow-[0_0_12px_rgba(237,34,93,0.2)]"
					>
						&lt;/&gt;
					</span>
					<div>
						<h2 id="modal-title" class="font-heading text-base font-bold text-zinc-100 sm:text-lg">
							{project.title}
						</h2>
						<p class="font-code text-xs text-zinc-400">
							src/sketches/{project.folder || project.slug}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<!-- Botão Copiar Arquivo Ativo -->
					<button
						onclick={copyCurrentFile}
						class="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-[#ed225d]/60 hover:bg-[#ed225d]/10 hover:text-[#ed225d]"
						title="Copiar código do arquivo selecionado (meta.json copiado com comentários para compatibilidade)"
					>
						{#if copiedTab}
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
							<span class="text-emerald-400">Arquivo Copiado!</span>
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
							<span>Copiar Arquivo</span>
						{/if}
					</button>

					<!-- Botão Copiar Todos os Arquivos (se houver mais de 1) -->
					{#if tabs.length > 1}
						<button
							onclick={copyAllFiles}
							class="hidden items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white sm:flex"
							title="Copiar todos os arquivos combinados"
						>
							{#if copiedAll}
								<span class="text-emerald-400">Tudo Copiado!</span>
							{:else}
								<span>Copiar Tudo ({tabs.length})</span>
							{/if}
						</button>
					{/if}

					<!-- Botão Fechar -->
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

			<!-- Barra de Abas de Arquivos (shrink-0 garante que nunca seja espremida verticalmente) -->
			<div
				class="flex shrink-0 items-center overflow-x-auto border-b border-zinc-800 bg-[#0c0c0e] px-6 pt-2.5"
			>
				<!-- eslint-disable-next-line svelte/require-each-key -->
				{#each tabs as tab, index}
					{@const isActive = activeTabIndex === index}
					<button
						onclick={() => (activeTabIndex = index)}
						class="group font-code relative -mb-px flex shrink-0 items-center gap-2.5 rounded-t-lg border px-4 py-2.5 text-xs font-medium transition {isActive
							? 'border-zinc-800 border-b-transparent bg-[#0a0a0c] text-zinc-100 shadow-sm z-10'
							: 'border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}"
					>
						<span
							class="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase transition {getBadgeClass(tab.name, isActive)}"
						>
							{tab.name.split('.').pop() || 'js'}
						</span>
						<span class="tracking-wide">{tab.name}</span>
					</button>
				{/each}
			</div>

			<!-- Conteúdo do Código com Syntax Highlighting (min-h-0 ativa a rolagem interna do código sem espremer irmãos) -->
			<div class="flex-1 min-h-0 overflow-auto bg-[#0a0a0c]">
				<CodeHighlight code={activeTab.code} language={activeLanguage} showLineNumbers={true} />
			</div>
		</div>
	</div>
{/if}
