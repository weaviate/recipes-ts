import weaviate from "weaviate-client";
import "dotenv/config";

async function main() {
    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const cohereKey = process.env.COHERE_API_KEY as string

    // const client =  await weaviate.connectToWeaviateCloud(weaviateURL, {
    //     authCredentials: new weaviate.ApiKey(weaviateKey),
    //     headers: {
    //         'X-Cohere-Api-Key': cohereKey,
    //       }
    // })

    // console.log("Client is ready?", await client.isReady())

    const collectionName = "Furniture"

    // const myCollection = client.collections.use(collectionName)

    // const objectRes = await myCollection.generate.hybrid("mid century furniture", {
    //     singlePrompt: `can you translate {description} to italian`
    // },{
    //     autoLimit: 3,
    // })

    // // console.log("RAG", objectRes.generative?.text);

    // for (let object of objectRes.objects) {
    //     console.log("Objects", object.properties);
    //     console.log("RAG", object.generative?.text);
    //   }

}

void main();
