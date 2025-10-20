import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const questionSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        correctAnswer: { type: Type.STRING }
    },
    required: ['question', 'options', 'correctAnswer']
};


export const generateMCQ = async (topic: string, retries = 2): Promise<Question | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a single, unique, and challenging multiple-choice trivia question about ${topic}. The question should have exactly 4 options, and one of them must be the correct answer. Ensure the correct answer is one of the provided options.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: questionSchema,
        },
      });
      
      const text = response.text.trim();
      const parsed = JSON.parse(text);

      if (parsed.question && parsed.options && parsed.options.length === 4 && parsed.correctAnswer && parsed.options.includes(parsed.correctAnswer)) {
          return {
              topic: topic,
              text: parsed.question,
              options: parsed.options,
              correctAnswer: parsed.correctAnswer
          };
      }
      console.warn("Gemini response validation failed. Retrying...", parsed);

    } catch (error) {
      console.error(`Error generating MCQ (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) return null; // Return null on last failed attempt
      await new Promise(res => setTimeout(res, 500)); // Wait before retrying
    }
  }
  return null;
};