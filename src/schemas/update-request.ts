import { z } from "zod";

const UpdateActionSchema = z.looseObject({
	action: z.string(),
});

export const updateRequestSchema = z.object({
	version: z.number(),
	actions: z.array(UpdateActionSchema),
});
