import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const huggingFaceKey = process.env.HUGGING_FACE_API_KEY as string

    // Step 1: Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-HuggingFace-Api-Key': huggingFaceKey,  // Replace with your inference API key
        }
    })

    const wikipediaCollection = client.collections.use('Wikipedia');
    // Step 2: Make a Hybrid search query to the "Wikipedia" with text as query input
    const searchResults = await wikipediaCollection.query.hybrid('women in the olympics', {
        limit: 3,
        alpha: 0.8, // weight of each search type (0 = pure keyword search, 1 = pure vector search)
        maxVectorDistance: 0.4,
        returnMetadata: ['score'], // Return the score of results from the query vector
    })
    
    for (const item of searchResults.objects) {
        console.log("\n Search Results \n");
        console.log("...", item.properties.title);
        console.log("...", item.properties.text);        
    }

  await client.close()
}

void main();