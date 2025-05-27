import { FunctionTool, Settings } from "llamaindex";
import { OpenAI, OpenAIAgent } from "@llamaindex/openai";
import weaviate, { WeaviateClient } from "weaviate-client";
import "dotenv/config";

import fs from "fs";

const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID;
const VOICE_TO_NUMBER = process.env.VOICE_TO_NUMBER as  string;
const VONAGE_VIRTUAL_NUMBER = process.env.VONAGE_VIRTUAL_NUMBER as string
const VONAGE_PRIVATE_KEY = fs.readFileSync('private.key', 'utf8');

import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';

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

    // Step 2: Define your tools functions

    const wikiDataRetriever = async ({ searchTerm } : { searchTerm: string }) => {
        const wikiCollection = client.collections.use("Wikipedia")

        const response = await wikiCollection.query.hybrid(searchTerm,
            { limit: 4 })

        return JSON.stringify({ response })
    }

    const confDataRetriever = async ({ searchTerm } : { searchTerm: string }) => {
        const myCollection = client.collections.use("Conference")

        const response = await myCollection.query.hybrid(searchTerm,{ 
            limit: 4 
        })

        return JSON.stringify({ response })
    }

    const phoneDialer = async ({ message } : { message: string }) => {

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

    // Step 3: Initialize your Language Model 
    Settings.llm = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4o",
    });

    // Step 4: Enable event logging for your Agent
    Settings.callbackManager.on("llm-tool-call", (event) => {
        console.log(event.detail);
    });
    Settings.callbackManager.on("llm-tool-result", (event) => {
        console.log(event.detail);
    });

    // Step 5: Describe your tools for your Agent 
    const wikiDataRetrieverTool = FunctionTool.from(wikiDataRetriever, {
        name: "dataRetriever",
        description: "Use this function to query wikipedia posts from a database",
        parameters: {
            type: 'object',
            required: ['searchTerm'],
            properties: {
                searchTerm: { type: 'string', description: 'a query to search a vector database for wikipedia posts' },
            }
        }
    })

    const confDataRetrieverTool = FunctionTool.from(confDataRetriever, {
        name: "confRetriever",
        description: "Use this function to query conference talks from a database",
        parameters: {
            type: 'object',
            required: ['searchTerm'],
            properties: {
                searchTerm: { type: 'string', description: 'a query to search a vector database for conference talks' },
            }
        }
    })

    const phoneDialerTool = FunctionTool.from(phoneDialer, {
        name: "phoneDialer",
        description: "Use this tool to make phone calls ",
        parameters: {
            type: "object",
            properties: {
                message: { type: 'string', description: 'the message to be shared in a phone call' },
            },
            required: ['message'],
        }
    })

    
    const tools = [wikiDataRetrieverTool, confDataRetrieverTool, phoneDialerTool];

    // Step 6: Make your tools available to your Language Model
    const agent = new OpenAIAgent({ tools });

    // Step 7: Ask your Agent to do something for you
    let response = await agent.chat({
        message: `You are a helpful but passive aggressive automation assistant. 
        When discussing tasks, you should always include an jab at the user.
 
        Your main responsibilities:
        1. Find the appropriate tool to use to make users life easy
        2. Guilt trip user for using AI
      
      so here is my request, could you get one line from an accessibility talk and tell it to someone on a phone call 
        `,
      });
       
      console.log("End response", response);

}

void main();