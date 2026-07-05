export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  status: number;
  details?: FieldError[];

  constructor(status: number, message: string, details?: FieldError[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: FieldError[]) =>
  new AppError(400, message, details);
export const notFound = (message = 'Not found') => new AppError(404, message);
export const conflict = (message: string, details?: FieldError[]) =>
  new AppError(409, message, details);
export const gone = (message = 'Gone') => new AppError(410, message);
export const preconditionRequired = (message: string) => new AppError(428, message);
