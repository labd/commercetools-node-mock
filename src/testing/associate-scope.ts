import type { Permission } from "@commercetools/platform-sdk";
import type { CommercetoolsMock } from "#src/ctMock.ts";
import { associateRoleDraftFactory } from "./associate-role.ts";
import { businessUnitDraftFactory } from "./business-unit.ts";
import { customerDraftFactory } from "./customer.ts";

let sequence = 0;

export type AssociateScope = {
	associateId: string;
	businessUnitKey: string;
	associateRoleKey: string;

	/** `/{projectKey}/as-associate/{associateId}/in-business-unit/key={key}` */
	basePath: string;
};

/**
 * Seeds a customer, an associate role carrying `permissions`, and a business
 * unit that has the customer as an associate with that role.
 *
 * The associate-scoped endpoints fail closed, so a test that exercises them
 * needs all three to exist. This builds the smallest set that works, and hands
 * back the path prefix to call.
 */
export const createAssociateScope = async (
	m: CommercetoolsMock,
	{
		permissions = [],
		projectKey = "dummy",
		key,
	}: { permissions?: Permission[]; projectKey?: string; key?: string } = {},
): Promise<AssociateScope> => {
	// Each factory here is created fresh, so its own sequence restarts on every
	// call; the keys have to be unique across calls or a second scope would
	// collide with the first
	sequence += 1;
	const customer = await customerDraftFactory(m).create({
		email: `associate-${sequence}@example.com`,
	});
	const role = await associateRoleDraftFactory(m).create({
		key: key ? `${key}-role` : `associate-role-${sequence}`,
		permissions,
	});
	const businessUnit = await businessUnitDraftFactory(m).create({
		key: key ?? `business-unit-${sequence}`,
		associates: [
			{
				customer: { typeId: "customer", id: customer.id },
				associateRoleAssignments: [
					{
						associateRole: { typeId: "associate-role", key: role.key },
						inheritance: "Enabled",
					},
				],
			},
		],
	});

	return {
		associateId: customer.id,
		businessUnitKey: businessUnit.key,
		associateRoleKey: role.key,
		basePath: `/${projectKey}/as-associate/${customer.id}/in-business-unit/key=${businessUnit.key}`,
	};
};
