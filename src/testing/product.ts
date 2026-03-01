import type { Product, ProductDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const productDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ProductDraft, ProductDraft, Product>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/products",
					payload: draft,
				});

				return response.json();
			});

			return {
				productType: {
					typeId: "product-type",
					key: `product-type-${sequence}`,
				},
				name: { en: `Product ${sequence}` },
				slug: { en: `product-${sequence}` },
				masterVariant: {
					sku: `sku-${sequence}`,
					prices: [
						{
							value: {
								currencyCode: "EUR",
								centAmount: 1000,
							},
						},
					],
				},
			};
		},
	);
