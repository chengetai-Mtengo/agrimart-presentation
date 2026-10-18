const authService = require('../services/authService');
const { asyncHandler } = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json(result);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.userId);
  res.json(user);
});

module.exports = { register, login, getMe };
