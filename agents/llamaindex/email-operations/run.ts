import { FunctionTool, Settings } from "llamaindex";
import { OpenAI, OpenAIAgent } from "@llamaindex/openai";
import { Resend } from 'resend';
import weaviate, { WeaviateClient } from "weaviate-client";
import "dotenv/config";

async function main() {

    const resend = new Resend(process.env.RESEND_API_KEY as string);
    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string

    const senderAddress = "random@mydomain.com" // Replace with your default Resend email address

    // Step 1: Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {  
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
        }
    })

    // Step 2: Define your tools functions
    const emailSender = async ({ text, subject }: { text: string, subject: string}) => {
        const response = await resend.emails.send({
            from: senderAddress,
            to: ['delivered@resend.dev'],
            subject: subject,
            html: `${text}`,
        });

        return JSON.stringify({ response })
    }

    const dataRetriever = async ({ searchTerm } : { searchTerm: string }) => {
        const wikiCollection = client.collections.get("Wikipedia")

        const response = await wikiCollection.query.nearText(searchTerm,
            { limit: 4 })

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
    const dataRetrieverTool = FunctionTool.from(dataRetriever, {
        name: "dataRetriever",
        description: "Use this function to query wikipedia posts from a database",
        parameters: {
            type: 'object',
            required: ['searchTerm'],
            properties: {
                searchTerm: { type: 'string', description: 'a query to search a vector database' },
            }
        }
    })

    const emailTool = FunctionTool.from(emailSender, {
        name: "emailSender",
        description: "Use this tool to send emails",
        parameters: {
            type: "object",
            properties: {
                text: { type: 'string', description: 'the main content of an email' },
                subject: { type: 'string', description: 'the subject of an email' }
            },
            required: ['text', 'subject'],
        }
    })

    
    const tools = [dataRetrieverTool, emailTool ];

    // Step 6: Make your tools available to your Language Model
    const agent = new OpenAIAgent({ tools });

    // Step 7: Ask your Agent to do something for you
    let response = await agent.chat({
        message: "Send an email with general knowledge trivia on the olympic games",
      });
       
      console.log(response);

}

void main();