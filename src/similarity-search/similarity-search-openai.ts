import weaviate, { WeaviateNextClient } from 'weaviate-client/node'
import axios from 'axios';
require('dotenv').config();

// Connect to Weaviate



// in order to work with ENVIRONMENT VARIABLES and use an APIKEY, you can use
const client: WeaviateNextClient = weaviate.client({
  rest: {
    secure: false,
    host: 'localhost',
    port: 8080,
  },
  grpc: {
    secure: false,
    host: 'localhost',
    port: 50051,
  },
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY,  // Replace with your inference API key
  }
});



async function similaritySearchNearText(concepts: string[]) {

  const jeopardyCollection = await client.collections.get('JeopardyQuestion');

    return await jeopardyCollection.query.nearText(['question about animals'])
}

// async function similaritySearchNearObject(id: string) {
//   return await client
//     .graphql
//     .get()
//     .withClassName("JeopardyQuestion")
//     .withFields("question answer category _additional { distance id }")
//     .withNearObject({ id: id })
//     .withLimit(2)
//     .do();
// }

// async function similaritySearchNearVector(vector: number[]) {
//   return await client
//     .graphql
//     .get()
//     .withClassName("JeopardyQuestion")
//     .withFields("question answer category _additional { distance id }")
//     .withNearVector({ vector: vector })
//     .withLimit(2)
//     .do();
// }

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
  let nearTextResponse = await similaritySearchNearText(concepts);
  console.log("Near Text objects for:", concepts, JSON.stringify(nearTextResponse, null, 2));

// Near Object example
// lets store the id of our first match

  // let top_match_id = near_text_response.data["Get"]["JeopardyQuestion"][0]["_additional"]["id"];

// lets search the two elements closests to our top object

  // let near_object_response = await similaritySearchNearObject(top_match_id);
  // console.log("Closest 2 objects to id:", top_match_id, JSON.stringify(near_object_response, null, 2));

// now let's search the nearest objects close to a vector
// first, let's grab a vector

  // let with_vector_query = await client
  //   .graphql
  //   .get()
  //   .withClassName("JeopardyQuestion")
  //   .withFields("_additional { vector id }")
  //   .withNearText({ "concepts": ["big sized mammals"] })
  //   .withLimit(2)
  //   .do();
  // let vector = with_vector_query.data["Get"]["JeopardyQuestion"][0]["_additional"]["vector"];
  // let id = with_vector_query.data["Get"]["JeopardyQuestion"][0]["_additional"]["id"];
  // console.log("This is our vector (truncated)", vector.slice(0, 10), "...");
  // console.log("It has this ID:", id);

// now let's search for it

//   let near_vector_response = await similaritySearchNearVector(vector);
//   console.log("The two closest objects from this vector: ", JSON.stringify(near_vector_response, null, 2));
// }
}

runFullExample();

// ------------------------- Helper functions

// Helper function to check if collection exists
async function collectionExists() {
  return client.collections.exists('JeopardyQuestion');
}

// Helper function to delete the collection
async function deleteCollection() {
  // Delete the collection if it already exists
  if (await collectionExists()) {
    console.log('DELETING');
    // await client.collections.classDeleter().withClassName('JeopardyQuestion').do();
    await client.collections.delete('JeopardyQuestion');
  }
}

// Create a new collection for your data and vectors
async function createCollection() {
  // Define collection configuration - vectorizer, generative module and data schema
  const schemaDefinition = {
    name: 'JeopardyQuestion',
    properties: [
      {
        name: 'Category',
        dataType: 'text',
        description: 'Category of the question',
      },
      {
        name: 'Question',
        dataType: 'text',
        description: 'The question',
      },
      {
        name: 'Answer',
        dataType: 'text',
        description: 'The answer',
      }
    ]
  }

  // let newClassTwo = await client.collections.create(schemaDefinition)

  // let's create it
  let newClass = await client.collections.create({
    name: 'JeopardyQuestion',
    properties: [
      {
        name: 'Category',
        dataType: 'text',
        description: 'Category of the question',
      },
      {
        name: 'Question',
        dataType: 'text',
        description: 'The question',
      },
      {
        name: 'Answer',
        dataType: 'text',
        description: 'The answer',
      }
    ],
    // vectorizer: weaviate.configure.vectorizer.text2VecOpenAI,
    generative: weaviate.configure.generative.openAI,

  })


  console.log('We have a new class!', newClass['name']);
}

// import data into your collection
async function importData() {
  // now is time to import some data
  // first, let's grab our Jeopardy Questions from the interwebs
  let jeopardyCollection = await client.collections.get('JeopardyQuestion');

  const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json'
  const jeopardyQuestions = await axios.get(url);

  const res = await jeopardyCollection.data.insertMany(jeopardyQuestions.data)
  console.log('Data Inserted', res);

  console.log('Data Imported');

  const text = await jeopardyCollection.query.bm25('elephant', {
    returnProperties: ['question', 'answer'],
    limit: 2, 
  })
  console.log('query response', text.objects)
}