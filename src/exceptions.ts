export abstract class BaseError {
	abstract message: string
	abstract errors?: BaseError[]
}

export class CommercetoolsError<T extends BaseError> extends Error {
	info: T
	statusCode: number

	errors: BaseError[]

	constructor(info: T, statusCode = 400) {
		super(info.message)
		this.info = info
		this.statusCode = statusCode || 500
		this.errors = info.errors ?? []
	}
}

export interface InvalidRequestError {
	readonly code: 'invalid_request'
	readonly message: string
}
