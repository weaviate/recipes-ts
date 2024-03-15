import weaviate, { Collection, CollectionConfigCreate, WeaviateClient } from 'weaviate-client/node';
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
  });
  const cleanRun = true; // change this to false if you don't want to delete the collection each run
  initCollection(client, cleanRun).then(importData).then(showData);
  // We use promise chaining here because each step depends on the successful completion of the previous step
  // The data won't import successfully unless the collection has been created
  // Likewise we can't show the data unless it has been imported
  // To ensure there are no race conditions, we chain the promises together guaranteeing that each step is completed before the next one starts
}

function collectionExists(client: WeaviateClient) {
  // Check if the collection already exists
  return client.collections.exists('MyCollection');
}

function getCollection(client: WeaviateClient) {
  return client.collections.get('MyCollection');
}

async function createCollection(client: WeaviateClient): Promise<Collection> {
  // Create the collection with its specific configuration
  // We don't select a vectoriser in this case, we're bringing our own!
  const config: CollectionConfigCreate = {
    name: 'MyCollection',
    description: 'My Collection',
    properties: [
      {
        dataType: 'text',
        // "description": 'name of category',
        name: 'title',
      },
      {
        dataType: 'number',
        // "description": 'name of category',
        name: 'foo',
      },
    ],
    vectorizer: weaviate.configure.vectorizer.none(),
  };
  // let's create the class
  const collection = await client.collections.create(config);
  console.log(`Successfully created collection: ${collection.name}!`);
  return collection;
}

function deleteCollection(client: WeaviateClient) {
  // Delete the collection if it already exists
  return collectionExists(client).then((exists) =>
    exists ? client.collections.delete('MyCollection') : Promise.resolve()
  );
}

async function importData(collection: Collection): Promise<Collection> {
  // Here we import our data using the `.insertMany` method
  // This method batches the data for us in the background
  const data = [
    {
      properties: {
        title: 'First Object',
        foo: 99,
      },
      vector: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    },
    {
      properties: {
        title: 'Second Object',
        foo: 77,
      },
      vector: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    },
    {
      properties: {
        title: 'Third Object',
        foo: 55,
      },
      vector: [0.3, 0.1, -0.1, -0.3, -0.5, -0.7],
    },
    {
      properties: {
        title: 'Fourth Object',
        foo: 33,
      },
      vector: [0.4, 0.41, 0.42, 0.43, 0.44, 0.45],
    },
    {
      properties: {
        title: 'Fifth Object',
        foo: 11,
      },
      vector: [0.5, 0.5, 0, 0, 0, 0],
    },
  ];

  const res = await collection.data.insertMany(data);
  if (res.hasErrors) {
    throw new Error(`Failed to import data: ${JSON.stringify(res.errors, null, 2)}`);
  }
  return collection;
}

function initCollection(client: WeaviateClient, cleanRun: boolean) {
  // Here we initialise the collection
  // We can either delete the collection and create it from scratch
  // Or we can check if it exists and create it if it doesn't
  // The `cleanRun` parameter allows us to choose between these two options
  if (cleanRun) {
    return deleteCollection(client).then(() => createCollection(client));
  } else {
    return collectionExists(client).then((exists) =>
      exists ? Promise.resolve(getCollection(client)) : createCollection(client)
    );
  }
}

async function showData(collection: Collection) {
  console.log('##### Show ingested objects');
  const queryVector = [-0.012, 0.021, -0.23, -0.42, 0.5, 0.5];

  collection.query
    .fetchObjects({
      limit: 4,
      returnProperties: ['title', 'foo'],
      includeVector: true,
    })
    .then((res) => console.log('Fetched objects:', JSON.stringify(res.objects, null, 2)));

  collection.query
    .nearVector(queryVector, {
      limit: 2,
      returnProperties: ['title'],
    })
    .then((res) => console.log('Near vector search:', JSON.stringify(res.objects, null, 2)));

  collection.query
    .nearVector(queryVector, {
      limit: 2,
      returnProperties: ['title', 'foo'],
      returnMetadata: ['distance'],
      includeVector: true,
    })
    .then((res) => console.log('Near vector search with distance:', JSON.stringify(res.objects, null, 2)));

  const id = await collection.query
    .nearVector(queryVector, {
      limit: 2,
      returnProperties: ['title', 'foo'],
      returnMetadata: ['distance'],
      includeVector: true,
      filters: collection.filter.byProperty('foo').greaterThan(44),
    })
    .then((res) => {
      console.log('Near vector search with filter:', JSON.stringify(res.objects, null, 2));
      return res.objects[0].uuid;
    });

  collection.query
    .nearObject(id, {
      limit: 3,
      returnProperties: ['title', 'foo'],
      returnMetadata: ['distance'],
    })
    .then((res) => console.log('Near object search:', JSON.stringify(res.objects, null, 2)));
}

runFullExample();
