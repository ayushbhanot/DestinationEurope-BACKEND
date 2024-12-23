function sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  function validateNonEmptyString(input) {
    return typeof input === 'string' && input.trim().length > 0;
  }
  
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function sanitizeArray(array) {
    if (!Array.isArray(array)) return [];
    return array.map(item => sanitizeString(item));
  }
  
  function limitStringLength(input, maxLength) {
    if (typeof input !== 'string') return input;
    return input.length > maxLength ? input.substring(0, maxLength) : input;
  }
  
  module.exports = {
    sanitizeString,
    validateNonEmptyString,
    validateEmail,
    sanitizeArray,
    limitStringLength,
  };
  