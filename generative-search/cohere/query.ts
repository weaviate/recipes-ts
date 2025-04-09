import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

  const weaviateURL = process.env.WEAVIATE_URL as string
  const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
  const cohereKey = process.env.COHERE_API_KEY as string

  // Step 1: Connect to your Weaviate database on Weaviate Cloud
  const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
    authCredentials: new weaviate.ApiKey(weaviateKey),
    headers: {
      'X-Cohere-Api-Key': cohereKey,  // Replace with your inference API key
    }
  })

  const myCollection = client.collections.use('Wikipedia');

  // Step 2: Make a generative search with a single prompt
  const genResult = await myCollection.generate.nearText('women in the olympics', {
    singlePrompt: "Write a haiku about {text} that includes at least a word from {title}",
  })

  for (const item of genResult.objects) {
    console.log("Single generated concept:", item.generative?.text);
  }

  // Step 3: Make a generative search with a grouped task
  const groupedGenResult = await myCollection.generate.nearText('women in the olympics', {
    groupedTask: "Summarize all the results received in 100 words",
  })

  console.log("Grouped generated concept:", groupedGenResult.generative?.text);

  await client.close()
}

void main();
