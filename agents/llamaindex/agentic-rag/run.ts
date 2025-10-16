import { Resend } from 'resend';
import weaviate, { WeaviateClient } from "weaviate-client";
import { openai } from "@llamaindex/openai";
import { agent } from "@llamaindex/workflow";
import { tool, Settings } from "llamaindex";

import { z } from "zod";
import "dotenv/config";

async function main() {

    const resend = new Resend(process.env.RESEND_API_KEY as string);
    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string

    const senderAddress = "onboarding@resend.dev" // Replace with your default Resend email address

    // Step 1: Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
        }
    })

    Settings.callbackManager.on("llm-tool-call", (toolCall) => {
        console.log(`Tool called: ${toolCall}`)
    })

    // Step 2: Describe and define your tools for your Agent 
    const wikiDataRetrieverTool = tool({
        name: "wikiDataRetriever",
        description: "Use this function to query wikipedia posts from a database",
        parameters: z.object({
            searchTerm: z.string().describe("a query to search a vector database for wikipedia posts"),
        }),
        execute: async ({ searchTerm }: { searchTerm: string }) => {
            const wikiCollection = client.collections.use("Wikipedia")

            const response = await wikiCollection.query.hybrid(searchTerm,
                { limit: 4 })

            return JSON.stringify({ response })
        },
    })

    const confDataRetrieverTool = tool({
        name: "confDataRetriever",
        description: "Use this function to query conference talks from a database",
        parameters: z.object({
            searchTerm: z.string().describe("a query to search a vector database for conference talks"),
        }),
        execute: async ({ searchTerm }: { searchTerm: string }) => {
            const myCollection = client.collections.use("Conference")

            const response = await myCollection.query.hybrid(searchTerm, {
                limit: 4
            })

            return JSON.stringify({ response })
        },
    })

    const emailSenderTool = tool({
        name: "emailSender",
        description: "Use this function to send emails",
        parameters: z.object({
            text: z.string().describe("the main content of an email"),
            subject: z.string().describe("the subject of an email"),
        }),
        execute: async ({ text, subject }: { text: string, subject: string }) => {
            const response = await resend.emails.send({
                from: senderAddress,
                to: ['delivered@resend.dev'],
                subject: subject,
                html: `${text}`,
            });

            return JSON.stringify({ response })
        }
    })

    const tools = [wikiDataRetrieverTool, emailSenderTool, confDataRetrieverTool];

    // Step 3: Create your Agent
    const callAgent = agent({
        tools: tools,
        llm: openai({ model: "gpt-4.1-mini", }),
        verbose: false,
        systemPrompt: `You are a helpful but passive aggressive automation assistant. 
                   When discussing tasks, you should always include an jab at the user.
                  
                   Your main responsibilities:
                   1. Find the appropriate tool to use to make users life easy
                   2. Guilt trip user for using AI`
    });

    // Step 4: Run your Agent
    const response = await callAgent.run("could you get one line from an accessibility talk and send it to my students ");
    console.log(response.data);



}

void main();