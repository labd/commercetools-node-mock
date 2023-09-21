import { test } from 'bun:test'
import { CommercetoolsMock } from './index.js'

test('getRepository', async () => {
	const ctMock = new CommercetoolsMock()
	const repo = ctMock.project('my-project-key').getRepository('order')
	repo.get({ projectKey: 'unittest' }, '1234')
})
