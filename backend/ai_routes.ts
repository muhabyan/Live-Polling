import { Groq } from 'groq-sdk';
import express from 'express';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/generate-questions', async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'Groq API key not configured' });
  }

  const { topic, audienceType, questionCount = 4 } = req.body;

  try {
    const prompt = `
      You are an expert event engagement strategist. I am hosting a presentation on the topic: "${topic}".
      My target audience is: "${audienceType || 'General Audience'}".
      
      Generate exactly ${questionCount} interactive polling questions to ask my audience to keep them engaged.
      Mix the question types between: 'multiple_choice', 'word_cloud', 'rating', and 'true_false'.
      
      Return ONLY a valid JSON array of question objects matching this exact TypeScript structure:
      
      type QuestionType = 'multiple_choice' | 'open_text' | 'rating' | 'word_cloud' | 'true_false';
      interface QuestionOption { id: string; text: string; isCorrect?: boolean; }
      interface Question {
        type: QuestionType;
        title: string;
        subtitle?: string;
        timerSeconds: number; // 30, 45, or 60
        options?: QuestionOption[]; // ONLY for multiple_choice and true_false
        ratingMin?: number; // ONLY for rating (usually 1)
        ratingMax?: number; // ONLY for rating (usually 5)
        ratingMinLabel?: string; // ONLY for rating
        ratingMaxLabel?: string; // ONLY for rating
      }
      
      Do NOT wrap the output in markdown blocks (\`\`\`json). Just return the raw JSON array.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '[]';
    
    // Clean up potential markdown wrapping
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
    
    const questions = JSON.parse(cleanJson);
    
    // Ensure all options have IDs
    questions.forEach((q: any) => {
      if (q.options) {
        q.options.forEach((opt: any, i: number) => {
          if (!opt.id) opt.id = `opt-${Date.now()}-${i}`;
        });
      }
    });

    res.json({ questions });
  } catch (error: any) {
    console.error('Groq Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate questions with Groq' });
  }
});

router.post('/summarize-responses', async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'Groq API key not configured' });
  }

  const { questionTitle, responses } = req.body;

  try {
    const responsesText = responses.map((r: any) => r.textResponse || r.ratingValue || JSON.stringify(r.selectedOptionIds)).join('\n');
    
    const prompt = `
      Analyze the following audience responses for the question: "${questionTitle}"
      
      Responses:
      ${responsesText}
      
      Provide a highly concise JSON summary matching this structure:
      {
        "summary": "2-3 sentence overview of the audience's collective response",
        "keyThemes": ["theme 1", "theme 2", "theme 3"],
        "sentiment": "Positive / Neutral / Negative / Mixed",
        "moderatorTip": "One specific tip on what the presenter should say next based on these results"
      }
      
      Return ONLY raw JSON, no markdown formatting.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.3,
      max_tokens: 512,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    
    // Clean up potential markdown wrapping
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);

    res.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error('Groq Summarization Error:', error);
    res.status(500).json({ error: 'Failed to summarize with Groq' });
  }
});

export default router;
