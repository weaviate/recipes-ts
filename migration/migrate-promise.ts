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
  })

  let wiki_src = client_src.collections.use("Wiki")
  let wiki_tgt = client_tgt.collections.use("MTWiki")

  console.time('myConcurrentTimer');
  // let maxItems = await wiki_src.length()
  let maxItems = 5000

  console.log(`Migrating ${maxItems} objects`)
  let counter: number = 0

  let itemsToInsert = []
  const promises = []

  for await (const item of wiki_src.iterator({ includeVector: true })) {
    // Check if we've reached the maximum items
    if (counter >= maxItems) {
      console.log(`Reached maximum items limit of ${maxItems}`);
      break;
    }

    counter++;
    if (counter % 500 == 0)
      console.log(`Import: ${counter}`)

    let objectToInsert = {
      properties: item.properties,
      vectors: item.vectors.main_vector,
      uuid: item.uuid,
    }

    itemsToInsert.push(objectToInsert)

    if (itemsToInsert.length == 500 || counter == maxItems) {

      const promise = wiki_tgt.data.insertMany(itemsToInsert)
        .then((response) => {

          console.log(`Successfully imported batch of ${Object.keys(response.uuids).length} items`);
          if (response.hasErrors) {
            console.log("this the error", response.errors)
            throw new Error("Error in batch import!");
          }
        })
        .catch((error) => {
          console.error('Error importing batch:', error);
        })

      promises.push(promise)
      itemsToInsert = [];

    }
  }
  // Runs all promises 
  await Promise.all(promises)

  console.timeEnd('myConcurrentTimer');
  await client_src.close()
  await client_tgt.close()
}

void main();