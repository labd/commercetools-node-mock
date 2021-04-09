export abstract class BaseError {
  abstract message: string;
}

export class CommercetoolsError<T extends BaseError> extends Error {
  info: T;
  statusCode: number;

  constructor(info: T, statusCode = 400) {
    super(info.message);
    this.info = info;
    this.statusCode = statusCode || 500;
  }
}
