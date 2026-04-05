// Custom Error class for standardized API error responses
class ApiError extends Error {
  public success: boolean = false;

  constructor(
    public statusCode: number,
    message: string = "Something went wrong",
    public errors: unknown[] = [],
    stack = "",
  ) {
    super(message);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
