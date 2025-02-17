import type { Customer, CustomerDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import supertest from "supertest";
import type { CommercetoolsMock } from "~src/ctMock";

export const customerDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<CustomerDraft, CustomerDraft, Customer>(({ onCreate }) => {
		onCreate(async (draft) => {
			const response = await supertest(m.app)
				.post(`/dummy/customers`)
				.send(draft);

			return response.body.customer;
		});

		return {
			email: "customer@example.com",
			firstName: "John",
			lastName: "Doe",
			locale: "nl-NL",
			password: "my-secret-pw",
			addresses: [
				{
					firstName: "John",
					lastName: "Doe",
					streetName: "Street name",
					streetNumber: "42",
					postalCode: "1234 AB",
					city: "Utrecht",
					country: "NL",
					company: "Lab Digital",
					phone: "+31612345678",
					email: "customer@example.com",
				},
			],
			isEmailVerified: false,
			stores: [],
			authenticationMode: "Password",
		};
	});
