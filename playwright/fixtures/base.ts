// fixtures/updated-fixture.ts
import { test as base, expect } from '@playwright/test';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

import type { UserCredentials } from '../config/test-users';
import {
	INSTANCE_OWNER_CREDENTIALS,
	INSTANCE_ADMIN_CREDENTIALS,
	INSTANCE_MEMBER_CREDENTIALS,
} from '../config/test-users';
import { n8nPage } from '../pages/n8nPage';
import type { LoginResponseData } from '../services/api-helper';
import { ApiHelpers } from '../services/api-helper';

const AUTH_TAGS = {
	ADMIN: '@auth:admin',
	OWNER: '@auth:owner',
	MEMBER: '@auth:member',
	NONE: '@auth:none',
} as const;

type AuthHelpers = {
	signinAsOwner: () => Promise<LoginResponseData>;
	signinAsAdmin: () => Promise<LoginResponseData>;
	signinAsMember: (index?: number) => Promise<LoginResponseData>;
};

// Worker-scoped fixtures (shared across tests in a worker)
type WorkerFixtures = {
	n8nContainer: StartedTestContainer;
	workerApi: ApiHelpers;
	workerDatabaseSetup: void;
};

// Test-scoped fixtures (fresh for each test)
type TestFixtures = {
	auth: AuthHelpers;
	api: ApiHelpers;
	databaseSetup: void;
	n8n: n8nPage;
	n8nUrl: string;
};

function getCredentialsForRole(role: string): UserCredentials {
	switch (role) {
		case 'admin':
			return INSTANCE_ADMIN_CREDENTIALS;
		case 'owner':
			return INSTANCE_OWNER_CREDENTIALS;
		case 'member':
			return INSTANCE_MEMBER_CREDENTIALS?.[0];
		default:
			throw new Error('Invalid role');
	}
}

function getRoleFromTags(tags: string[]): string | null {
	const lowerTags = tags.map((tag) => tag.toLowerCase());

	if (lowerTags.includes(AUTH_TAGS.ADMIN.toLowerCase())) return 'admin';
	if (lowerTags.includes(AUTH_TAGS.OWNER.toLowerCase())) return 'owner';
	if (lowerTags.includes(AUTH_TAGS.MEMBER.toLowerCase())) return 'member';
	if (lowerTags.includes(AUTH_TAGS.NONE.toLowerCase())) return null;
	return 'owner';
}

const NEEDS_DB_RESET_TAG = '@db:reset';

export const test = base.extend<TestFixtures, WorkerFixtures>({
	// ===== WORKER-SCOPED FIXTURES =====

	// 1. Start n8n container (worker-scoped)
	n8nContainer: [
		async ({}, use) => {
			console.log('Starting n8n Docker container...');

			const n8nImage = process.env.N8N_DOCKER_IMAGE || 'n8nio/n8n:latest';
			console.log(`Using n8n image: ${n8nImage}`);

			const container = await new GenericContainer(n8nImage)
				.withExposedPorts(5678)
				.withEnvironment({
					E2E_TESTS: 'true',
				})
				.withWaitStrategy(
					Wait.forAll([
						Wait.forListeningPorts(),
						Wait.forHttp('/favicon.ico', 5678).forStatusCode(200).withStartupTimeout(120000),
					]),
				)
				.start();

			const port = container.getMappedPort(5678);
			console.log(`n8n container started on port ${port}`);

			await use(container);

			console.log('Stopping n8n container...');
			await container.stop();
		},
		{ scope: 'worker', auto: true },
	],

	// 2. Create worker API helper with base URL from container
	workerApi: [
		async ({ playwright, n8nContainer }, use) => {
			const host = n8nContainer.getHost();
			const port = n8nContainer.getMappedPort(5678);
			const baseURL = `http://${host}:${port}`;

			console.log(`Creating worker API helper with base URL: ${baseURL}`);

			const requestContext = await playwright.request.newContext({ baseURL });
			const apiHelpers = new ApiHelpers(requestContext);

			await use(apiHelpers);
			await requestContext.dispose();
		},
		{ scope: 'worker' },
	],

	// 3. Reset database once per worker using worker API
	workerDatabaseSetup: [
		async ({ workerApi }, use) => {
			console.log('Setting up test database with users (worker setup)...');

			try {
				await workerApi.resetDatabase();
				console.log('Test users created successfully');
			} catch (error) {
				console.error('Failed to setup test database:', error);
				console.error('Make sure your n8n build includes e2e test endpoints');
				throw error;
			}

			await use();
		},
		{ scope: 'worker', auto: true },
	],

	// ===== TEST-SCOPED FIXTURES =====

	// Provide n8n URL to test-scoped fixtures
	n8nUrl: async ({ n8nContainer, workerDatabaseSetup }, use) => {
		// Ensure database is set up before providing URL
		const host = n8nContainer.getHost();
		const port = n8nContainer.getMappedPort(5678);
		const url = `http://${host}:${port}`;
		await use(url);
	},

	// Override context to set base URL for browser and API
	context: async ({ browser, n8nUrl }, use) => {
		const context = await browser.newContext({
			baseURL: n8nUrl,
		});
		await use(context);
		await context.close();
	},

	page: async ({ context }, use) => {
		const page = await context.newPage();
		await use(page);
		await page.close();
	},

	// 4. Test-scoped API helper (shares cookies with browser)
	api: async ({ context }, use) => {
		const apiHelpers = new ApiHelpers(context.request);
		await use(apiHelpers);
	},

	// 5. Database reset per test (if tagged)
	databaseSetup: [
		async ({ api }, use, testInfo) => {
			const tags = testInfo.tags.map((tag) => tag.toLowerCase());

			if (tags.includes(NEEDS_DB_RESET_TAG)) {
				console.log(`Test "${testInfo.title}" requires DB reset. Resetting...`);
				await api.resetDatabase();
			}
			await use();
		},
		{ auto: true, scope: 'test' },
	],

	// 6. Auth fixture - signs in based on tags
	auth: [
		async ({ api }, use, testInfo) => {
			const role = getRoleFromTags(testInfo.tags);
			if (role) {
				const credentials = getCredentialsForRole(role);
				await api.loginAndSetCookies(credentials);
			}

			const authHelpers: AuthHelpers = {
				signinAsOwner: async () => await api.loginAndSetCookies(INSTANCE_OWNER_CREDENTIALS),
				signinAsAdmin: async () => await api.loginAndSetCookies(INSTANCE_ADMIN_CREDENTIALS),
				signinAsMember: async (index = 0) => {
					if (!INSTANCE_MEMBER_CREDENTIALS || index >= INSTANCE_MEMBER_CREDENTIALS.length) {
						throw new Error('Invalid index');
					}
					return await api.loginAndSetCookies(INSTANCE_MEMBER_CREDENTIALS[index]);
				},
			};
			await use(authHelpers);
		},
		{ auto: true, scope: 'test' },
	],

	// 7. n8n page object
	n8n: async ({ page }, use) => {
		const n8nInstance = new n8nPage(page);
		await use(n8nInstance);
	},
});

export { expect };

// ============================================
// Dependency Graph:
//
// WORKER SCOPE:
// n8nContainer
//     ↓
// workerApi (depends on container for URL)
//     ↓
// workerDatabaseSetup (uses workerApi to reset DB once)
//
// TEST SCOPE:
// n8nUrl (depends on container and setup completion)
//     ↓
// context (sets baseURL from n8nUrl)
//     ↓
// page & api (both depend on context)
//     ↓
// databaseSetup & auth (both depend on api)
//     ↓
// n8n (depends on page)
//
// ============================================
