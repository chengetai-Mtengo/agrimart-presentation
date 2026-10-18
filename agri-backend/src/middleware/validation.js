const { ValidationError } = require('../utils/errors');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join(', ');
    return next(new ValidationError(messages));
  }

  req[property] = value;
  return next();
};

module.exports = { validate };
