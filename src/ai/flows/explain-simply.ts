'use server';

/**
 * @fileOverview This flow takes a potentially complex explanation and simplifies it for a student.
 *
 * - explainSimply - A function that takes a piece of text and returns a simpler version of it.
 * - ExplainSimplyInput - The input type for the explainSimply function.
 * - ExplainSimplyOutput - The return type for the explainSimply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainSimplyInputSchema = z.object({
  textToSimplify: z.string().describe('The text that needs to be simplified.'),
  originalQuestion: z.string().describe('The original question the user asked to provide context.'),
});

export type ExplainSimplyInput = z.infer<typeof ExplainSimplyInputSchema>;

const ExplainSimplyOutputSchema = z.object({
  simpleExplanation: z.string().describe('A simple, conversational, and easy-to-understand explanation of the provided text.'),
});

export type ExplainSimplyOutput = z.infer<typeof ExplainSimplyOutputSchema>;

export async function explainSimply(input: ExplainSimplyInput): Promise<ExplainSimplyOutput> {
  return explainSimplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainSimplyPrompt',
  input: {schema: ExplainSimplyInputSchema},
  output: {schema: ExplainSimplyOutputSchema},
  prompt: `You are a friendly and patient AI tutor named Marco. Your goal is to make complex topics easy to understand.

  A student asked the following question:
  "{{{originalQuestion}}}"

  You previously gave this answer:
  "{{{textToSimplify}}}"

  The student is still confused and has asked you to explain it more simply.

  Your task is to re-explain the answer in a much simpler, more conversational, and encouraging tone. Use analogies, break it down into smaller pieces, and avoid jargon. Pretend you are explaining it to a friend who is struggling with the concept. Start your response with a friendly opener like "Of course!" or "Let's try looking at it another way."`,
});

const explainSimplyFlow = ai.defineFlow(
  {
    name: 'explainSimplyFlow',
    inputSchema: ExplainSimplyInputSchema,
    outputSchema: ExplainSimplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {model: 'googleai/gemini-2.5-flash'});
    return output!;
  }
);
