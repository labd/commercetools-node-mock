import type {
	BusinessUnitAddAddressAction,
	BusinessUnitAddShippingAddressIdAction,
	BusinessUnitChangeNameAction,
	BusinessUnitChangeStatusAction,
	BusinessUnitRemoveAddressAction,
	BusinessUnitSetContactEmailAction,
	BusinessUnitSetDefaultShippingAddressAction,
	CompanyDraft,
	DivisionDraft,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { BusinessUnitRepository } from "./business-unit.ts";
import { CustomerRepository } from "./customer/index.ts";

describe("BusinessUnit Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new BusinessUnitRepository(config);

	// Add required dependencies for testing
	storage.add("dummy", "store", {
		...getBaseResourceProperties(),
		id: "store-123",
		key: "test-store",
		name: { "en-US": "Test Store" },
		languages: ["en-US"],
		countries: [{ code: "US" }],
		distributionChannels: [],
		supplyChannels: [],
		productSelections: [],
	});

	// Create a proper customer using the customer repository
	const customerRepository = new CustomerRepository(config);
	const customer = customerRepository.create(
		{ projectKey: "dummy" },
		{
			email: "associate@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Associate",
		},
	);

	test("create company business unit", () => {
		const draft: CompanyDraft = {
			key: "test-company",
			unitType: "Company",
			status: "Active",
			name: "Test Company Inc.",
			contactEmail: "contact@testcompany.com",
			storeMode: "Explicit",
			associateMode: "Explicit",
			approvalRuleMode: "ExplicitApproval",
			stores: [
				{
					typeId: "store",
					key: "test-store",
				},
			],
			addresses: [
				{
					country: "US",
					city: "New York",
					streetName: "5th Avenue",
					streetNumber: "123",
					postalCode: "10001",
				},
			],
			defaultBillingAddress: 0,
			defaultShippingAddress: 0,
			billingAddresses: [0],
			shippingAddresses: [0],
			associates: [
				{
					customer: {
						typeId: "customer",
						id: customer.id,
					},
					associateRoleAssignments: [
						{
							associateRole: {
								typeId: "associate-role",
								key: "admin",
							},
							inheritance: "Enabled",
						},
					],
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.key).toBe(draft.key);
		expect(result.unitType).toBe("Company");
		expect(result.name).toBe(draft.name);
		expect(result.contactEmail).toBe(draft.contactEmail);
		expect(result.status).toBe(draft.status);
		expect(result.storeMode).toBe(draft.storeMode);
		expect(result.associateMode).toBe(draft.associateMode);
		expect(result.approvalRuleMode).toBe(draft.approvalRuleMode);
		expect(result.addresses).toHaveLength(1);
		expect(result.addresses[0].country).toBe("US");
		expect(result.stores).toHaveLength(1);
		expect(result.associates).toHaveLength(1);

		// Test that the business unit is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
		expect(items.results[0].id).toBe(result.id);
	});

	test("create division business unit", () => {
		// First create a company to be the parent
		const companyDraft: CompanyDraft = {
			key: "parent-company",
			unitType: "Company",
			status: "Active",
			name: "Parent Company",
		};

		const _company = repository.create({ projectKey: "dummy" }, companyDraft);

		const draft: DivisionDraft = {
			key: "test-division",
			unitType: "Division",
			status: "Active",
			name: "Test Division",
			contactEmail: "division@testcompany.com",
			parentUnit: {
				typeId: "business-unit",
				key: "parent-company",
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.unitType).toBe("Division");
		expect(result.name).toBe(draft.name);
		expect(result.contactEmail).toBe(draft.contactEmail);

		// Check division-specific properties
		if (result.unitType === "Division") {
			expect(result.parentUnit?.key).toBe("parent-company");
		}
	});

	test("create business unit with minimal data", () => {
		const draft: CompanyDraft = {
			key: "minimal-company",
			unitType: "Company",
			name: "Minimal Company",
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.name).toBe(draft.name);
		expect(result.unitType).toBe("Company");
		expect(result.addresses).toEqual([]);
		expect(result.associates).toEqual([]);
		expect(result.stores).toBeUndefined();
	});

	test("update business unit - changeName", () => {
		const draft: CompanyDraft = {
			key: "update-test-company",
			unitType: "Company",
			name: "Original Company Name",
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			businessUnit,
			businessUnit.version,
			[
				{
					action: "changeName",
					name: "Updated Company Name",
				} as BusinessUnitChangeNameAction,
			],
		);

		expect(result.name).toBe("Updated Company Name");
		expect(result.version).toBe(businessUnit.version + 1);
	});

	test("update business unit - setContactEmail", () => {
		const draft: CompanyDraft = {
			key: "email-test-company",
			unitType: "Company",
			name: "Email Test Company",
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			businessUnit,
			businessUnit.version,
			[
				{
					action: "setContactEmail",
					contactEmail: "newemail@company.com",
				} as BusinessUnitSetContactEmailAction,
			],
		);

		expect(result.contactEmail).toBe("newemail@company.com");
		expect(result.version).toBe(businessUnit.version + 1);
	});

	test("update business unit - changeStatus", () => {
		const draft: CompanyDraft = {
			key: "status-test-company",
			unitType: "Company",
			name: "Status Test Company",
			status: "Active",
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			businessUnit,
			businessUnit.version,
			[
				{
					action: "changeStatus",
					status: "Inactive",
				} as BusinessUnitChangeStatusAction,
			],
		);

		expect(result.status).toBe("Inactive");
		expect(result.version).toBe(businessUnit.version + 1);
	});

	test("update business unit - addAddress sets id when only key provided", () => {
		const draft: CompanyDraft = {
			key: "add-address-key-company",
			unitType: "Company",
			name: "Add Address Key Company",
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			businessUnit,
			businessUnit.version,
			[
				{
					action: "addAddress",
					address: {
						key: "address-key",
						country: "US",
					},
				} as BusinessUnitAddAddressAction,
			],
		);

		expect(result.addresses).toHaveLength(1);
		expect(result.addresses[0].key).toBe("address-key");
		expect(result.addresses[0].id).toBeDefined();
		expect(result.version).toBe(businessUnit.version + 1);
	});

	test("update business unit - setDefaultShippingAddress", () => {
		const draft: CompanyDraft = {
			key: "default-shipping-company",
			unitType: "Company",
			name: "Default Shipping Company",
			addresses: [
				{
					country: "US",
					city: "New York",
					streetName: "5th Avenue",
					streetNumber: "123",
					postalCode: "10001",
				},
				{
					country: "US",
					city: "Boston",
					streetName: "Boylston",
					streetNumber: "456",
					postalCode: "02116",
				},
			],
			shippingAddresses: [0, 1],
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);
		const addressId = businessUnit.addresses[1].id;

		const result = repository.processUpdateActions(
			ctx,
			businessUnit,
			businessUnit.version,
			[
				{
					action: "setDefaultShippingAddress",
					addressId,
				} as BusinessUnitSetDefaultShippingAddressAction,
			],
		);

		expect(result.defaultShippingAddressId).toBe(addressId);
		expect(result.version).toBe(businessUnit.version + 1);
	});

	test("update business unit - addShippingAddressId", () => {
		const draft: CompanyDraft = {
			key: "add-shipping-address-company",
			unitType: "Company",
			name: "Add Shipping Address Company",
			addresses: [
				{
					country: "US",
					city: "New York",
					streetName: "5th Avenue",
					streetNumber: "123",
					postalCode: "10001",
				},
				{
					country: "US",
					city: "Boston",
					streetName: "Boylston",
					streetNumber: "456",
					postalCode: "02116",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);
		const addressId = businessUnit.addresses[1].id;

		const result = repository.processUpdateActions(
			ctx,
			businessUnit,
			businessUnit.version,
			[
				{
					action: "addShippingAddressId",
					addressId,
				} as BusinessUnitAddShippingAddressIdAction,
			],
		);

		expect(result.shippingAddressIds).toContain(addressId);
		expect(result.version).toBe(businessUnit.version + 1);
	});

	test("update business unit - removeAddress", () => {
		const draft: CompanyDraft = {
			key: "remove-address-company",
			unitType: "Company",
			name: "Remove Address Company",
			addresses: [
				{
					country: "US",
					city: "New York",
					streetName: "5th Avenue",
					streetNumber: "123",
					postalCode: "10001",
				},
				{
					country: "US",
					city: "Boston",
					streetName: "Boylston",
					streetNumber: "456",
					postalCode: "02116",
				},
			],
			billingAddresses: [0, 1],
			shippingAddresses: [0, 1],
			defaultBillingAddress: 0,
			defaultShippingAddress: 1,
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);
		const addressIdToRemove = businessUnit.addresses[0].id;
		const remainingAddressId = businessUnit.addresses[1].id;

		const result = repository.processUpdateActions(
			ctx,
			businessUnit,
			businessUnit.version,
			[
				{
					action: "removeAddress",
					addressId: addressIdToRemove,
				} as BusinessUnitRemoveAddressAction,
			],
		);

		expect(result.addresses).toHaveLength(1);
		expect(result.addresses[0].id).toBe(remainingAddressId);
		expect(result.billingAddressIds).toEqual([remainingAddressId]);
		expect(result.shippingAddressIds).toEqual([remainingAddressId]);
		expect(result.defaultBillingAddressId).toBeUndefined();
		expect(result.defaultShippingAddressId).toBe(remainingAddressId);
		expect(result.version).toBe(businessUnit.version + 1);
	});

	test("get and delete business unit", () => {
		const draft: CompanyDraft = {
			key: "delete-test",
			unitType: "Company",
			name: "Delete Test Company",
		};

		const ctx = { projectKey: "dummy" };
		const businessUnit = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, businessUnit.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(businessUnit.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, businessUnit.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(businessUnit.key);

		// Test delete
		const deleted = repository.delete(ctx, businessUnit.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(businessUnit.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, businessUnit.id);
		expect(notFound).toBeNull();
	});
});
