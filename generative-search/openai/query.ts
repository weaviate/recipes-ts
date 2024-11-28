import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string

    // Step 1: Connect to your Weaviate database on Weaviate Cloud
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
        }
    })

    const myCollection = client.collections.get('Wikipedia');

    // Step 2: Make a generative search with a single prompt
    // const genResult = await myCollection.generate.nearText('women in the olympics', {
    //     singlePrompt: "Write a haiku about {text} that includes at least a word from {title}",
    //     // title: "hello world"
    //     // text: "this a great workshop"

    //     // title: "hello my lovely world"
    //     // text: "this a really good workshop"
    // }, {
    //     limit: 3
    // })

    // for (const item of genResult.objects) {
    //     console.log("Single generated concept:", item.generated);
    // }

    // Step 3: Make a generative search with a grouped task
    const groupedGenResult = await myCollection.generate.nearText('women in the olympics', {
        groupedTask: "you're my assitant, i want to impress people on a webinar, what item in this list is the most impressive?",
        // title: "hello world"
    //     // text: "this a great workshop"

    //     // title: "hello my lovely world"
    //     // text: "this a really good workshop"
    }, {
        limit: 3
    })

    console.log("Grouped generated concept:", groupedGenResult.generated);
}

void main();
