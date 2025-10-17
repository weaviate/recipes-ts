import weaviate, { WeaviateClient } from 'weaviate-client'
import 'dotenv/config'

async function main() {

  // Step 1: Connect to your Weaviate instance  
  const client: WeaviateClient = await weaviate.connectToLocal({
    authCredentials: new weaviate.ApiKey('YOUR-WEAVIATE-API-KEY'),
    timeout: {query: 60 }
  })

  // Uncomment the code below to delete the "Wikipedia" collection if it exists
  await client.collections.delete('Wikipedia');

  if (await client.collections.exists('Wikipedia') == false) {

    // Step 2: Create a collection with a vectorizer
    await client.collections.create({
      name: 'Wikipedia',
      // Define your Ollama vectorizer  
      vectorizers: [weaviate.configure.vectors.text2VecOllama({
        name: 'title_vector',
        sourceProperties: ['title'],
        apiEndpoint: 'http://host.docker.internal:11434',  // If using Docker, use this to contact your local Ollama instance
        model: 'snowflake-arctic-embed',
      }),],
      generative: weaviate.configure.generative.ollama({
        apiEndpoint: 'http://host.docker.internal:11434',  // If using Docker, use this to contact your local Ollama instance
        model: 'mistral',  // The model to use, e.g. 'deepseek-r1', 'phi3', or 'mistral', 'command-r-plus', 'gemma'
      })
    });

    try {
      let wikipediaCollection = client.collections.use('Wikipedia');

      // Step 3: Download data to import into the "Wikipedia" collection
      const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/wikipedia-small-dataset/wiki-10.json'
      const response = await fetch(url);
      const wikipediaPages = await response.json();

      // Step 4: Bulk insert downloaded data into the "Wikipedia" collection
      await wikipediaCollection.data.insertMany(wikipediaPages)

      console.log('Data Imported! Hooray');

      
    } catch (e) {
      console.error(e);
    }
  }

  await client.close()
}

void main();