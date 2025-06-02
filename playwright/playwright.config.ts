import { defineConfig } from '@playwright/test';
import { currentsReporter } from '@currents/playwright';

export default defineConfig({
	globalSetup: require.resolve('./global-setup.ts'),
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,

	reporter: process.env.CI
		? [
				['list'],
				['github'],
				['junit', { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_NAME || 'results.xml' }],
				['html', { open: 'never' }],
				['json', { outputFile: 'test-results.json' }],
			]
		: 'html',

	use: {
		baseURL: 'http://localhost:5678',
		trace: 'on',
		video: 'on',
		screenshot: 'on',
		testIdAttribute: 'data-test-id',
		headless: true,
		viewport: { width: 1536, height: 960 },
	},

	projects: [
		{
			name: 'Full Parallel Tests',
			grepInvert: /@db:reset/,
		},
		{
			name: 'Sequential Tests',
			grep: /@db:reset/,
			workers: 1,
			dependencies: ['Full Parallel Tests'],
		},
	],
});
