const RETRYABLE_ERRORS = [
  "unavailable",
  "deadline-exceeded",
  "resource-exhausted",
  "aborted",
  "internal",
];

export const isRetryableNetworkError = (error) => {
  if (!error) return false;
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return RETRYABLE_ERRORS.some(
    (retryable) => code.includes(retryable) || message.includes(retryable)
  );
};

export const logNetworkError = (error, operation) => {
  console.error(`[Network Error] ${operation}:`, {
    code: error?.code,
    message: error?.message,
    stack: error?.stack,
  });
};

export const retryNetworkOperation = async (
  operation,
  maxRetries = 3,
  delay = 1000
) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw lastError;
};
