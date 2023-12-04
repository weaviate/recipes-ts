import weaviate, { ApiKey, ConnectionParams, WeaviateClient } from 'weaviate-ts-client';
import axios from 'axios';
require('dotenv').config();

// Connect to Weaviate

// This is the simplest way to connect to Weaviate
// const client: WeaviateClient = weaviate.client({
//     scheme: 'http',
//     host: 'localhost:8080',
//     headers: { 'X-COHERE-Api-Key': <YOUR-COHERE_API_KEY> },  // Replace with your inference API key
// });

// in order to work with ENVIRONMENT VARIABLES and use an APIKEY, you can use
const client: WeaviateClient = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME_URL || 'http', // Replace with https if using WCS
  host: process.env.WEAVIATE_URL || 'localhost:8080', // Replace with your Weaviate URL
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY || 'YOUR-WEAVIATE-API-KEY'), // Replace with your Weaviate API key
  headers: { 'X-COHERE-Api-Key': process.env.COHERE_API_KEY },  // Replace with your inference API key
});


async function similaritySearchNearText(concepts: string[]) {
  return await client
    .graphql
    .get()
    .withClassName("JeopardyQuestion")
    .withFields("question answer category _additional { distance id }")
    .withNearText({
      "concepts": concepts,
      moveAwayFrom: { concepts: ["reptiles"], force: 1 } // let's move away from reptiles with all the force
    })
    .withLimit(2)
    .do();
}

async function similaritySearchNearObject(id: string) {
  return await client
    .graphql
    .get()
    .withClassName("JeopardyQuestion")
    .withFields("question answer category _additional { distance id }")
    .withNearObject({ id: id })
    .withLimit(2)
    .do();
}

async function similaritySearchNearVector(vector: number[]) {
  return await client
    .graphql
    .get()
    .withClassName("JeopardyQuestion")
    .withFields("question answer category _additional { distance id }")
    .withNearVector({ vector: vector })
    .withLimit(2)
    .do();
}

async function runFullExample() {
  // comment this the line bellow if you don't want your class to be deleted each run.
  await deleteCollection();
  if (await collectionExists() == false) {
    // lets create and import our collection
    await createCollection();
    await importData();
  }
  // Near Text example
  let concepts = ["question about animals"];
  let near_text_response = await similaritySearchNearText(concepts);
  console.log("Near Text objects for:", concepts, JSON.stringify(near_text_response, null, 2));

  // Near Object example
  // lets store the id of our first match
  let top_match_id = near_text_response.data["Get"]["JeopardyQuestion"][0]["_additional"]["id"];
  // lets search the two elements closests to our top object
  let near_object_response = await similaritySearchNearObject(top_match_id);
  console.log("Closest 2 objects to id:", top_match_id, JSON.stringify(near_object_response, null, 2));
  // now let's search the nearest objects close to a vector
  // first, let's grab a vector
  let with_vector_query = await client
    .graphql
    .get()
    .withClassName("JeopardyQuestion")
    .withFields("_additional { vector id }")
    .withNearText({ "concepts": ["big sized mammals"] })
    .withLimit(2)
    .do();
  let vector = with_vector_query.data["Get"]["JeopardyQuestion"][0]["_additional"]["vector"];
  let id = with_vector_query.data["Get"]["JeopardyQuestion"][0]["_additional"]["id"];
  console.log("This is our vector (truncated)", vector.slice(0, 10), "...");
  console.log("It has this ID:", id);
  // now let's search for it
  let near_vector_response = await similaritySearchNearVector(vector);
  console.log("The two closest objects from this vector: ", JSON.stringify(near_vector_response, null, 2));
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

// Create a new collection for your data and vectors
async function createCollection() {
  // Define collection configuration - vectorizer, generative module and data schema
  const schema_definition = {
    class: 'JeopardyQuestion',
    description: 'List of jeopardy questions',
    "moduleConfig": { // configure the vectorizer
      "text2vec-contextionary": { 
           "vectorizeClassName": "false"
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

// import data into your collection
async function importData() {
  // now is time to import some data
  // first, let's grab our Jeopardy Questions from the interwebs

  const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json'
  const jeopardy_questions = await axios.get(url);

  let counter = 0;
  let batcher = client.batch.objectsBatcher();

  for (const dataObj of jeopardy_questions.data) {
    batcher = batcher.withObject({
      class: 'JeopardyQuestion',
      properties: dataObj,
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


