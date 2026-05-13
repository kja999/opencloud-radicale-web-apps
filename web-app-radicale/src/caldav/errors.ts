export class CalDAVError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'CalDAVError'
  }
}

export class AuthenticationError extends CalDAVError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends CalDAVError {
  constructor(message = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends CalDAVError {
  constructor(
    message = 'Conflict detected',
    public currentEtag?: string
  ) {
    super(message, 412)
    this.name = 'ConflictError'
  }
}

export class NetworkError extends CalDAVError {
  constructor(message = 'Network error') {
    super(message, 0)
    this.name = 'NetworkError'
  }
}
