// just an Errore sublcass constructor which allows a better error creation using status code,status and isOperational for errors coming from app and not from code. is imported in controllers, were it wrapps the async functions
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
