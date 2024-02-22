import weaviate, { ApiKey, ConnectToWCSOptions, WeaviateNextClient } from 'weaviate-client/node'
import axios from 'axios';
require('dotenv').config();

// Connect to Weaviate

async function connectToWeaviateWithWCS() {
  return await weaviate.connectToWCS(
    process.env.WEAVIATE_URL || '',
    {
      authCredentials: new ApiKey(process.env.WEAVIATE_API_KEY || ''),
      headers: {
        'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',  // Replace with your inference API key
      }
    } // ⭐️ here, 💚
  )
}

async function connectToLocalWeaviate() {
  return await weaviate.client({
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
}

async function createBasicCollection(client: WeaviateNextClient) {
  const newCollection = await client.collections.create({
    name: 'JeopardyQuestion',
    vectorizer: weaviate.configure.vectorizer.text2VecOpenAI()
  })
}

async function createCollectionWithProperties(client: WeaviateNextClient) {
  const newCollection = await client.collections.create({
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
    vectorizer: weaviate.configure.vectorizer.text2VecOpenAI(),
    generative: weaviate.configure.generative.openAI(),

  })
}

async function insertSingleObject(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');
  const data = {
    "Category": "Animals",
    "Question": "What is the largest animal?",
    "Answer": "The largest animal is the elephant.",
  }

  const result = await myCollection.data.insert(data)

}

async function insertMultipleObjects(client: WeaviateNextClient) {
  let jeopardyCollection = await client.collections.get('JeopardyQuestion');

  const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json'
  const jeopardyQuestions = await axios.get(url);

  const result = await jeopardyCollection.data.insertMany(jeopardyQuestions.data)

}

async function deleteObject(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');
  const id = "23223801-974e-480a-b4a1-0e07abf1b1c2"
  const result = await myCollection.data.delete(id)


}

async function nearTextSearch(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');

  const result = await myCollection.query.nearText(['question about animals'])
}

async function nearTextSearchWithFilter(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');

  const result = await myCollection.query.nearText(['question about animals'],
    {
      filters: client.collections.get('JeopardyQuestion').filter.byProperty('animals').equal('elephant'),
    })

}

async function bm25KeywordSearchwithReturnProperties(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');

  const text = await myCollection.query.bm25('elephant', {
    returnProperties: ['question', 'answer'],
    limit: 2, 
  })
}

async function nearObjectSearch(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');
  const weaviateObject = "23223801-974e-480a-b4a1-0e07abf1b1c2"
  const result = await myCollection.query.nearObject(weaviateObject)
}

async function nearVectorSearch(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');
  const weaviateVector = [
    0.01598541997373104,   0.008006020449101925,   0.007247345056384802,
   -0.03604372963309288,  -0.002450720639899373,   0.017489461228251457,
 0.00022731140779796988,   -0.02079036273062229,  -0.009203928522765636,
   -0.02771161124110222 ]
  const result = await myCollection.query.nearVector(weaviateVector)
}

async function hybridSearch(client: WeaviateNextClient) {
  const myCollection = await client.collections.get('JeopardyQuestion');
  const result = await myCollection.query.hybrid("african elephant in savanna")
}

async function generativeSearch(client: WeaviateNextClient) {
  const myCollection = client.collections.get('JeopardyQuestion');
  const result = await myCollection.generate.nearText("african elephant in savanna",{
    singlePrompt: "tell me a quick story about this {question} or {answer}",
  })
  return result
}

async function similaritySearchNearText(concepts: string[], client: WeaviateNextClient) {

  const jeopardyCollection = client.collections.get('JeopardyQuestion');
  return await jeopardyCollection.query.nearText(['question about animals'])
}

async function runFullExample() {

  const client = await connectToWeaviateWithWCS()
  // comment this the line bellow if you don't want your class to be deleted each run.

  await deleteCollection(client);
  if (await collectionExists(client) == false) {
    // lets create and import our collection
    await createCollection(client);
    await importData(client);
  }
  // Near Text example

  let concepts = ["question about animals"];
  let nearTextResponse  = await similaritySearchNearText(concepts, client);
  console.log("Near Text objects for:", concepts, JSON.stringify(nearTextResponse, null, 2));


  let generatedConcept = await generativeSearch(client);
  console.log("Generated Concept:", generatedConcept);
}

runFullExample();

// ------------------------- Helper functions

// Helper function to check if collection exists
async function collectionExists(client: WeaviateNextClient) {
  return client.collections.exists('JeopardyQuestion');
}

// Helper function to delete the collection
async function deleteCollection(client: WeaviateNextClient) {
  // Delete the collection if it already exists
  if (await collectionExists(client)) {
    console.log('DELETING');
    // await client.collections.classDeleter().withClassName('JeopardyQuestion').do();
    await client.collections.delete('JeopardyQuestion');
  }
}

// Create a new collection for your data and vectors
async function createCollection(client: WeaviateNextClient) {
  // Define collection configuration - vectorizer, generative module and data schema
  const schemaDefinition = {
    name: 'JeopardyQuestion',
    properties: [
      {
        name: 'Category',
        dataType: 'text' as const,
        description: 'Category of the question',
      },
      {
        name: 'Question',
        dataType: 'text' as const,
        description: 'The question',
      },
      {
        name: 'Answer',
        dataType: 'text' as const,
        description: 'The answer',
      }
    ],
    vectorizer: weaviate.configure.vectorizer.text2VecOpenAI(),
    generative: weaviate.configure.generative.openAI()

  }

  const newCollection = await client.collections.create(schemaDefinition) 
  console.log('We have a new class!', newCollection['name']);
}

// import data into your collection
async function importData(client: WeaviateNextClient) {
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
    includeVector: true,
  })
  console.log('query response', text.objects)
}

