import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { groq } from '@ai-sdk/groq';
import * as z from "zod"

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

    // 2. schema tool - call this tool to get the database schema which will help you to write sql query.
    // - Always use the schema provided by the schema tool
    // - Pass in valid SQL syntax in db tool.
    // - IMPORTANT: To query database call db tool, Don't return just SQL query.

  const SYSTEM_PROMPT = `You are an expert SQL assistant that helps users to query their database using natural language.

    ${new Date().toLocaleString('sv-SE')}
    You have access to following tools:
    1. db tool - call this tool to query the database.

Rules:
- Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE, DROP)
- Return valid SQLLite syntex

Always respond in a helpful, conversational tone while being technically accurate.`;

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: await convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    tools: {
      db: tool({
        description: 'Call this tool to query a database.',
        inputSchema: z.object({
          query: z.string().describe('The SQL query to be ran'),
        }),
        execute: async ({ query }) => {
          console.log("query", query)

          return query
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}