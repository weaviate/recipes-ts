import weaviate, { Collection, WeaviateClient } from 'weaviate-client/node';
require('dotenv').config();

// Connect to Weaviate
// The client performs I/O during initialisation so these methods all return promises
// You can either await them or use .then() to handle the result

// This is the simplest way to connect to Weaviate
// const client: WeaviateClient = await weaviate.connectToLocal();
// weaviate.connectToLocal().then((client) => { ... });

async function runFullExample() {
  const client = await weaviate.connectToLocal({
    httpHost: process.env.WEAVIATE_HOST || 'localhost',
    httpPort: parseInt(process.env.WEAVIATE_PORT || '8080'),
    grpcHost: process.env.WEAVIATE_GRPC_HOST || 'localhost',
    grpcPort: parseInt(process.env.WEAVIATE_GRPC_PORT || '50051'),
    authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || 'YOUR-WEAVIATE-API-KEY'), // Replace with your Weaviate API key
    headers: { 'X-Palm-Api-Key': process.env.PALM_API_KEY as string }, // Replace with your inference API key
  });
  const cleanRun = true; // change this to false if you don't want to delete the collection each run
  initCollection(client, cleanRun)
    .then(importData)
    .then(async (collection) => {
      await perObjectRAG(
        collection,
        'Elephants',
        'Turn the following Jeopardy question into a Facebook Ad: {question}.'
      );
      await groupedRAG(
        collection,
        'Animals',
        'Explain why these Jeopardy questions are under the Animals category.'
      );
    });
  // We use promise chaining here because each step depends on the successful completion of the previous step
  // The data won't import successfully unless the collection has been created
  // Likewise we can't show the data unless it has been imported
  // To ensure there are no race conditions, we chain the promises together guaranteeing that each step is completed before the next one starts
}

////// Helper functions for runFullExample //////

function collectionExists(client: WeaviateClient): Promise<boolean> {
  // Check if the collection already exists
  return client.collections.exists('JeopardyQuestions');
}

function getCollection(client: WeaviateClient): Collection {
  return client.collections.get('JeopardyQuestions');
}

async function createCollection(client: WeaviateClient): Promise<Collection> {
  // let's create the class
  const collection = await client.collections.create({
    name: 'JeopardyQuestions',
    properties: [
      {
        name: 'category',
        dataType: 'text',
      },
      {
        name: 'question',
        dataType: 'text',
      },
      {
        name: 'answer',
        dataType: 'text',
      },
    ],
    generative: weaviate.configure.generative.palm({
      projectId: 'YOUR-GOOGLE-CLOUD-PROJECT-ID', // Only required if using Vertex AI. Replace with your value: (e.g. "cloud-large-language-models")
      apiEndpoint: 'YOUR-API-ENDPOINT', // Optional. Defaults to "us-central1-aiplatform.googleapis.
      modelId: 'YOUR-GOOGLE-CLOUD-MODEL-ID', // Optional. Defaults to `"chat-bison"` for Vertex AI and `"chat-bison-001"` for MakerSuite.
    }),
    vectorizer: weaviate.configure.vectorizer.text2VecPalm({
      projectId: 'YOUR-GOOGLE-CLOUD-PROJECT-ID', // Only required if using Vertex AI. Replace with your value: (e.g. "cloud-large-language-models")
      apiEndpoint: 'YOUR-API-ENDPOINT', // Optional. Defaults to "us-central1-aiplatform.googleapis.
      modelId: 'YOUR-GOOGLE-CLOUD-MODEL-ID', // Optional. Defaults to `"chat-bison"` for Vertex AI and `"chat-bison-001"` for MakerSuite.
    }),
  });
  console.log(`Successfully created collection: ${collection.name}!`);
  return collection;
}

function deleteCollection(client: WeaviateClient) {
  // Delete the collection if it already exists
  return collectionExists(client).then((exists) =>
    exists ? client.collections.delete('JeopardyQuestions') : Promise.resolve()
  );
}

async function importData(collection: Collection): Promise<Collection> {
  // Here we import our data using the `.insertMany` method
  // This method batches the data for us in the background
  // first, let's grab our Jeopardy Questions from the interwebs
  const url =
    'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json';
  const jeopardyRes = await fetch(url);
  const data = await jeopardyRes.json();
  const res = await collection.data.insertMany(data);
  if (res.hasErrors) {
    throw new Error(`Failed to import data: ${JSON.stringify(res.errors, null, 2)}`);
  }
  return collection;
}

function initCollection(client: WeaviateClient, cleanRun: boolean): Promise<Collection> {
  // Here we initialise the collection
  // We can either delete the collection and create it from scratch
  // Or we can check if it exists and create it if it doesn't
  // The `cleanRun` parameter allows us to choose between these two options
  if (cleanRun) {
    console.log('Cleaning and creating collection anew');
    return deleteCollection(client).then(() => createCollection(client));
  } else {
    console.log('Creating collection if it does not exist');
    return collectionExists(client).then((exists) =>
      exists ? Promise.resolve(getCollection(client)) : createCollection(client)
    );
  }
}

function perObjectRAG(collection: Collection, query: string, prompt: string) {
  // run RAG/Generative Search query with a prompt to apply to each object returned by the near text query
  return collection.generate
    .nearText(query, {
      singlePrompt: prompt,
    })
    .then((res) => res.objects.map((object) => object.generated))
    .then((generated) => JSON.stringify(generated, null, 2))
    .then((stringified) => console.log(`Single Prompt response for query (${query})`, stringified));
}

function groupedRAG(collection: Collection, query: string, prompt: string, properties?: string[]) {
  // run RAG/Generative Search query with a prompt to apply to all the objects returned by the near text query
  return collection.generate
    .nearText(query, {
      groupedTask: prompt,
      groupedProperties: properties,
    })
    .then((res) => res.generated)
    .then((generated) => JSON.stringify(generated, null, 2))
    .then((stringified) => console.log(`Grouped Task response for query (${query})`, stringified));
}

runFullExample();
