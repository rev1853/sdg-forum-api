let lastTimestamp = 0;
let sequence = 0;

const pad = (value, length) => value.toString(36).padStart(length, '0');

const generateMessageId = () => {
  const now = Date.now();
  if (now === lastTimestamp) {
    sequence += 1;
  } else {
    lastTimestamp = now;
    sequence = 0;
  }

  if (sequence > 46655) {
    sequence = 0;
    lastTimestamp += 1;
  }

  const timestampPart = pad(lastTimestamp, 10);
  const sequencePart = pad(sequence, 3);

  return `${timestampPart}${sequencePart}`;
};

module.exports = {
  generateMessageId
};

