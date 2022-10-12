import { CommercetoolsMock } from './index'

test('getRepository', async () => {
  const ctMock = new CommercetoolsMock()
  const repo = ctMock.project('my-project-key').getRepository('order')
  repo.get({ projectKey: 'unittest' }, '1234')
})
