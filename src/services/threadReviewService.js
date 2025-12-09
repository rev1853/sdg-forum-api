const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const MAX_SCORE = 100;

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('OPENAI_API_KEY is not set. Thread review will be skipped.');
}

const toDataUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  const absolute = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);

  if (!fs.existsSync(absolute)) {
    return null;
  }

  const extension = path.extname(absolute).slice(1).toLowerCase() || 'jpeg';
  const mime = extension === 'jpg' ? 'jpeg' : extension;
  const base64 = fs.readFileSync(absolute, { encoding: 'base64' });
  return `data:image/${mime};base64,${base64}`;
};

const clampScore = (score) => {
  if (Number.isNaN(score)) {
    return 0;
  }
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.max(0, Math.min(MAX_SCORE, score));
};

const reviewThread = async ({ title, body, tags, categories, imagePath }) => {
  if (!openaiClient) {
    return null;
  }

  const categoryList = (categories || []).map((cat) => cat.name || cat).filter(Boolean);
  const tagList = (tags || []).filter(Boolean);

  const prompt = `You are a reviewer specialising in the UN Sustainable Development Goals (SDGs).
Evaluate whether the provided thread content matches the declared SDG categories.
Return a JSON object with:
- match_percentage: number between 0 and 100 (no percent sign)
- reasoning: short explanation (max 50 words)
Be strict but fair; consider title, body, tags, and image description if present. Make sure to ONLY output valid JSON.`;

  const userContent = [
    {
      type: 'text',
      text: `Title: ${title || 'N/A'}\n\nBody: ${body || 'N/A'}\n\nTags: ${tagList.join(', ') || 'None'}\n\nCategories: ${categoryList.join(', ') || 'None'}\n\nIf the image is provided, incorporate it into your assessment.`
    }
  ];

  const dataUrl = toDataUrl(imagePath);
  if (dataUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: dataUrl }
    });
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userContent }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'thread_category_review',
          schema: {
            type: 'object',
            properties: {
              match_percentage: { type: 'number' },
              reasoning: { type: 'string' }
            },
            required: ['match_percentage']
          }
        }
      }
    });

    const messageContent = response?.choices?.[0]?.message?.content;
    const textOutput =
      (Array.isArray(messageContent) ? messageContent[0]?.text : messageContent) || null;
    if (!textOutput) {
      return null;
    }

    const parsed = JSON.parse(textOutput);
    const match = clampScore(Number(parsed.match_percentage));

    return {
      score: match,
      reasoning: parsed.reasoning || ''
    };
  } catch (error) {
    console.error('Failed to review thread with OpenAI', error);
    return null;
  }
};

module.exports = {
  reviewThread
};
