import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string

    // Connect to your Weaviate database on Weaviate Cloud
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
        }
    })

    const myCollection = client.collections.get('JeopardyQuestion');

    // Make a generative search with a single prompt
    const genResult = await myCollection.generate.nearText("african elephant in savanna", {
        singlePrompt: "tell me a quick story about this {question} or {answer}",
    })

    for (const item of genResult.objects) {
        console.log("Single generated concept:", item.generated);
    }

    // Make a generative search with a grouped task
    const groupedGenResult = await myCollection.generate.nearText("african elephant in savanna", {
        groupedTask: "Summarize all the results received into a single informational paragraph?",
    })

    console.log("Grouped generated concept:", groupedGenResult.generated);
}

void main();
