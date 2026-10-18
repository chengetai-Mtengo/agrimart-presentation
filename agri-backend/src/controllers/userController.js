const userService = require('../services/userService');
const { uploadFile } = require('../utils/storage');
const { asyncHandler } = require('../utils/asyncHandler');
const { ValidationError } = require('../utils/errors');

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  res.json(users);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  if (req.body.role) {
    throw new ValidationError('Role cannot be changed');
  }
  const updated = await userService.updateUserProfile(req.userId, req.body);
  res.json(updated);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const result = await userService.changePassword(
    req.userId,
    currentPassword,
    newPassword,
    confirmPassword
  );
  res.json(result);
});

const updateLocation = asyncHandler(async (req, res) => {
  const { location, province, latitude, longitude } = req.body;
  const updated = await userService.updateUserLocation(
    req.userId,
    location,
    province,
    latitude,
    longitude
  );
  res.json(updated);
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No image file provided');
  }

  const bucket = 'profile-pictures';
  const folder = 'profiles';
  const publicUrl = await uploadFile(
    bucket,
    folder,
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname
  );

  const updatedUser = await userService.updateProfilePicture(req.userId, publicUrl);
  res.json(updatedUser);
});

module.exports = {
  listUsers,
  getUserById,
  updateProfile,
  changePassword,
  updateLocation,
  updateProfilePicture,
};
