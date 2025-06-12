import weaviate, { WeaviateClient } from "weaviate-client";
import { openai } from "@llamaindex/openai";
import { anthropic } from "@llamaindex/anthropic";
import { agent } from "@llamaindex/workflow";
import { tool } from "llamaindex";
import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';
import { z } from "zod";

import "dotenv/config";
import fs from "fs";

const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID;
const VOICE_TO_NUMBER = process.env.VOICE_TO_NUMBER as  string;
const VONAGE_VIRTUAL_NUMBER = process.env.VONAGE_VIRTUAL_NUMBER as string
const VONAGE_PRIVATE_KEY = fs.readFileSync('private.key', 'utf8');


const vonage = new Vonage(new Auth({
    applicationId: VONAGE_APPLICATION_ID,
    privateKey: VONAGE_PRIVATE_KEY,
  }));    

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string


    // Step 1: Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {  
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
        }
    })

    // Step 2: Define and describe your tools functions
    const wikiDataRetrieverTool = tool({
        name: "wikiDataRetriever",
        description: "Use this function to query wikipedia posts from a database",
        parameters: z.object({
            searchTerm: z.string().describe("a query to search a vector database for wikipedia posts"),
        }),
        execute: async ({ searchTerm } : { searchTerm: string }) => {
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
        execute: async ({ searchTerm } : { searchTerm: string }) => {
            const myCollection = client.collections.use("Conference")

            const response = await myCollection.query.hybrid(searchTerm,{
                limit: 4
            })

            return JSON.stringify({ response })
        },
      })

      const phoneDialerTool = tool({
        name: "phoneDialer",
        description: "Use this function to make phone calls ",
        parameters: z.object({
            message: z.string().describe("the message to be shared in a phone call"),
        }),
        execute: async ({ message } : { message: string }) => {

            const response = await vonage.voice.createOutboundCall({
                to: [
                  {
                    type: 'phone',
                    number: VOICE_TO_NUMBER,
                  },
                ],
                from: {
                  type: 'phone',
                  number: VONAGE_VIRTUAL_NUMBER,
                },
                ncco: [
                  {
                    action: 'talk',
                    text: message,
                  },
                ]
              })
                
    
            return JSON.stringify({ response })
              
        }

    })
    
    const tools = [wikiDataRetrieverTool, confDataRetrieverTool, phoneDialerTool];
   
    // Step 3: Create an agent with the tools and llm
    const callAgent = agent({
          tools: tools,
          llm: openai({ model: "gpt-4.1-mini",}),
          verbose: false,
          systemPrompt: `You are a helpful but passive aggressive automation assistant. 
                   When discussing tasks, you should always include an jab at the user.
                  
                   Your main responsibilities:
                   1. Find the appropriate tool to use to make users life easy
                   2. Guilt trip user for using AI`
        });
    
        // Step 4: Run the agent
        const response = await callAgent.run("could you get one line from an ai talk and tell it to someone on a phone call");
        console.log(response.data);

}

void main();