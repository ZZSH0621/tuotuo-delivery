// Keep provider diagnostics without exposing upstream messages, audio or credentials.
export function providerFailure(status, body = {}) {
  body = body && typeof body === 'object' ? body : {};
  const token = value => typeof value === 'string' && /^[a-zA-Z0-9_.:-]{1,100}$/.test(value) ? value : undefined;
  const providerCode = token(body.code || body.error?.code);
  const requestId = token(body.request_id || body.requestId);
  const hint = String(body.message || body.error?.message || '').slice(0, 2000);
  const providerReason = /^[A-Z][A-Z0-9_:-]{1,100}$/.test(hint) ? hint : undefined;
  let code = [401,403].includes(status) ? 'PROVIDER_UNAUTHORIZED' : [402,429].includes(status) ? 'PROVIDER_RATE_LIMITED' : [400,404,422].includes(status) ? 'PROVIDER_BAD_REQUEST' : 'PROVIDER_FAILED_NO_RETRY';
  if (/ASR_RESPONSE_HAVE_NO_WORDS|NO_VALID_AUDIO|no (?:valid )?speech|empty audio|audio (?:is )?too short|duration.*(?:too short|less than)/i.test(hint)) code = 'NO_SPEECH';
  else if (/DataInspection|ContentFilter|ContentModeration/i.test(providerCode || '')) code = 'PROVIDER_AUDIO_REJECTED';
  else if (/model.*(?:not exist|not found|not available|unsupported)/i.test(hint)) code = 'PROVIDER_MODEL_UNAVAILABLE';
  else if (/audio|sample.?rate|format|base64/i.test(hint) && [400,422].includes(status)) code = 'PROVIDER_AUDIO_INVALID';
  return {code, providerStatus:status, ...(providerCode ? {providerCode} : {}), ...(requestId ? {requestId} : {}), ...(providerReason ? {providerReason} : {})};
}
