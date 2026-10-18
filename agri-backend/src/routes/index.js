const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const savedRoutes = require('./savedRoutes');
const notificationRoutes = require('./notificationRoutes');
const categoryRoutes = require('./categoryRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/saved', savedRoutes);
router.use('/notifications', notificationRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
