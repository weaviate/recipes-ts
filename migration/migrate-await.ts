import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string

    const client_src: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
    })

    const client_tgt: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
    })

    await client_tgt.collections.delete("MTWiki")

    await client_tgt.collections.create({
        name: "MTWiki",
        multiTenancy: {
            enabled: false
        },
        // Additional settings not shown
    })

    let wiki_src = client_src.collections.get("Wiki")
    let wiki_tgt = client_tgt.collections.get("MTWiki")

    console.time('mySerialTimer');
    // let maxItems = await wiki_src.length()
    let maxItems = 5000 // hardcoded
    console.log(`Migrating ${maxItems} objects`)
    let counter: number = 0

    let itemsToInsert = []

    for await (const item of wiki_src.iterator({ includeVector: true })) {
        // Check if we've reached the maximum items
        if (counter >= maxItems) {
            console.log(`Reached maximum items limit of ${maxItems}`);
            break;
        }

        counter++;

        let objectToInsert = {
            properties: item.properties,
            vector: item.vectors.main_vector,
            uuid: item.uuid,
        }

        // Add object to batching array
        itemsToInsert.push(objectToInsert)

        if (itemsToInsert.length == 50 || counter == maxItems) {
            try {
                console.log(`Importing ${counter} objects`)
                const response = await wiki_tgt.data.insertMany(itemsToInsert);

                if (response.hasErrors) {
                    throw new Error("Error in batch import!");
                }
                // Insert
                console.log(`Successfully imported batch of ${itemsToInsert.length} items`);
                itemsToInsert = [];
            } catch (error) {
                console.error('Error importing batch:', error);
            }
        }
    }

    console.timeEnd('mySerialTimer');
    await client_src.close()
    await client_tgt.close()

}

void main();