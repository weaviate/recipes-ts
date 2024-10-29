import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const mistralKey = process.env.MISTRAL_API_KEY as string

    // Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-Mistral-Api-Key': mistralKey,  // Replace with your inference API key
        }
    })

    const jeopardyCollection = client.collections.get('JeopardyQuestion');
    // Make a semantic search query to the "JeopardyQuestion" with text as query input
    const searchResults = await jeopardyCollection.query.nearText(['question about animals'], {
        limit: 3,
        returnMetadata: ['distance'], // Return the distance of results from the query vector
        includeVector: false // Change to true to include objects' vectors in your response
    })

    console.log("Near Text objects for:", "search", JSON.stringify(searchResults, null, 2));
}

void main();
