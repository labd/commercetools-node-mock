import { CommercetoolsMock } from "../ctMock";
import { AssociateRole } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { beforeEach, afterEach, describe, expect, test } from 'vitest'

describe('Associate roles query', () => {
    const ctMock = new CommercetoolsMock()
    let associateRole: AssociateRole | undefined

    beforeEach(async () => {
        const response = await supertest(ctMock.app)
            .post('dummy/associate-roles')
            .send({
                name: 'example-role',
                buyerAssignable: false,
                key: 'example-role-associate-role',
                permissions: ['ViewMyQuotes', 'ViewMyOrders', 'ViewMyCarts'],
            })

        expect(response.status).toBe(201)

        associateRole = response.body as AssociateRole
    })

    afterEach(() => {
		ctMock.clear()
	})

    test('no filter',async () => {
        const response = await supertest(ctMock.app)
            .get('dummy/associate-roles')
            .query('{}')
            .send()

        expect(response.status).toBe(200)
        expect(response.body.count).toBe(1)

        const associateRole = response.body.results[0] as AssociateRole

        expect(associateRole.key).toBe("example-role-associate-role")
    })
})