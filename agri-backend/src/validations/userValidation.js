const Joi = require('joi');

const coordinatePair = Joi.object({
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
}).and('latitude', 'longitude');

const updateProfileSchema = coordinatePair.keys({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/),
  location: Joi.string().max(100).allow('', null),
  province: Joi.string().max(100).allow('', null),
}).min(1);

const updateLocationSchema = coordinatePair.keys({
  location: Joi.string().max(100).allow('', null),
  province: Joi.string().max(100).allow('', null),
}).min(1);

module.exports = { updateProfileSchema, updateLocationSchema };
