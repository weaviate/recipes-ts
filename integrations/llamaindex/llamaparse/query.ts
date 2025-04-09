import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string

    // Step 1: Connect to your Weaviate database on Weaviate Cloud
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
        }
    })

    const myCollection = client.collections.use('PDFStore');

    // Step 2: Make a generative search with a single prompt
    const genResult = await myCollection.generate.nearText('what animal facts can you share?', {
      singlePrompt: "Write a haiku about {chunk}",
    })
  
    for (const item of genResult.objects) {
      console.log("Single generated concept:", item.generative?.text);
    }
  
    // Step 3: Make a generative search with a grouped task
    const groupedGenResult = await myCollection.generate.nearText('santa clause', {
      groupedTask: "What do Canada and Santa have in common?",
    })
  
    console.log("Grouped generated concept:", groupedGenResult.generative?.text);
  
    await client.close()
}

void main();
