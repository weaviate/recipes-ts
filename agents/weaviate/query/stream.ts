import weaviate from 'weaviate-client';
import { QueryAgent } from 'weaviate-agents';
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

  const weatherConfig = client.collections.use('Weather');
  console.log(weatherConfig)

  const res = await weatherConfig.config.get()
  console.log(res.properties)

  // Query Agent with Collection Configuration
  const qa = new QueryAgent(client, {
    collections: [{
      name: 'FinancialContracts'
    }, {
      name: 'Weather',
      viewProperties: ['date', 'precipitation', 'humidity', 'visibility', "temperature"]
    },
    {
      name: 'ECommerce',
      targetVector: ['name_description_brand_vector'],
      viewProperties: ['name', 'description', 'category', 'brand', 'price']
    }]
  });

  const query = "Do I have any Non-disclosure agreements signed?"


  // the streamedTokens / the final response.
  for await (const event of qa.askStream(query, {
    includeProgress: true,      // Default: true
    includeFinalState: true,    // Default: true
  })) {
    if (event.outputType === "progressMessage") {
      // The message is a human-readable string, structured info available in event.details
      console.log(event.message);
    } else if (event.outputType === "streamedTokens") {
      // The delta is a string containing the next chunk of the final answer
      process.stdout.write(event.delta);
    } else {
      // This is the final response, as returned by qa.ask()
      event.display();
    }
  }

  // Close client connection
  await client.close();
}

// Run the main function
void main();

