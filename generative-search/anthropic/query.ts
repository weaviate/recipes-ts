import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const anthropicKey = process.env.ANTHROPIC_API_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string

    // Connect to your Weaviate database on Weaviate Cloud
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL,
        {
          authCredentials: new weaviate.ApiKey(weaviateKey),
          headers: {
            'X-Anthropic-Api-Key': anthropicKey,
            'X-Anthropic-Baseurl': 'https://api.anthropic.com',  // Optional; for providing a custom base URL  
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
          }
        }
      )

        const myCollection = client.collections.get('JeopardyQuestion');

        // Make a Generative Search with a Single Prompt
        const genResult = await myCollection.generate.nearText("african elephant in savanna", {
            singlePrompt: "tell me a quick story about this {question} or {answer}",
        })
        
        for (const item of genResult.objects) {
            console.log("Single Generated Concept:", item.generated);
        }
    
        // Make a Generative Search with a Grouped Task
        const groupedGenResult = await myCollection.generate.nearText("african elephant in savanna", {
            groupedTask: "Could you summarize all the results received into a single informational paragraph?",
        })
        
        console.log("Grouped Generated Concept:", genResult.generated);
}

void main();
