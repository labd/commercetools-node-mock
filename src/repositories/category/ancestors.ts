import type {
	Category,
	CategoryReference,
	ResourceIdentifier,
} from "@commercetools/platform-sdk";
import type { AbstractStorage } from "#src/storage/abstract.ts";

export const getAncestors = async (
	storage: AbstractStorage,
	projectKey: string,
	parent: ResourceIdentifier | undefined,
): Promise<CategoryReference[]> => {
	if (!parent) {
		return [];
	}
	const category = await storage.getByResourceIdentifier<"category">(
		projectKey,
		parent,
	);
	return [{ typeId: "category", id: category.id }, ...category.ancestors];
};

export const updateDescendantAncestors = async (
	storage: AbstractStorage,
	projectKey: string,
	category: Category,
): Promise<void> => {
	const categories = await storage.all(projectKey, "category");
	for (const descendant of categories) {
		const index = descendant.ancestors.findIndex(
			({ id }) => id === category.id,
		);
		if (index === -1) {
			continue;
		}
		await storage.add(projectKey, "category", {
			...descendant,
			ancestors: [
				...descendant.ancestors.slice(0, index + 1),
				...category.ancestors,
			],
		});
	}
};
