import { type Page, type Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class ProjectSettingsPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async fillProjectName(name: string) {
		await this.page.getByTestId('project-settings-name-input').locator('input').fill(name);
	}

	async clickSaveButton() {
		await this.clickButtonByName('Save');
	}
}
