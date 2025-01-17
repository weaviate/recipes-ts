import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const voyageaiKey = process.env.VOYAGEAI_API_KEY as string

    // Step 1: Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-VoyageAI-Api-Key': voyageaiKey,  // Replace with your inference API key

        }
    })

    const pdfLibraryCollection = client.collections.get('PDFLibrary');
    // Step 2: Make a semantic search query to the "PDFLibrary" with text as query input

    const searchResults = await pdfLibraryCollection.query.nearText('Bufo boreas', {
        // autoLimit: 1,
        returnProperties: ["pageImage", "pageNumber"],
        returnMetadata: ['distance'], // Return the distance of results from the query vector
    })

    for (const item of searchResults.objects) {
        console.log("\n Search Results \n");
        console.log("...",item.metadata?.distance, item.properties.pageNumber);        
    }

  await client.close()
}

void main();