import weaviate, { Collection, WeaviateClient } from 'weaviate-client/node';
require('dotenv').config();

// Connect to Weaviate
// The client performs I/O during initialisation so these methods all return promises
// You can either await them or use .then() to handle the result

// This is the simplest way to connect to Weaviate
// const client: WeaviateClient = await weaviate.connectToLocal();
// weaviate.connectToLocal().then((client) => { ... });

async function runFullExample() {
  const handler = await Handler.use(); // Create the handler
  const cleanRun = true; // change this to false if you don't want to delete the collection each run
  handler
    .initCollection(cleanRun)
    .then(() => handler.importData())
    .then(async () => {
      await handler.perObjectRAG(
        'Elephants',
        'Turn the following Jeopardy question into a Facebook Ad: {question}.'
      );
      await handler.groupedRAG(
        'Animals',
        'Explain why these Jeopardy questions are under the Animals category.'
      );
    });
  // We use promise chaining here because each step depends on the successful completion of the previous step
  // The data won't import successfully unless the collection has been created
  // Likewise we can't show the data unless it has been imported
  // To ensure there are no race conditions, we chain the promises together guaranteeing that each step is completed before the next one starts
}

class Handler {
  private client: WeaviateClient;
  private collection: Collection;

  private constructor(client: WeaviateClient) {
    // Define a private constructor so that users of our API have to use the static `use` method
    this.client = client;
    this.collection = client.collections.get('JeopardyQuestions');
  }

  static async use() {
    // This is a static method that users of our API can use to create a new instance of the Handler
    // It's a factory method that returns a new instance of the class
    // We use this pattern because the client performs I/O during initialisation so the init method
    // must be async. This is only achievable with a factory method, constructors cannot be async
    const client = await weaviate.connectToLocal({
      httpHost: process.env.WEAVIATE_HOST || 'localhost',
      httpPort: parseInt(process.env.WEAVIATE_PORT || '8080'),
      grpcHost: process.env.WEAVIATE_GRPC_HOST || 'localhost',
      grpcPort: parseInt(process.env.WEAVIATE_GRPC_PORT || '50051'),
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || 'YOUR-WEAVIATE-API-KEY'), // Replace with your Weaviate API key
      headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY as string }, // Replace with your inference API key
    });
    return new Handler(client);
  }

  private collectionExists() {
    // Check if the collection already exists
    return this.client.collections.exists(this.collection.name);
  }

  private createCollection() {
    // let's create the class
    return this.client.collections
      .create({
        name: this.collection.name,
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
        generative: weaviate.configure.generative.openAI(),
        vectorizer: weaviate.configure.vectorizer.text2VecOpenAI(),
      })
      .then(() => console.log(`Successfully created collection: ${this.collection.name}!`));
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
    // first, let's grab our Jeopardy Questions from the interwebs
    const url =
      'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json';
    const jeopardyRes = await fetch(url);
    const data = await jeopardyRes.json();
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
      console.log('Cleaning and creating collection anew');
      return this.deleteCollection().then(() => this.createCollection());
    } else {
      console.log('Creating collection if it does not exist');
      return this.collectionExists().then((exists) => (exists ? Promise.resolve() : this.createCollection()));
    }
  }

  public perObjectRAG(query: string, prompt: string) {
    // run RAG/Generative Search query with a prompt to apply to each object returned by the near text query
    return this.collection.generate
      .nearText(query, {
        singlePrompt: prompt,
      })
      .then((res) => res.objects.map((o) => o.generated))
      .then((generated) => JSON.stringify(generated, null, 2))
      .then((stringified) => console.log(`Single Prompt response for query (${query})`, stringified));
  }

  public groupedRAG(query: string, prompt: string, properties?: string[]) {
    // run RAG/Generative Search query with a prompt to apply to all the objects returned by the near text query
    return this.collection.generate
      .nearText(query, {
        groupedTask: prompt,
        groupedProperties: properties,
      })
      .then((res) => res.generated)
      .then((generated) => JSON.stringify(generated, null, 2))
      .then((stringified) => console.log(`Grouped Task response for query (${query})`, stringified));
  }
}

runFullExample();
