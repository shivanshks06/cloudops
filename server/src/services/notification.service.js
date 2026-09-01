/**
 * Notification Service Scaffolding
 * Prepares the backend for future multi-channel alert distribution.
 */

const sendSlackAlert = async (alertInfo) => {
  console.log(`[Notification] Stub: Sent Slack alert for ${alertInfo.serviceName}`);
  // TODO: Implement Slack Webhook integration
};

const sendEmailAlert = async (alertInfo) => {
  console.log(`[Notification] Stub: Sent Email alert for ${alertInfo.serviceName}`);
  // TODO: Implement SMTP integration
};

const sendRecoveryAlert = async (alertInfo) => {
  console.log(`[Notification] Stub: Sent Recovery notification for ${alertInfo.serviceName}`);
  // TODO: Implement multi-channel recovery logic
};

module.exports = {
  sendSlackAlert,
  sendEmailAlert,
  sendRecoveryAlert,
};
