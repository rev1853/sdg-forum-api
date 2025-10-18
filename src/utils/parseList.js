const ApiError = require('./ApiError');

const parseList = (input, { allowEmpty = true, fieldName = 'value' } = {}) => {
  if (input === undefined || input === null || input === '') {
    return [];
  }

  if (Array.isArray(input)) {
    const values = input.map((item) => item.toString().trim()).filter(Boolean);
    if (!allowEmpty && values.length === 0) {
      throw new ApiError(400, `${fieldName} cannot be empty`);
    }
    return values;
  }

  if (typeof input === 'string') {
    const values = input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!allowEmpty && values.length === 0) {
      throw new ApiError(400, `${fieldName} cannot be empty`);
    }
    return values;
  }

  throw new ApiError(400, `${fieldName} must be an array or comma-separated string`);
};

module.exports = parseList;

