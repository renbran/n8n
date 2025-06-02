import type { APIRequestContext } from '@playwright/test';

import type { UserCredentials } from '../config/test-users';
import {
	INSTANCE_OWNER_CREDENTIALS,
	INSTANCE_MEMBER_CREDENTIALS,
	INSTANCE_ADMIN_CREDENTIALS,
} from '../config/test-users';

export interface LoginResponseData {
	id: string;
	[key: string]: any;
}

export class ApiHelpers {
	private request: APIRequestContext;

	constructor(requestContext: APIRequestContext) {
		this.request = requestContext;
	}

	async resetDatabase(): Promise<void> {
		await this.request.post('/rest/e2e/reset', {
			data: {
				owner: INSTANCE_OWNER_CREDENTIALS,
				members: INSTANCE_MEMBER_CREDENTIALS,
				admin: INSTANCE_ADMIN_CREDENTIALS,
			},
		});
	}

	async setFeatureFlag(feature: string, enabled: boolean): Promise<void> {
		await this.request.patch('/rest/e2e/feature', {
			data: { feature: `feat:${feature}`, enabled },
		});
	}

	async enableFeature(feature: string): Promise<void> {
		await this.setFeatureFlag(feature, true);
	}

	async setQuota(quotaName: string, value: number | string): Promise<void> {
		await this.request.patch('/rest/e2e/quota', {
			data: { feature: `quota:${quotaName}`, value },
		});
	}

	async setMaxTeamProjectsQuota(value: number | string): Promise<void> {
		await this.setQuota('maxTeamProjects', value);
	}

	async setQueueMode(enabled: boolean): Promise<void> {
		await this.request.patch('/rest/e2e/queue-mode', { data: { enabled } });
	}

	async loginAndSetCookies(
		credentials: Pick<UserCredentials, 'email' | 'password'>,
	): Promise<LoginResponseData> {
		const response = await this.request.post('/rest/login', {
			data: {
				emailOrLdapLoginId: credentials.email,
				password: credentials.password,
			},
		});

		const loginData: LoginResponseData = (await response.json()).data;

		if (!loginData?.id) {
			throw new Error('API Login did not return expected user data (e.g., user ID).');
		}

		return loginData;
	}

	/**
	 * Get a response from the API.
	 * @param path - The path to the API endpoint.
	 * @param params - The parameters to pass to the API endpoint.
	 * @returns The response from the API.
	 */
	async get(path: string, params: URLSearchParams) {
		const response = await this.request.get(path, { params });
		const { data } = await response.json();
		return data;
	}
}
