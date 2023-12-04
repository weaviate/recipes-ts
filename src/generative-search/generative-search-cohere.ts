import weaviate, { ApiKey, ConnectionParams, WeaviateClient } from 'weaviate-ts-client';
import axios from 'axios';
require('dotenv').config();

// Connect to Weaviate

// This is the simplest way to connect to Weaviate
// const client: WeaviateClient = weaviate.client({
//     scheme: 'http',
//     host: 'localhost:8080',
//     headers: { 'X-Cohere-Api-Key': <YOUR-COHERE-APIKEY> },  // Replace with your inference API key
// });

// in order to work with ENVIRONMENT VARIABLES and use an APIKEY, you can use
const client: WeaviateClient = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME_URL || 'http', // Replace with https if using WCS
  host: process.env.WEAVIATE_URL || 'localhost:8080', // Replace with your Weaviate URL
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY || 'YOUR-WEAVIATE-API-KEY'), // Replace with your Weaviate API key
  headers: { 'X-Cohere-Api-Key': process.env.COHERE_API_KEY },  // Replace with your inference API key
});

// Create a new collection for your data and vectors
async function createCollection() {
  // Define collection configuration - vectorizer, generative module and data schema
  const schema_definition = {
    class: 'JeopardyQuestion',
    description: 'List of jeopardy questions',
    vectorizer: 'text2vec-cohere',
    moduleConfig: {
      'generative-cohere': {
        'model': 'command-xlarge-nightly',  // Optional - Defaults to `command-xlarge-nightly`. 
        // Can also use`command-xlarge-beta` and `command-xlarge`
      }
    },
    properties: [
      {
        name: 'Category',
        dataType: ['text'],
        description: 'Category of the question',
      },
      {
        name: 'Question',
        dataType: ['text'],
        description: 'The question',
      },
      {
        name: 'Answer',
        dataType: ['text'],
        description: 'The answer',
      }
    ]
  }
  // let's create it
  let new_class = await client.schema.classCreator().withClass(schema_definition).do();

  console.log('We have a new class!', new_class['class']);
}


// run RAG/Generative Search query with single prompt
async function singlePrompt(query: string, prompt: string) {
  const response = await client.graphql.get()
    .withClassName('JeopardyQuestion')
    .withFields('question category answer')
    .withNearText({
      concepts: [query],
    })
    .withGenerate({
      singlePrompt: prompt,
    })
    .withLimit(2)
    .do();

  console.log('Single Prompt response:', JSON.stringify(response, null, 2));
}

// run RAG/Generative Search query as a grouped Task
async function GroupedTask(query: string, prompt: string, properties?: string[]) {
  let response = await client.graphql.get()
    .withClassName('JeopardyQuestion')
    .withFields('question category answer')
    .withNearText({
      concepts: [query],
    })
    .withGenerate({
      groupedTask: prompt,
      groupedProperties: properties
    })
    .do();

  let groupedtask_answer = response["data"]["Get"]["JeopardyQuestion"][0]["_additional"]["generate"]["groupedResult"];
  console.log(`Grouped Task response for query (${query})`, groupedtask_answer);
}


async function runFullExample() {
  // comment this the line bellow if you don't want your class to be deleted each run.
  await deleteCollection();
  if (await collectionExists() == false) {
    // lets create and import our collection
    await createCollection();
    await importData();
  }

  await singlePrompt('Elephants', 'Turn the following Jeopardy question into a Facebook Ad: {question}.');
  await GroupedTask('Animals', 'Explain why these Jeopardy questions are under the Animals category.');
}

runFullExample();

// ------------------------- Helper functions

// Helper function to check if collection exists
async function collectionExists() {
  return client.schema.exists('JeopardyQuestion');
}

// Helper function to delete the collection
async function deleteCollection() {
  // Delete the collection if it already exists
  if (await collectionExists()) {
    console.log('DELETING');
    await client.schema.classDeleter().withClassName('JeopardyQuestion').do();
  }
}


// import data into your collection
async function importData() {
  // now is time to import some data
  // first, let's grab our Jeopardy Questions from the interwebs

  const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json';
  const jeopardy_questions = await axios.get(url);

  let counter = 0;
  let batcher = client.batch.objectsBatcher();

  for (const dataObj of jeopardy_questions.data) {
    batcher = batcher.withObject({
      class: 'JeopardyQuestion',
      properties: dataObj,
      // tenant: 'tenantA'  // If multi-tenancy is enabled, specify the tenant to which the object will be added.
    });

    // push a batch of 5 objects
    if (++counter > 4) {
      await batcher.do();
      batcher = client.batch.objectsBatcher();
      counter = 0;
    }
  }

  // push the remaining batch of objects
  if (counter > 0) {
    await batcher.do();
  }

  console.log('Data Imported');
}