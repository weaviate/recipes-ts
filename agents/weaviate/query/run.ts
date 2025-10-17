import weaviate from 'weaviate-client';
import { QueryAgent, ChatMessage } from 'weaviate-agents';
import "dotenv/config";

async function main() {
  // Initialize Weaviate client
  const headers: Record<string, string> = {
    'X-Cohere-API-Key': process.env.COHERE_API_KEY || '',
    'X-OpenAI-API-Key': process.env.OPENAI_API_KEY || '',
  };

  const client = await weaviate.connectToWeaviateCloud(process.env.WEAVIATE_URL as string, {
    authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_ADMIN_KEY as string),
    headers
  });

  // Query Agent with Collection Configuration
  const qaWithConfig = new QueryAgent(client, {
    collections: [{
      name: 'ECommerce',
      targetVector: ['name_description_brand_vector'],
      viewProperties: ['description']
      // tenant: 'tenantA' // Optional for multi-tenancy
    }, {
      name: 'FinancialContracts'
    }, {
      name: 'Weather'
    }]
  });

    const conversation: ChatMessage[] = [
    {
      role: "user",
      content: "Hi!"
    },
    {
      role: "assistant",
      content: "Hello! How can I assist you today?"
    },
    {
      role: "user",
      content: "I have some questions about the weather data. You can assume the temperature is in Fahrenheit and the wind speed is in mph.",
    },
    {
      role: "assistant",
      content: "I can help with that. What specific information are you looking for?",
    },
  ]

  // Add the user's query
  conversation.push(
    {
      role: "user",
      content: "I like vintage clothes and nice shoes. Recommend some of each below $60.",
    }
  )


  // Get the response
  const response = await qaWithConfig.ask(conversation)
  console.log(response.finalAnswer)

  // Continue the conversation
  conversation.push({ role: "assistant", content: response.finalAnswer })
  conversation.push({ role: "user", content: "and under $100?" })

  const followUpResponse = await qaWithConfig.ask(conversation)
  console.log(followUpResponse.finalAnswer)

  // Close client connection
  await client.close();
}

// Run the main function
void main();