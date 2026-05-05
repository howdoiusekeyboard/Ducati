// src/utils/formatters.js
// Utility functions for safe number formatting and operations

/**
 * Safely converts a value to fixed decimal places
 * @param {any} value - The value to format
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {string} - Formatted string with specified decimal places
 */
export const safeToFixed = (value, decimals = 2) => {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return (0).toFixed(decimals);
  }

  // Convert to number
  const num = typeof value === 'number' ? value : parseFloat(value);

  // Check if conversion resulted in valid number
  if (isNaN(num)) {
    return (0).toFixed(decimals);
  }

  return num.toFixed(decimals);
};

/**
 * Safely converts a value to a number
 * @param {any} value - The value to convert
 * @param {number} defaultValue - Default value if conversion fails (default 0)
 * @returns {number} - The converted number or default value
 */
export const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

// Phase 9: AED-first regional default. App is targeted at Dubai/UAE users; the
// Gemini system instruction also mandates AED-first quoting. UI currency must match.
const aedFormatter = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Safely formats currency values in AED (en-AE locale).
 * @param {any} amount - The amount to format
 * @returns {string} - Formatted AED currency string (e.g., "AED 4,500")
 */
export const formatCurrency = (amount) => {
  const num = safeNumber(amount, 0);
  return aedFormatter.format(num);
};

/**
 * Safely calculates percentage
 * @param {any} value - The numerator
 * @param {any} total - The denominator
 * @param {number} decimals - Number of decimal places
 * @returns {number} - The percentage value
 */
export const safePercentage = (value, total, decimals = 1) => {
  const numValue = safeNumber(value, 0);
  const numTotal = safeNumber(total, 0);

  if (numTotal === 0) return 0;

  const percentage = (numValue / numTotal) * 100;
  return parseFloat(percentage.toFixed(decimals));
};
