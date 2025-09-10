'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a personalized study roadmap calendar.
 *
 * The flow takes course details and deadlines as input and returns a suggested study roadmap in text format.
 * - generateStudyRoadmap - A function that handles the generation of study roadmap.
 * - GenerateStudyRoadmapInput - The input type for the generateStudyRoadmap function.
 * - GenerateStudyRoadmapOutput - The return type for the generateStudyRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStudyRoadmapInputSchema = z.object({
  courseDetails: z.string().describe('Details about the course, including topics covered.'),
  deadlines: z.string().describe('Upcoming deadlines for assignments and exams.'),
  startDate: z.string().describe('The start date for the study roadmap (YYYY-MM-DD).'),
});
export type GenerateStudyRoadmapInput = z.infer<
  typeof GenerateStudyRoadmapInputSchema
>;

const GenerateStudyRoadmapOutputSchema = z.object({
  roadmap: z.string().describe('A personalized study roadmap calendar for the month.'),
});
export type GenerateStudyRoadmapOutput = z.infer<
  typeof GenerateStudyRoadmapOutputSchema
>;

export async function generateStudyRoadmap(
  input: GenerateStudyRoadmapInput
): Promise<GenerateStudyRoadmapOutput> {
  return generateStudyRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyRoadmapPrompt',
  input: {schema: GenerateStudyRoadmapInputSchema},
  output: {schema: GenerateStudyRoadmapOutputSchema},
  prompt: `You are an AI assistant designed to generate personalized study roadmaps for students.

  Given the following course details, deadlines, and start date, create a detailed study roadmap calendar for the month.

  Course Details: {{{courseDetails}}}
  Deadlines: {{{deadlines}}}
  Start Date: {{{startDate}}}

  The study roadmap should include daily study tasks, key milestones, and suggestions for effective learning.
  The roadmap should be structured in a way that is easy to follow and helps the student stay on track with their studies.
  Please format the output in a readable and organized manner.
  `,
});

const generateStudyRoadmapFlow = ai.defineFlow(
  {
    name: 'generateStudyRoadmapFlow',
    inputSchema: GenerateStudyRoadmapInputSchema,
    outputSchema: GenerateStudyRoadmapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
