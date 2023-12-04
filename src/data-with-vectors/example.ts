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
    await showData();
}

async function createCollection() {
    // Define Category Schema.
    const cartegory_schema_definition = {
        "class": 'MyCollection',
        "description": 'My Collection',  
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

}


// Import data into your collection
async function importData() {
    let data = [
        {
           "title": "First Object",
           "foo": 99, 
           "vector": [0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
        },
        {
           "title": "Second Object",
           "foo": 77, 
           "vector": [0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
        },
        {
           "title": "Third Object",
           "foo": 55, 
           "vector": [0.3, 0.1, -0.1, -0.3, -0.5, -0.7]
        },
        {
           "title": "Fourth Object",
           "foo": 33, 
           "vector": [0.4, 0.41, 0.42, 0.43, 0.44, 0.45]
        },
        {
           "title": "Fifth Object",
           "foo": 11,
           "vector": [0.5, 0.5, 0, 0, 0, 0]
        },
     ]

    var batcher = client.batch.objectsBatcher();

    // import tickets
    for (const obj of data) {
        batcher = batcher.withObject({
            class: 'MyCollection',
            properties: {"title": obj["title"], "foo": obj["foo"]},
            vector: obj["vector"]
        });
    }
    // insert batched objects
    await batcher.do();

}


// Check if collection exists
async function collectionExists() {
    return await client.schema.exists('MyCollection');
}

// Helper function to delete the collection
async function deleteCollection() {
    // Delete the collection if it already exists
    if (await collectionExists()) {
        console.log('DELETING')
        await client.schema.classDeleter().withClassName('MyCollection').do();

    }
}

async function showData(){
    console.log("##### Show ingested objects")
    var response = await client.graphql.get()
    .withClassName("MyCollection")
    .withLimit(4)
    .withFields("title foo _additional{vector}")
    .do();
    console.log(JSON.stringify(response, null, 2));

    console.log("##### Vector Search")
    var response = await client.graphql.get()
    .withClassName("MyCollection")
    .withFields("title")
    .withLimit(2)
    .withNearVector({
        "vector": [-0.012, 0.021, -0.23, -0.42, 0.5, 0.5]
    })
    .do()
    console.log(JSON.stringify(response, null, 2));

    console.log("##### Vector Search, with distance, vector and id")
    var response = await client.graphql.get()
    .withClassName("MyCollection")
    .withFields("title _additional{ distance vector id }")
    .withLimit(2)
    .withNearVector({
        "vector": [-0.012, 0.021, -0.23, -0.42, 0.5, 0.5]
    })
    .do()
    console.log(JSON.stringify(response, null, 2));

    console.log("##### Vector Search, with filter for foo > 44")
    var response = await client.graphql.get()
    .withClassName("MyCollection")
    .withFields("title foo _additional{ distance id }")
    .withWhere({
        "path": ["foo"],
        "operator": "GreaterThan",
        "valueNumber": 44
    })
    .withLimit(2)
    .withNearVector({
        "vector": [-0.012, 0.021, -0.23, -0.42, 0.5, 0.5]
    })
    .do()
    console.log(JSON.stringify(response, null, 2));
    
    // lets get one id from the previous result
    let object_id = response.data["Get"]["MyCollection"][0]["_additional"]["id"]
    console.log("##### Vector Search, with near object")
    var response = await client.graphql.get()
    .withClassName("MyCollection")
    .withFields("title foo _additional{ distance id }")
    .withNearObject({
        "id": object_id
    })
    .withLimit(3)
    .do()
    console.log(JSON.stringify(response, null, 2));
}

runFullExample();