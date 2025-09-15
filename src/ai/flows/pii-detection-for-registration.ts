'use server';
/**
 * @fileOverview A flow that uses generative AI to analyze attendee registration fields for potential PII.
 *
 * - detectPii - A function that handles the PII detection process.
 * - DetectPiiInput - The input type for the detectPii function.
 * - DetectPiiOutput - The return type for the detectPii function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPiiInputSchema = z.object({
  fieldValue: z.string().describe('The value of the registration field to analyze.'),
  fieldName: z.string().describe('The name of the registration field.'),
});
export type DetectPiiInput = z.infer<typeof DetectPiiInputSchema>;

const DetectPiiOutputSchema = z.object({
  mayContainPii: z.boolean().describe('Whether or not the field value may contain PII.'),
});
export type DetectPiiOutput = z.infer<typeof DetectPiiOutputSchema>;

export async function detectPii(input: DetectPiiInput): Promise<DetectPiiOutput> {
  return detectPiiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectPiiPrompt',
  input: {schema: DetectPiiInputSchema},
  output: {schema: DetectPiiOutputSchema},
  prompt: `You are an expert in data privacy and security.

You will analyze the given registration field value and determine if it may contain Personally Identifiable Information (PII).
Consider various types of PII, such as names, email addresses, phone numbers, addresses, social security numbers, etc.

Field Name: {{{fieldName}}}
Field Value: {{{fieldValue}}}

Based on the field name and value, determine if the field MAY contain PII. It is ok to be risk-averse and say that a field contains PII even if you are unsure, since this will trigger a privacy disclaimer.

Output a boolean value indicating whether the field may contain PII.
`,
});

const detectPiiFlow = ai.defineFlow(
  {
    name: 'detectPiiFlow',
    inputSchema: DetectPiiInputSchema,
    outputSchema: DetectPiiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
