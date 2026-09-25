// tests/visual_stepper.js
import { chromium } from 'playwright';

async function main() {
	console.log('[Playwright Visual Stepper] Iniciando navegador Chromium...');

	const executablePath = process.env.BROWSER_PATH || '/usr/bin/helium';
	console.log(`[Playwright Visual Stepper] Utilizando executável: ${executablePath}`);

	const browser = await chromium.launch({
		executablePath,
		headless: false,
		args: ['--start-maximized']
	});

	const context = await browser.newContext({
		viewport: null
	});

	const page = await context.newPage();

	const targetUrl = process.env.TEST_URL || 'http://localhost:5173/teste/leveling-out';
	console.log(`[Playwright Visual Stepper] Navegando para ${targetUrl}...`);

	try {
		await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
		console.log('[Playwright Visual Stepper] Bancada carregada com sucesso.');
		console.log('[Playwright Visual Stepper] Utilize a barra de ferramentas no topo para avançar passos, pausar e testar breakpoints.');

		// Mantém o navegador aberto para o desenvolvedor interagir
		await new Promise((resolve) => {
			browser.on('disconnected', resolve);
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[Playwright Visual Stepper] Erro ao carregar página de testes:', msg);
		console.log('Certifique-se de que o servidor local está ativo via "bun run dev".');
		await browser.close();
	}
}

main().catch(console.error);
