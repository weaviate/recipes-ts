import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const huggingFaceKey = process.env.HUGGING_FACE_API_KEY as string

    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL,{
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-HuggingFace-Api-Key': huggingFaceKey,  // Replace with your inference API key
        }
    })

    const jeopardyCollection = client.collections.get('JeopardyQuestion');
    const searchResults = await jeopardyCollection.query.nearText(['question about animals'])

    console.log("Near Text objects for:", "search", JSON.stringify(searchResults, null, 2));
}

void main();
