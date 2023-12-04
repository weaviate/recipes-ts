import weaviate, { ApiKey, WeaviateClient, generateUuid5 } from 'weaviate-ts-client';
require('dotenv').config();

// Connect to Weaviate

// This is the simplest way to connect to a local Weaviate
// const client: WeaviateClient = weaviate.client({
//     scheme: 'http',
//     host: 'localhost:8080',
// });

// in order to work with ENVIRONMENT VARIABLES and use an APIKEY, you can use
const client: WeaviateClient = weaviate.client({
    scheme: process.env.WEAVIATE_SCHEME_URL || 'http', // Replace with https if using WCS
    host: process.env.WEAVIATE_URL || 'localhost:8080', // Replace with your Weaviate URL
    apiKey: new ApiKey(process.env.WEAVIATE_API_KEY || 'YOUR-WEAVIATE-API-KEY'), // Replace with your Weaviate API key
});

// ContainsAll query
async function searchAll(items: string[], path: string[]) {
    return client.graphql
        .get()
        .withClassName("Document")
        .withFields("question tags question_id")
        .withWhere({
            operator: 'ContainsAll',
            path: path,
            valueTextArray: items,
        }).do();
}

// ContainsAny query
async function searchAny(tags: string[], path: string[]) {
    return client.graphql
        .get()
        .withClassName("Document")
        .withFields("question tags question_id")
        .withWhere({
            operator: 'ContainsAny',
            path: path,
            valueTextArray: tags,
        }).do();
}

async function runFullExample() {
    // comment this the line bellow if you don't want your class to be deleted each run.
    await deleteCollection();
    // lets create and import our collection
    if (await collectionExists() == false) {
        await createCollection();
        await importData();
    }

    // ContainsAll examples for tags
    const docs_tags_bc = await searchAll(["tagB", "tagC"], ["tags"]);
    console.log("Docs that contains ALL provided tags: tagB and tagC:", JSON.stringify(docs_tags_bc, null, 2));

    const docs_tags_ac = await searchAll(["tagA", "tagC"], ["tags"]);
    console.log("Docs that contains ALL provided tags: tagA and tagC:", JSON.stringify(docs_tags_ac, null, 2));

    const docs_tags_ad = await searchAll(["tagA", "tagD"], ["tags"]);
    // this will return an empty response, as there is no document with tagD
    console.log("Docs that contains ALL provided tags: tagA and tagD:", JSON.stringify(docs_tags_ad, null, 2));

    // ContainsAny example tags
    const docs_tags_AW = await searchAny(["tagA", "tagW"], ["tags"]);
    console.log("Docs that contains ANY of the tags: tagA and tagW:", JSON.stringify(docs_tags_AW, null, 2));

    // TODO: check better way for this kind of search
    // If you want to get the Documents that has exactly tagB and tagC, 
    // You need to use Equal, for example
    // const exact_tags = client.graphql
    //     .get()
    //     .withClassName("Document")
    //     .withFields("question tags question_id")
    //     .withWhere({
    //         operator: 'Equal',
    //         path: ["tags"],
    //         valueTextArray: ["tagB", "tagC"],
    //     }).do();
    // console.log("Docs with exactly tagB and tagC, using the Equal operator", exact_tags)

}

runFullExample();

// ------------------------- Helper functions
// Create a new collection for your data and vectors
async function createCollection() {
    // Define collection configuration.
    const schema_definition = {
        "class": "Document",
        "vectorizer": "none",
        "properties": [
            {
                "name": "question_id",
                "dataType": ["text"]
            },
            {
                "name": "question",
                "dataType": ["text"]
            },
            {
                "name": "tags",
                "dataType": ["text[]"], // a list of texts
            }
        ],
    }
    // let's create it
    let new_class = await client.schema.classCreator().withClass(schema_definition).do();
    console.log('We have a new class!', new_class['class']);
}

// Import data into your collection
async function importData() {
    let data = [
        { "question_id": "reference-id-1", "question": "question with tags A, B and C", "tags": ["tagA", "tagB", "tagC"], "wordCount": 2000 },
        { "question_id": "reference-id-2", "question": "question with tags B and C", "tags": ["tagB", "tagC"], "wordCount": 1001 },
        { "question_id": "reference-id-3", "question": "question with tags A and C", "tags": ["tagA", "tagC"], "wordCount": 500 }
    ]

    console.log("Let's import this data", JSON.stringify(data, null, 2))
    let batcher = client.batch.objectsBatcher();

    for (const dataObj of data) {
        batcher = batcher.withObject({
            //id: generateUuid5(dataObj.question),
            class: 'Document',
            properties: dataObj,
        });
    }
    // insert batched objects
    await batcher.do();

    console.log('Data Imported');
}

// Check if collection exists
async function collectionExists() {
    return client.schema.exists('Document');
}

// Helper function to delete the collection
async function deleteCollection() {
    // Delete the collection if it already exists
    if (await collectionExists()) {
        console.log('DELETING');
        await client.schema.classDeleter().withClassName('Document').do();
    }
}