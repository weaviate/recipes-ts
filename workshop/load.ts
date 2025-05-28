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

    // if (await client.collections.exists(collectionName) == true) {
    //     await client.collections.delete(collectionName)
    // }

    // await client.collections.create({
    //     name: collectionName,
    //     vectorizers: weaviate.configure.vectorizer.text2VecWeaviate(),
    //     generative: weaviate.configure.generative.cohere()
    // })

    // console.log("Collection exists?", await client.collections.exists(collectionName))

    const dataURL = "https://raw.githubusercontent.com/malgamves/weaviate-servers/refs/heads/agent-data/hono-server/src/furniture.json"

    // const fetchRes = await fetch(dataURL)
    // const furnitureData = await fetchRes.json()

    // const myCollection = client.collections.use(collectionName)

    // const response = await myCollection.data.insertMany(furnitureData)

    // console.log("Insertion complete", response.allResponses)

    // const objectRes = await myCollection.query.fetchObjects({
    //     limit: 3
    // })

    // console.log("Objects", objectRes.objects)

}

void main();
