// The operator has disabled application-level daily, rate and usage quotas.
// Provider requirements and request-format validation remain in the handlers.
export const unrestrictedUsage=Object.freeze({
  async checkAttempt(){return true;},
  async reserve(){return true;},
});
