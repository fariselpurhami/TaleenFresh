// src/modules/paymob-webhook/domain/paymob-webhook-errors.ts

export class UnsupportedMediaTypeError extends Error {
  constructor(message = 'Unsupported Media Type') {
    super(message);
    this.name = 'UnsupportedMediaTypeError';
  }
}

export class InvalidJsonPayloadError extends Error {
  constructor(message = 'Invalid JSON payload') {
    super(message);
    this.name = 'InvalidJsonPayloadError';
  }
}

export class UnauthorizedWebhookError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedWebhookError';
  }
}

export class UnprocessableWebhookError extends Error {
  constructor(message = 'Unprocessable Entity') {
    super(message);
    this.name = 'UnprocessableWebhookError';
  }
}

export class InternalWebhookError extends Error {
  constructor(message = 'Internal Server Error') {
    super(message);
    this.name = 'InternalWebhookError';
  }
}
