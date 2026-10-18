const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 30000;

export class MlApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'MlApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${ML_API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const details = body?.detail ?? body;
      const message =
        (typeof details === 'string' && details) ||
        details?.error ||
        `Forecast request failed (${response.status})`;
      throw new MlApiError(message, response.status, details);
    }
    return body;
  } catch (error) {
    if (error instanceof MlApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new MlApiError('The forecast service took too long to respond.', 408);
    }
    throw new MlApiError(`Could not reach the forecast service at ${ML_API_URL}.`, 0, error);
  } finally {
    clearTimeout(timer);
  }
}

export const mlApi = {
  health: () => request('/health'),
  commodities: () => request('/commodities'),
  predict: ({ commodity, province, unit }) =>
    request('/predict', {
      method: 'POST',
      body: JSON.stringify({ commodity, province: province || null, unit: unit || null }),
    }),
};

export { ML_API_URL };
