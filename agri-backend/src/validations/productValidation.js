const Joi = require('joi');

const productBase = {
  name: Joi.string().min(2).max(100),
  categoryId: Joi.alternatives(Joi.string().max(50), Joi.number()).custom((value) => String(value)),
  price: Joi.number().min(0),
  unit: Joi.string().min(1).max(30),
  quantity: Joi.number().integer().min(0),
  description: Joi.string().max(2000).allow('', null),
  imageUrl: Joi.string().uri().allow('', null),
  location: Joi.string().max(100).allow('', null),
  province: Joi.string().max(100).allow('', null),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  availability: Joi.string().valid('available', 'limited', 'sold_out', 'hidden').default('available'),
};

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  categoryId: Joi.alternatives(Joi.string().max(50), Joi.number()).custom((value) => String(value)).required(),
  price: Joi.number().min(0).required(),
  unit: Joi.string().min(1).max(30).required(),
  quantity: Joi.number().integer().min(0).required(),
  description: Joi.string().max(2000).allow('', null),
  imageUrl: Joi.string().uri().allow('', null),
  location: Joi.string().max(100).allow('', null),
  province: Joi.string().max(100).allow('', null),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  availability: Joi.string().valid('available', 'limited', 'sold_out', 'hidden').default('available'),
});

const updateProductSchema = Joi.object(productBase).min(1);

const productQuerySchema = Joi.object({
  category: Joi.alternatives(Joi.string(), Joi.number()).optional(),
  search: Joi.string().allow('').optional(),
  supplier: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
};
