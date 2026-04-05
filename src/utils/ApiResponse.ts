// Standardized API Response wrapper
class ApiResponse<T> {
  public success: boolean;

  constructor(
    public statusCode: number,
    public message: string = "Success",
    public data: T | null = null,
  ) {
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
