export const config = {
  port: process.env.PORT || 3000,
  adminPassword: process.env.ADMIN_PASSWORD || '123456789cF',
  sessionSecret: process.env.SESSION_SECRET || 'bustogether-secret-key-change-in-production',
  environment: process.env.NODE_ENV || 'development',
  
  // Rate limiting
  messageCooldown: 2000, // 2 seconds between messages
  maxReportsPerMinute: 3,
  maxJoinAttemptsPerMinute: 5,
  
  // Content moderation
  maxMessageLength: 500,
  maxUsernameLength: 20,
  minUsernameLength: 2,
  
  // Auto-moderation thresholds
  profanityKickThreshold: 2, // Kick after 2 profanity violations
  reportDeleteThreshold: 3,  // Delete message after 3 reports
  userReportKickThreshold: 2 // Kick user after 2 reports
};
