<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Programação para Jogos I</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#121214] text-[#f4f4f5]">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
</div>

