import weaviate, { WeaviateClient } from 'weaviate-client'
require('dotenv').config();

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const googleKey = process.env.GOOGLE_API_KEY as string

    const client = await weaviate.connectToWeaviateCloud(weaviateURL,{
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-Google-Vertex-Api-Key': googleKey,  // Replace with your inference API key
        }
        }
    )

    const myCollection = client.collections.get('JeopardyQuestion');

    // Generative Search with Single Prompt
    const genResult = await myCollection.generate.nearText("african elephant in savanna", {
        singlePrompt: "tell me a quick story about this {question} or {answer}",
    })
    
    for (const item of genResult.objects) {
        console.log("Single Generated Concept:", item.generated);
    }

    // Generative Search with Grouped Task
    const groupedGenResult = await myCollection.generate.nearText("african elephant in savanna", {
        singlePrompt: "Could you summarize all the results received into a single informational paragraph?",
    })
    
    console.log("Grouped Generated Concept:", genResult.generated);
}

void main();
