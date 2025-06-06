import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string

    // Step 1: Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
    })

    const wikipediaCollection = client.collections.use('Wikipedia');
    // Step 2: Make a semantic search query to the "Wikipedia" with text as query input

    const searchResults = await wikipediaCollection.query.nearText('women in the olympics', {
        autoLimit: 1,
        returnMetadata: ['distance'], // Return the distance of results from the query vector
    })

    for (const item of searchResults.objects) {
        console.log("\n Search Results \n");
        console.log("...",item.metadata?.distance, item.properties.title);
        console.log("...",item.metadata?.distance, item.properties.text);        
    }

  await client.close()
}

void main();