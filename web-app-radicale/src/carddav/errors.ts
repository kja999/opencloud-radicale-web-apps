export class CardDAVError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'CardDAVError'
  }
}

export class AuthenticationError extends CardDAVError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends CardDAVError {
  constructor(message = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends CardDAVError {
  constructor(message = 'Conflict detected', public currentEtag?: string) {
    super(message, 412)
    this.name = 'ConflictError'
  }
}

export class NetworkError extends CardDAVError {
  constructor(message = 'Network error') {
    super(message, 0)
    this.name = 'NetworkError'
  }
}