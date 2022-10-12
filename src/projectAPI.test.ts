import { CommercetoolsMock } from './index'

describe('priceSelector', () => {
  test('getRepository', async () => {
    const ctMock = new CommercetoolsMock()
    const repo = ctMock.project().getRepository('order')
    repo.get({ projectKey: 'unittest' }, '1234')
  })
})
