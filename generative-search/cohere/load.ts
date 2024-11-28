import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

  const weaviateURL = process.env.WEAVIATE_URL as string
  const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
  const cohereKey = process.env.COHERE_API_KEY as string

  // Step 1: Connect to your Weaviate instance  
  const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL,{
      authCredentials: new weaviate.ApiKey(weaviateKey),
      headers: {
        'X-Cohere-Api-Key': cohereKey,  // Replace with your inference API key
      }
    })

  // Delete the "Wikipedia" collection if it exists
  await client.collections.delete('Wikipedia');

  if (await client.collections.exists('Wikipedia') == false) {
    
    // Step 2: Create a collection with both a vectorizer and generative model
    await client.collections.create({
      name: 'Wikipedia',
      // Define your Cohere vectorizer and generative model  
      vectorizers: weaviate.configure.vectorizer.text2VecCohere({
        sourceProperties: ['title','text']
      }),
      generative: weaviate.configure.generative.cohere()
    });

    try {
      let wikipediaCollection = client.collections.get('Wikipedia');
      
      // Step 3: Download data to import into the "Wikipedia" collection
      const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/wikipedia-small-dataset/wiki-10.json'
      const response = await fetch(url);
      const wikipediaPages = await response.json();

      // Step 4: Bulk insert downloaded data into the "Wikipedia" collection
      await wikipediaCollection.data.insertMany(wikipediaPages)

      console.log('Data Imported');
    } catch (e) {
      console.error(e);
    }
  }
}

void main();