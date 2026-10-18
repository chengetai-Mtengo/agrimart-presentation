const { pool } = require('../config/database');
const { NotFoundError } = require('../utils/errors');

async function getNotificationSettings(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO notification_settings (user_id) VALUES ($1)',
        [userId]
      );
      const retry = await pool.query(
        'SELECT * FROM notification_settings WHERE user_id = $1',
        [userId]
      );
      return retry.rows[0] || { user_id: userId };
    }
    
    return result.rows[0];
  } catch (error) {
    return { user_id: userId };
  }
}

async function updateNotificationSettings(userId, settings) {
  const { email_notifications, push_notifications, sms_notifications, price_predictions_enabled } = settings;
  
  try {
    const result = await pool.query(
      `UPDATE notification_settings 
       SET email_notifications = COALESCE($1, email_notifications),
           push_notifications = COALESCE($2, push_notifications),
           sms_notifications = COALESCE($3, sms_notifications),
           price_predictions_enabled = COALESCE($4, price_predictions_enabled),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5
       RETURNING *`,
      [email_notifications, push_notifications, sms_notifications, price_predictions_enabled, userId]
    );
    
    if (result.rows.length === 0) {
      return { user_id: userId, ...settings };
    }
    
    return result.rows[0];
  } catch (error) {
    return { user_id: userId, ...settings };
  }
}

module.exports = { getNotificationSettings, updateNotificationSettings };