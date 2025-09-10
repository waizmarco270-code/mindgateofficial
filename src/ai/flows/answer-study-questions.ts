'use server';

/**
 * @fileOverview This flow allows students to ask questions about their study material and receive detailed explanations.
 *
 * - answerStudyQuestion - A function that takes a student's question and study material as input and returns a detailed explanation.
 * - AnswerStudyQuestionInput - The input type for the answerStudyQuestion function.
 * - AnswerStudyQuestionOutput - The return type for the answerStudyQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerStudyQuestionInputSchema = z.object({
  question: z
    .string()
    .describe('The question the student is asking about the study material.'),
  studyMaterial: z
    .string()
    .describe('The study material the question is about.'),
});

export type AnswerStudyQuestionInput = z.infer<typeof AnswerStudyQuestionInputSchema>;

const AnswerStudyQuestionOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A helpful and concise answer to the question.'),
});

export type AnswerStudyQuestionOutput = z.infer<typeof AnswerStudyQuestionOutputSchema>;

export async function answerStudyQuestion(input: AnswerStudyQuestionInput): Promise<AnswerStudyQuestionOutput> {
  return answerStudyQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerStudyQuestionPrompt',
  input: {schema: AnswerStudyQuestionInputSchema},
  output: {schema: AnswerStudyQuestionOutputSchema},
  prompt: `You are a helpful AI assistant.

  A student has the following question based on their previous conversation:
  {{question}}

  The context of their study material is:
  {{studyMaterial}}

  Provide a clear and concise answer to the student's question.`,
});

const answerStudyQuestionFlow = ai.defineFlow(
  {
    name: 'answerStudyQuestionFlow',
    inputSchema: AnswerStudyQuestionInputSchema,
    outputSchema: AnswerStudyQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {model: 'googleai/gemini-2.5-flash'});
    return output!;
  }
);
