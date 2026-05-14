export class DAVError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'DAVError'
  }
}

export class DAVAuthenticationError extends DAVError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class DAVNotFoundError extends DAVError {
  constructor(message = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class DAVConflictError extends DAVError {
  public currentEtag?: string

  constructor(message = 'Conflict detected', etag?: string) {
    super(message, 412)
    this.name = 'ConflictError'
    this.currentEtag = etag
  }
}

export class DAVNetworkError extends DAVError {
  constructor(message = 'Network error') {
    super(message, 0)
    this.name = 'NetworkError'
  }
}
