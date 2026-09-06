export class GovernanceError extends Error {
  statusCode: number;
  code: string;
  error: string;

  constructor(statusCode: number, code: string, error: string) {
    super(`${statusCode} ${code}: ${error}`);
    this.name = 'GovernanceError';
    this.statusCode = statusCode;
    this.code = code;
    this.error = error;
    Object.setPrototypeOf(this, GovernanceError.prototype);
  }
}
