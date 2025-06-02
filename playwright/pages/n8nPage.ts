import type { Page } from '@playwright/test';

import { CanvasPage } from './CanvasPage';
import { NodeDisplayViewPage } from './NodeDisplayViewPage';
import { ProjectSettingsPage } from './ProjectSettingsPage';
import { ProjectWorkflowsPage } from './ProjectWorkflowsPage';
import { WorkflowsPage } from './WorkflowsPage';
import { NotificationsPage } from './NotificationsPage';
import { ExecutionsPage } from './ExecutionsPage';
import { CredentialsPage } from './CredentialsPage';
import { SidebarPage } from './SidebarPage';
import { WorkflowComposer } from '../composables/WorkflowComposer';
import { CanvasComposer } from '../composables/CanvasComposer';
import { ProjectComposer } from '../composables/ProjectComposer';

export class n8nPage {
	readonly page: Page;

	// Pages
	readonly canvas: CanvasPage;
	readonly ndv: NodeDisplayViewPage;
	readonly projectWorkflows: ProjectWorkflowsPage;
	readonly projectSettings: ProjectSettingsPage;
	readonly workflows: WorkflowsPage;
	readonly notifications: NotificationsPage;
	readonly credentials: CredentialsPage;
	readonly executions: ExecutionsPage;
	readonly sideBar: SidebarPage;

	// Composables
	readonly workflowComposer: WorkflowComposer;
	readonly projectComposer: ProjectComposer;
	readonly canvasComposer: CanvasComposer;

	constructor(page: Page) {
		this.page = page;

		// Pages
		this.canvas = new CanvasPage(page);
		this.ndv = new NodeDisplayViewPage(page);
		this.projectWorkflows = new ProjectWorkflowsPage(page);
		this.projectSettings = new ProjectSettingsPage(page);
		this.workflows = new WorkflowsPage(page);
		this.notifications = new NotificationsPage(page);
		this.credentials = new CredentialsPage(page);
		this.executions = new ExecutionsPage(page);
		this.sideBar = new SidebarPage(page);

		// Composables
		this.workflowComposer = new WorkflowComposer(this);
		this.projectComposer = new ProjectComposer(this);
		this.canvasComposer = new CanvasComposer(this);
	}

	async goHome() {
		await this.page.goto('/');
	}
}
