import weaviate, { WeaviateClient } from 'weaviate-client'
require('dotenv').config();

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const cohereKey = process.env.COHERE_API_KEY as string

    const client = await weaviate.connectToWeaviateCloud(weaviateURL,
        {
            authCredentials: new weaviate.ApiKey(weaviateKey),
            headers: {
                'X-Cohere-Api-Key': cohereKey,  // Replace with your inference API key
            }
        })

    const jeopardyCollection = client.collections.get('JeopardyQuestion');
    const searchresults = await jeopardyCollection.query.nearText(['question about animals'])

    console.log("Near Text objects for:", "search", JSON.stringify(searchresults, null, 2));
}

void main();
