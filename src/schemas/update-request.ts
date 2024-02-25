import { z } from "zod";

const UpdateActionSchema = z
	.object({
		action: z.string(),
	})
	.passthrough();

export const updateRequestSchema = z.object({
	version: z.number(),
	actions: z.array(UpdateActionSchema),
});
