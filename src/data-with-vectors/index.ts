import weaviate, { Collection, CollectionConfigCreate, WeaviateClient } from 'weaviate-client/node';
require('dotenv').config();

// Connect to Weaviate
// The client performs I/O during initialisation so these methods all return promises
// You can either await them or use .then() to handle the result

// This is the simplest way to connect to Weaviate
// const client: WeaviateClient = await weaviate.connectToLocal();
// weaviate.connectToLocal().then((client) => { ... });

class Handler {
  private client: WeaviateClient;
  private collection: Collection;

  private constructor(client: WeaviateClient, collectionName: string) {
    // Define a private constructor so that users of our API have to use the static `use` method
    this.client = client;
    this.collection = client.collections.get(collectionName);
  }

  static async use(collectionName: string) {
    // This is a static method that users of our API can use to create a new instance of the Handler
    // It's a factory method that returns a new instance of the class
    // We use this pattern because the client performs I/O during initialisation so the init method
    // must be async. This is only achievable with a factory method, constructors cannot be private
    const client = await weaviate.connectToLocal({
      httpHost: process.env.WEAVIATE_HOST || 'localhost',
      httpPort: parseInt(process.env.WEAVIATE_PORT || '8080'),
      grpcHost: process.env.WEAVIATE_GRPC_HOST || 'localhost',
      grpcPort: parseInt(process.env.WEAVIATE_GRPC_PORT || '50051'),
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || 'YOUR-WEAVIATE-API-KEY'), // Replace with your Weaviate API key
    });
    return new Handler(client, collectionName);
  }

  private collectionExists() {
    // Check if the collection already exists
    return this.client.collections.exists(this.collection.name);
  }

  private async createCollection() {
    // Create the collection with its specific configuration
    // We don't select a vectoriser in this case, we're bringing our own!
    const config: CollectionConfigCreate = {
      name: this.collection.name,
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
    this.client.collections.create(config).then(() => console.log('Successfully created collection!'));
  }

  private deleteCollection() {
    // Delete the collection if it already exists
    return this.collectionExists().then((exists) =>
      exists ? this.client.collections.delete(this.collection.name) : Promise.resolve()
    );
  }

  public async importData() {
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

    const res = await this.collection.data.insertMany(data);
    if (res.hasErrors) {
      throw new Error(`Failed to import data: ${JSON.stringify(res.errors, null, 2)}`);
    }
  }

  public initCollection(cleanRun: boolean) {
    // Here we initialise the collection
    // We can either delete the collection and create it from scratch
    // Or we can check if it exists and create it if it doesn't
    // The `cleanRun` parameter allows us to choose between these two options
    if (cleanRun) {
      return this.deleteCollection().then(() => this.createCollection());
    } else {
      return this.collectionExists().then((exists) => (exists ? Promise.resolve() : this.createCollection()));
    }
  }

  public async showData() {
    console.log('##### Show ingested objects');
    const queryVector = [-0.012, 0.021, -0.23, -0.42, 0.5, 0.5];

    this.collection.query
      .fetchObjects({
        limit: 4,
        returnProperties: ['title', 'foo'],
        includeVector: true,
      })
      .then((res) => console.log('Fetched objects:', JSON.stringify(res.objects, null, 2)));

    this.collection.query
      .nearVector(queryVector, {
        limit: 2,
        returnProperties: ['title'],
      })
      .then((res) => console.log('Near vector search:', JSON.stringify(res.objects, null, 2)));

    this.collection.query
      .nearVector(queryVector, {
        limit: 2,
        returnProperties: ['title', 'foo'],
        returnMetadata: ['distance'],
        includeVector: true,
      })
      .then((res) => console.log('Near vector search with distance:', JSON.stringify(res.objects, null, 2)));

    const id = await this.collection.query
      .nearVector(queryVector, {
        limit: 2,
        returnProperties: ['title', 'foo'],
        returnMetadata: ['distance'],
        includeVector: true,
        filters: this.collection.filter.byProperty('foo').greaterThan(44),
      })
      .then((res) => {
        console.log('Near vector search with filter:', JSON.stringify(res.objects, null, 2));
        return res.objects[0].uuid;
      });

    this.collection.query
      .nearObject(id, {
        limit: 3,
        returnProperties: ['title', 'foo'],
        returnMetadata: ['distance'],
      })
      .then((res) => console.log('Near object search:', JSON.stringify(res.objects, null, 2)));
  }
}

async function runFullExample() {
  const handler = await Handler.use('MyCollection'); // Create the handler
  const cleanRun = true; // change this to false if you don't want to delete the collection each run
  handler
    .initCollection(cleanRun)
    .then(() => handler.importData())
    .then(() => handler.showData());
  // We use promise chaining here because each step depends on the successful completion of the previous step
  // The data won't import successfully unless the collection has been created
  // Likewise we can't show the data unless it has been imported
  // To ensure there are no race conditions, we chain the promises together guaranteeing that each step is completed before the next one starts
}

runFullExample();
