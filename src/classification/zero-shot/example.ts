import weaviate, { ApiKey, WeaviateClient } from 'weaviate-ts-client';
require('dotenv').config();

// Connect to Weaviate

// This is the simplest way to connect to Weaviate
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


async function runFullExample() {
    // comment this the line bellow if you don't want your class to be deleted each run.
    await deleteCollection();
    // lets create and import our collection
    if (await collectionExists() == false) {
        await createCollection(); // note that in this function we specified that
        await importData();
    }else{
        console.log("Class already exists")
    }
    // lets schedule a classification
    await scheduleClassification();
    await showData();
}

async function createCollection() {
    // Define Category Schema.
    const cartegory_schema_definition = {
        "class": 'Category',
        'vectorizer': 'text2vec-cohere',
        "description": 'support ticket',  
        "properties": [
            {
            "dataType": [ 'text'],
            "description": 'name of category',
            "name": 'name',
            }            
        ]
    }
    // let's create the category class
    let new_category_class = await client.schema.classCreator().withClass(cartegory_schema_definition).do();
    console.log('We have a new class for Category!', new_category_class['class']);

    // now let's create the tickets schema
    const ticket_schema_definition = {
        "class": 'Ticket',
        'vectorizer': 'text2vec-cohere',
        "description": 'support ticket',  
        "properties": [
            {
            "name": 'body',
            "description": 'ticket text',
            "dataType": [ 'text'],
            },
            {
            "name": 'ticket_id',
            "description": 'ticket id',
            "dataType": [ 'number'],
            },                
            {
            "name": 'category',
            "description": 'ticket topic',
            "dataType": ["Category"],
            }
        ]
    }
    // let's create the category class
    let new_ticket_class = await client.schema.classCreator().withClass(ticket_schema_definition).do();
    console.log('We have a new class for Ticket!', new_ticket_class['class']);

}


// Import data into your collection
async function importData() {
    let tickets = [
        {"body": "I cannot connect to the internet. My connection is very slow.", "id":1},
        {"body": "I want to put some text in a paper using ink", "id":2},
        {"body": "My computer was very slow, and turned off.", "id":3},
        {"body": "I want to create some spreadsheets, but I cannot open the program", "id":4},
    ];
    let categories = [
        "Network",
        "Printing",
        "Hardware",
        "Software",
    ];

    var batcher = client.batch.objectsBatcher();

    // import tickets
    for (const obj of tickets) {
        batcher = batcher.withObject({
            class: 'Ticket',
            properties: {"body": obj["body"]},
        });
    }
    // insert batched objects
    await batcher.do();
    console.log('Data Imported for tickets', tickets);

    // lets create a new batcher
    var batcher = client.batch.objectsBatcher();
    for (const obj of categories) {
        batcher = batcher.withObject({
            // uncomment bellow if you want to use deterministic ID
            //id: generateUuid5(dataObj.question_id),
            class: 'Category',
            properties: {"name": obj},
        });
    }
    // insert batched objects
    await batcher.do();
    console.log('Data Imported for category', categories);
}

async function scheduleClassification(){
    let response = client.classifications.scheduler()
    .withType("zeroshot")
    .withClassName("Ticket")
    .withClassifyProperties(["category"])
    .withBasedOnProperties(["body"])
    .withWaitForCompletion()
    .do()
    console.log("Classification Scheduled", JSON.stringify(response, null, 2));
}

// Check if collection exists
async function collectionExists() {
    return (await client.schema.exists('Category') && await client.schema.exists('Ticket'));
}

// Helper function to delete the collection
async function deleteCollection() {
    // Delete the collection if it already exists
    if (await collectionExists()) {
        console.log('DELETING')
        await client.schema.classDeleter().withClassName('Category').do();
        await client.schema.classDeleter().withClassName('Ticket').do();

    }
}

async function showData(){
    const response = await client.graphql.get()
    .withClassName("Ticket")
    .withFields("body category{ ... on Category{name}} _additional{classification{basedOn classifiedFields completed id scope}}").do();
    console.log(JSON.stringify(response.data["Get"]["Ticket"], null, 2));
    let tickets = response.data["Get"]["Ticket"]
    for (const obj of tickets) {
        console.log("####")
        console.log(
            "Ticket:", obj["body"],
        )
        console.log(
            "Category:", obj["category"]
        )
    }
}

runFullExample();