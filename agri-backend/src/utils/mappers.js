function formatDate(value) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString().split('T')[0];
}

function toUser(row) {
  return {
    id: row.id,
    username: row.username || '',
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    location: row.location || '',
    province: row.province || '',
    profilePicture: row.profilePicture || row.profile_picture || null,
    latitude: row.latitude !== null && row.latitude !== undefined ? Number.parseFloat(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number.parseFloat(row.longitude) : null,
    joinedDate: formatDate(row.joinedDate || row.joined_date),
    avatarColor: row.avatarColor || row.avatar_color || '#16A34A',
  };
}

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId ?? row.category_id,
    price: Number.parseFloat(row.price),
    unit: row.unit,
    quantity: row.quantity,
    description: row.description || '',
    imageUrl: row.imageUrl || row.image_url || '',
    supplierId: row.supplierId ?? row.supplier_id,
    location: row.location || '',
    province: row.province || '',
    latitude: row.latitude !== null && row.latitude !== undefined ? Number.parseFloat(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number.parseFloat(row.longitude) : null,
    availability: row.availability,
    createdAt: formatDate(row.createdAt || row.created_at),
  };
}

module.exports = { toUser, toProduct, formatDate };
