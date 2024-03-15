import weaviate, { Collection, CollectionConfigCreate, WeaviateClient } from 'weaviate-client/node';
require('dotenv').config();

// Connect to Weaviate
// The client performs I/O during initialisation so these methods all return promises
// You can either await them or use .then() to handle the result

// This is the simplest way to connect to Weaviate
// const client: WeaviateClient = await weaviate.connectToLocal();
// weaviate.connectToLocal().then((client) => { ... });

// This is how you query objects, specifying the tenant
async function getTenantObjects(collection: Collection, tenant: string) {
  const res = await collection.withTenant(tenant).query.fetchObjects({
    returnProperties: ['question', 'tags'],
  });
  return res.objects;
}

async function runFullExample() {
  const client = await weaviate.connectToLocal({
    httpHost: process.env.WEAVIATE_HOST || 'localhost',
    httpPort: parseInt(process.env.WEAVIATE_PORT || '8080'),
    grpcHost: process.env.WEAVIATE_GRPC_HOST || 'localhost',
    grpcPort: parseInt(process.env.WEAVIATE_GRPC_PORT || '50051'),
    authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || 'YOUR-WEAVIATE-API-KEY'), // Replace with your Weaviate API key
  });
  const cleanRun = true; // change this to false if you don't want to delete the collection each run
  const collection = await initCollection(client, cleanRun).then(addTenants).then(importData);
  // We use promise chaining here because each step depends on the successful completion of the previous step
  // The data won't import successfully unless the collection has been created
  // Likewise we can't show the data unless it has been imported
  // To ensure there are no race conditions, we chain the promises together guaranteeing that each step is completed before the next one starts

  // Search data from tenantA
  const objsA = await getTenantObjects(collection, 'tenantA');
  console.log('Objects listed in tenantA', JSON.stringify(objsA, null, 2));

  // Search data from tenantB
  const objsB = await getTenantObjects(collection, 'tenantB');
  console.log('Objects listed in tenantB', JSON.stringify(objsB, null, 2));

  // Let's retrieve all the tenants from our collection
  const tenants = await collection.tenants.get();
  console.log('Tenants in our class ', JSON.stringify(tenants, null, 2));

  // let's "freeze" our TenantB, so it will not be readable nor writable
  // marking tenants as "COLD" will save resources in Weaviate
  const frozen = await collection.tenants.update({ name: 'tenantB', activityStatus: 'COLD' });
  console.log('TenantB is now frozen', JSON.stringify(frozen, null, 2));

  // lets try
  try {
    await getTenantObjects(collection, 'tenantB');
  } catch (e) {
    console.log('Error: ', e);
  }
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
    name: 'MultiTenancyClass',
    properties: [
      {
        name: 'question_id',
        dataType: 'text',
      },
      {
        name: 'question',
        dataType: 'text',
      },
      {
        name: 'tags',
        dataType: 'text[]',
      },
      {
        name: 'wordCount',
        dataType: 'int',
      },
    ],
    multiTenancy: weaviate.configure.multiTenancy({ enabled: true }),
  };
  // let's create the class
  const collection = await client.collections.create(config);
  console.log(`Successfully created collection: ${collection.name}!`);
  return collection;
}

async function addTenants(collection: Collection) {
  await collection.tenants.create([{ name: 'tenantA' }, { name: 'tenantB' }]);
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
  const dataTenantA = [
    {
      question_id: 'reference-id-1',
      question: 'question from tenantA with tags A, B and C',
      tags: ['tagA', 'tagB', 'tagC'],
      wordCount: 2000,
    },
    {
      question_id: 'reference-id-2',
      question: 'question from tenantA  with tags B and C',
      tags: ['tagB', 'tagC'],
      wordCount: 1001,
    },
  ];
  let dataTenantB = [
    {
      question_id: 'reference-id-3',
      question: 'question from tenantB with tags A and C',
      tags: ['tagA', 'tagC'],
      wordCount: 500,
    },
  ];

  const importA = await collection.withTenant('tenantA').data.insertMany(dataTenantA);
  if (importA.hasErrors) {
    throw new Error(`Failed to import data: ${JSON.stringify(importA.errors, null, 2)}`);
  } else {
    console.log('Data Imported for tenantA');
  }
  const importB = await collection.withTenant('tenantB').data.insertMany(dataTenantB);
  if (importB.hasErrors) {
    throw new Error(`Failed to import data: ${JSON.stringify(importB.errors, null, 2)}`);
  } else {
    console.log('Data Imported for tenantB');
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

runFullExample();
