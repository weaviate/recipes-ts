import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

  const weaviateURL = process.env.WEAVIATE_URL as string
  const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
  const openaiKey = process.env.OPENAI_API_KEY as string

  // Step 1: Connect to your Weaviate instance  
  const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
    authCredentials: new weaviate.ApiKey(weaviateKey),
    headers: {
      'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
    }
  })

  // Delete the "Conference" collection if it exists
  await client.collections.delete('Conference');

  if (await client.collections.exists('Conference') == false) {

    // Step 2: Create a collection with both a vectorizer and generative model
    await client.collections.create({
      name: 'Conference',
      // Define your Weaviate vectorizer and OpenAI generative model  
      vectorizers: weaviate.configure.vectorizer.text2VecWeaviate({
        sourceProperties: ['title','track', 'description', 'speaker_bio'],
      }),
      generative: weaviate.configure.generative.openAI()
    });

    try {
      let myCollection = client.collections.use('Conference');

      // Step 3: Download data to import into the "Conference" collection
      const url = 'https://raw.githubusercontent.com/malgamves/weaviate-servers/refs/heads/agent-data/hono-server/src/conference.json'
      const response = await fetch(url);
      const conferenceTalks = await response.json();

      // Step 4: Bulk insert downloaded data into the "Conference" collection
      let insertRes = await myCollection.data.insertMany(conferenceTalks)

      console.log('Data Imported', insertRes);
    } catch (e) {
      console.error(e);
    }
  }

  await client.close()
}

void main();