import type {
	ProductType,
	ProductTypeDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const productTypeDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ProductTypeDraft, ProductTypeDraft, ProductType>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/product-types",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `product-type-${sequence}`,
				name: `Product Type ${sequence}`,
				description: `Product Type ${sequence} description`,
			};
		},
	);
