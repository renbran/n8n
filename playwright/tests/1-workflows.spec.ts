import { test, expect } from '../fixtures/base';
// Example of importing a workflow from a file so it covers a lot of basics

test.describe('Workflows', () => {
	test.only('should create a new workflow using empty state card', async ({ n8n }) => {
		await n8n.goHome();
		await n8n.workflows.clickNewWorkflowCard();
		await n8n.workflows.importWorkflow('Test_workflow_1.json', 'Empty State Card Workflow');
		const tags = await n8n.workflows.workflowTags();
		expect(tags).toEqual(expect.arrayContaining(['some-tag-1', 'some-tag-2']));
	});
});
