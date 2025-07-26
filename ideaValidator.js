// ideaValidator.js
const axios = require('axios');

/**
 * Checks newIdeas (array) against allRegisteredIdeas (array) for semantic similarity.
 * Returns an array of booleans - true if similar found, false if unique.
 */
async function checkIdeaSimilarity(newIdeas = [], allRegisteredIdeas = []) {
  // Fallback logic if Gemini not set up
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_URL) {
    return newIdeas.map(idea =>
      allRegisteredIdeas.some(
        prev => prev && idea && prev.toLowerCase().trim() === idea.toLowerCase().trim()
      )
    );
  }

  // Gemini logic for each idea (serial - can be parallelized)
  try {
    const results = [];
    for (let idea of newIdeas) {
      const isSimilar = await isIdeaSimilarUsingGemini(idea, allRegisteredIdeas);
      results.push(isSimilar);
    }
    return results;
  } catch (e) {
    // If Gemini fails, fallback to simple check
    return newIdeas.map(idea =>
      allRegisteredIdeas.some(
        prev => prev && idea && prev.toLowerCase().trim() === idea.toLowerCase().trim()
      )
    );
  }
}

async function isIdeaSimilarUsingGemini(currentIdea, allRegisteredIdeas) {
  const prompt = `
You are an expert project reviewer.
Is the idea "${currentIdea}" closely similar to any of these: ${JSON.stringify(allRegisteredIdeas)}?
Respond ONLY "yes" if similar, or "no" if not.
`;

  const response = await axios.post(
    process.env.GEMINI_API_URL,
    {
      contents: [{ parts: [{ text: prompt }] }]
    },
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
  const answer = (response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '').toLowerCase();
  return answer.includes('yes');
}

module.exports = { checkIdeaSimilarity };
