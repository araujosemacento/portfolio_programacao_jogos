<script>
	import Prism from 'prismjs';
	import 'prismjs/components/prism-javascript';
	import 'prismjs/components/prism-clike';
	import 'prismjs/components/prism-json';

	/**
	 * @type {{
	 *   code?: string,
	 *   language?: string,
	 *   showLineNumbers?: boolean,
	 *   className?: string
	 * }}
	 */
	let { code = '', language = 'javascript', showLineNumbers = true, className = '' } = $props();

	// Destaque de sintaxe reativo com Prism
	let highlightedCode = $derived.by(() => {
		if (!code) return '';
		const grammar =
			Prism.languages[language] || Prism.languages.javascript || Prism.languages.clike;
		return Prism.highlight(code, grammar, language);
	});

	// Contagem de linhas para o gutter
	let lines = $derived.by(() => {
		if (!code) return [1];
		return code.split('\n');
	});
</script>

<div
	class="code-block-wrapper font-code relative flex min-h-full w-full bg-[#0a0a0c] text-sm {className}"
>
	<!-- Gutter de numeração de linhas fixo à esquerda -->
	{#if showLineNumbers}
		<div
			class="line-numbers-gutter font-code flex flex-col border-r border-zinc-800/80 bg-[#0a0a0c] px-3.5 py-4 text-right text-xs text-zinc-600 select-none sticky left-0 z-10"
			aria-hidden="true"
		>
			<!-- eslint-disable-next-line svelte/require-each-key no-unused-vars -->
			{#each lines as _, idx}
				<span class="leading-6">{idx + 1}</span>
			{/each}
		</div>
	{/if}

	<!-- Bloco de código com rolagem horizontal independente -->
	<div class="code-viewport flex-1 overflow-x-auto p-4">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<pre class="font-code m-0 text-sm leading-6 text-zinc-100 selection:bg-[#ed225d]/40 selection:text-white"><code class="language-{language}">{@html highlightedCode}</code></pre>
	</div>
</div>

<style>
	/* Garantir alinhamento de entrelinha consistente entre o gutter e o código */
	.line-numbers-gutter span,
	pre,
	code {
		line-height: 1.5rem; /* 24px */
	}

	pre {
		tab-size: 2;
		-moz-tab-size: 2;
	}
</style>
