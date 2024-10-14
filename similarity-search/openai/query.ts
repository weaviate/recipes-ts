import weaviate, { WeaviateClient } from 'weaviate-client'
require('dotenv').config();

async function main() {

    const client = await weaviate.connectToWeaviateCloud(process.env.WEAVIATE_URL || '',
        {
            authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || ''),
            headers: {
                'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',  // Replace with your inference API key
            }
        })

    const jeopardyCollection = client.collections.get('JeopardyQuestion');
    const results2 = await jeopardyCollection.query.nearText(['question about animals'])
    console.log("Near Text objects for:", "search", JSON.stringify(results2, null, 2));

    // Generative Search
    const myCollection = client.collections.get('JeopardyQuestion');
    const result = await myCollection.generate.nearText("african elephant in savanna", {
        singlePrompt: "tell me a quick story about this {question} or {answer}",
    })
    console.log("Generated Concept:", result);
}

void main();
