import { InvalidJsonInputError } from "@commercetools/platform-sdk";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { CommercetoolsError } from "./exceptions";

export const validateData = <T>(data: any, schema: z.AnyZodObject) => {
	try {
		schema.parse(data);
		return data as T;
	} catch (err: any) {
		const validationError = fromZodError(err);
		throw new CommercetoolsError<InvalidJsonInputError>({
			code: "InvalidJsonInput",
			message: "Request body does not contain valid JSON.",
			detailedErrorMessage: validationError.toString(),
		});
	}
};
