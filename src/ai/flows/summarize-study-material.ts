'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing study material.
 *
 * It allows students to provide a PDF or link to study material, and the flow summarizes the content,
 * extracts key concepts, and provides a concise overview.
 *
 * @exports summarizeStudyMaterial - The main function to trigger the summarization flow.
 * @exports SummarizeStudyMaterialInput - The input type for the summarizeStudyMaterial function.
 * @exports SummarizeStudyMaterialOutput - The output type for the summarizeStudyMaterial function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudyMaterialInputSchema = z.object({
  material: z.string().describe('The study material, either a PDF data URI or a URL.'),
});
export type SummarizeStudyMaterialInput = z.infer<typeof SummarizeStudyMaterialInputSchema>;

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the study material.'),
  keyConcepts: z.string().describe('The key concepts extracted from the study material.'),
});
export type SummarizeStudyMaterialOutput = z.infer<typeof SummarizeStudyMaterialOutputSchema>;

export async function summarizeStudyMaterial(input: SummarizeStudyMaterialInput): Promise<SummarizeStudyMaterialOutput> {
  return summarizeStudyMaterialFlow(input);
}

const summarizeStudyMaterialPrompt = ai.definePrompt({
  name: 'summarizeStudyMaterialPrompt',
  input: {schema: SummarizeStudyMaterialInputSchema},
  output: {schema: SummarizeStudyMaterialOutputSchema},
  prompt: `You are an expert summarizer of study material for students.

  Your goal is to take the provided study material and provide a concise summary and list the key concepts.

  Study Material: {{{material}}}

  Summary:
  Key Concepts: `,
});

const summarizeStudyMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeStudyMaterialFlow',
    inputSchema: SummarizeStudyMaterialInputSchema,
    outputSchema: SummarizeStudyMaterialOutputSchema,
  },
  async input => {
    const {output} = await summarizeStudyMaterialPrompt(input);
    return output!;
  }
);
