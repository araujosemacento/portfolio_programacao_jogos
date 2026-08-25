<script>
	import P5Canvas from '$lib/components/P5Canvas.svelte';
	import CodeModal from '$lib/components/CodeModal.svelte';

	let { data } = $props();
	let project = $derived(data.project);

	let isModalOpen = $state(false);

	// Criação da sketch p5 interativa baseada no projeto
	let currentSketch = $derived.by(() => {
		if (project.sketchFunction) {
			return project.sketchFunction;
		}

		// Fallback para sketches interativas padrão caso sketchFunction não seja fornecida
		return (p5) => {
			let angle = 0;
			p5.setup = () => {
				p5.createCanvas(640, 420);
				p5.angleMode(p5.DEGREES);
			};
			p5.draw = () => {
				p5.background(project.accentColor || '#fff385');
				p5.translate(p5.width / 2, p5.height / 2);
				p5.noFill();
				p5.stroke(project.textColor || '#18181b');
				p5.strokeWeight(3.5);
				for (let i = 0; i < 5; i++) {
					p5.push();
					p5.rotate(angle + i * 30);
					p5.rectMode(p5.CENTER);
					p5.rect(0, 0, 80 + i * 25, 80 + i * 25, 12);
					p5.pop();
				}
				angle += 0.8;
			};
		};
	});
</script>

<svelte:head>
	<title>{project.title} | Programação para Jogos I</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
	<!-- Container Principal da Sketch p5.js -->
	<div
		class="relative flex w-full flex-col items-center overflow-hidden rounded-2xl border border-zinc-800 bg-[#18181b]/60 p-6 shadow-2xl backdrop-blur-sm"
	>
		<P5Canvas sketch={currentSketch} className="w-full flex justify-center" />

		<!-- Barra de Ações e Informações abaixo do Canvas -->
		<div class="mt-6 flex w-full max-w-2xl items-center justify-between border-t border-zinc-800/80 pt-4">
			<div>
				<h2 class="font-heading text-lg font-bold text-zinc-100">{project.title}</h2>
				<p class="font-body text-sm text-zinc-400">{project.description}</p>
			</div>

			<button
				onclick={() => (isModalOpen = true)}
				class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 shadow-sm transition hover:border-[#ed225d]/60 hover:bg-[#ed225d]/10 hover:text-[#ed225d] hover:shadow-[0_0_15px_rgba(237,34,93,0.25)]"
			>
				<span class="font-code text-xs font-semibold">&lt;/&gt;</span>
				<span>Ver Código</span>
			</button>
		</div>
	</div>
</div>

<!-- Modal de Código -->
<CodeModal bind:isOpen={isModalOpen} {project} />
