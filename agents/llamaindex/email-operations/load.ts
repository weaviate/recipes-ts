import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

  const weaviateURL = process.env.WEAVIATE_URL as string
  const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string

  // Step 1: Connect to your Weaviate instance  
  const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
    authCredentials: new weaviate.ApiKey(weaviateKey),
  })

  // Delete the "Wikipedia" collection if it exists
  await client.collections.delete('Wikipedia');

  if (await client.collections.exists('Wikipedia') == false) {

    // Step 2: Create a collection with both a vectorizer and generative model
    await client.collections.create({
      name: 'Wikipedia',
      // Define your OpenAI vectorizer and generative model  
      vectorizers: weaviate.configure.vectorizer.text2VecWeaviate({
        sourceProperties: ['title','text']
      }),

      generative: weaviate.configure.generative.openAI({
        model: 'gpt-4o'
      })
    });

    try {
      let wikipediaCollection = client.collections.use('Wikipedia');

      // Step 3: Download data to import into the "Wikipedia" collection
      const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/wikipedia-small-dataset/wiki-10.json'
      const wiki_data = await fetch(url);
      const wikipediaPages = await wiki_data.json();

      // Step 4: Bulk insert downloaded data into the "Wikipedia" collection
      let response = await wikipediaCollection.data.insertMany(wikipediaPages)

      console.log('Data Imported', response);
    } catch (e) {
      console.error(e);
    }
  }

  await client.close()
}

void main();