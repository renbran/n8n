import { request as playwrightRequestUtil } from '@playwright/test';

import { BACKEND_BASE_URL } from './config/constants';
import { ApiHelpers } from './services/api-helper';

async function globalSetup() {
	console.log('Global setup: Starting...');

	const requestContext = await playwrightRequestUtil.newContext({
		baseURL: BACKEND_BASE_URL,
	});
	const apiHelpers = new ApiHelpers(requestContext);

	try {
		console.log('Global setup: Attempting database reset...');
		await apiHelpers.resetDatabase();
		console.log('Global setup: Database reset successful.');
	} catch (error: any) {
		console.error('Global setup: Database reset FAILED.');
		console.error('Error:', error.message || error);
		throw error;
	} finally {
		await requestContext.dispose();
		console.log('Global setup: Finished.');
	}
}

export default globalSetup;
