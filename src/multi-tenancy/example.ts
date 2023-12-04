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

// This is how you query objects, specifying the tenant
async function getTenantObjects(tenant: string) {
    return client.graphql
        .get()
        .withFields("question tags")
        .withClassName("MultiTenancyClass")
        .withTenant(tenant) // this how we specify the tenant
        .do();
}

// That will only work when you enable Multitenancy in your class and
// intentionally add tentants to it:
async function createCollection() {
    // Define collection configuration.
    const schema_definition = {
        "class": "MultiTenancyClass",
        "vectorizer": "none",
        'multiTenancyConfig': { 'enabled': true }, // here we enable Multitenancy
        "properties": [
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
    // now, let's add our Tenant to this class
    let tenants = await client.schema
        .tenantsCreator('MultiTenancyClass', [{ name: 'tenantA' }, { name: 'tenantB' }])
        .do();
    console.log('We have added two tenants to our class:', tenants);

}

async function runFullExample() {
    // comment this the line bellow if you don't want your class to be deleted each run.
    await deleteCollection();
    // lets create and import our collection
    if (await collectionExists() == false) {
        await createCollection(); // note that in this function we specified that
        // we want multiTenancyConfig > enabled = true
        // and we also added TenantA and TenantB to our class
        await importData();
    }
    // Search data from tenantA
    let objects_tenantA = await getTenantObjects("tenantA");
    console.log("Objects listed in tenantA", JSON.stringify(objects_tenantA, null, 2));

    // Search data from tenantB
    let objects_tenantB = await getTenantObjects("tenantB");
    console.log("Objects listed in tenantB", JSON.stringify(objects_tenantB, null, 2));

    // Let's list all tenants from our class
    let tenants_in_class = await client.schema
        .tenantsGetter("MultiTenancyClass")
        .do();
    console.log("Tenants in our class ", tenants_in_class);

    // let's "freeze" our TenantB, so it will not be readable nor writable
    // marking tenants as "COLD" will save resources in Weaviate
    let freeze_tenant_b = await client.schema
        .tenantsUpdater(
            "MultiTenancyClass",
            [
                { name: "tenantB", activityStatus: "COLD" }
            ]
        ).do();
    console.log("TenantB should be frozen now ", freeze_tenant_b);

    // lets try
    try {
        await getTenantObjects("tenantB");
    } catch (e) {
        console.log("Error: ", e);

    }

}

runFullExample();

// ------------------------- Helper functions


// Import data into your collection
async function importData() {
    let data_tenantA = [
        { "question_id": "reference-id-1", "question": "question from tenantA with tags A, B and C", "tags": ["tagA", "tagB", "tagC"], "wordCount": 2000 },
        { "question_id": "reference-id-2", "question": "question from tenantA  with tags B and C", "tags": ["tagB", "tagC"], "wordCount": 1001 },
    ];
    let data_tenantB = [
        { "question_id": "reference-id-3", "question": "question from tenantB with tags A and C", "tags": ["tagA", "tagC"], "wordCount": 500 }
    ];

    var batcher = client.batch.objectsBatcher();

    // import tenantA data
    for (const dataObj of data_tenantA) {
        batcher = batcher.withObject({
            // uncomment bellow if you want to use deterministic ID
            //id: generateUuid5(dataObj.question_id),
            class: 'MultiTenancyClass',
            properties: dataObj,
            tenant: "tenantA"
        });
    }
    // insert batched objects
    await batcher.do();
    console.log('Data Imported for tenantA', data_tenantA);

    // lets create a new batcher
    var batcher = client.batch.objectsBatcher();
    // import tenantB data
    for (const dataObj of data_tenantB) {
        batcher = batcher.withObject({
            // uncomment bellow if you want to use deterministic ID
            //id: generateUuid5(dataObj.question_id),
            class: 'MultiTenancyClass',
            properties: dataObj,
            tenant: "tenantB"
        });
    }
    // insert batched objects
    await batcher.do();

    console.log('Data Imported for tenantB', data_tenantB);
}

// Check if collection exists
async function collectionExists() {
    return client.schema.exists('MultiTenancyClass');
}

// Helper function to delete the collection
async function deleteCollection() {
    // Delete the collection if it already exists
    if (await collectionExists()) {
        console.log('DELETING')
        await client.schema.classDeleter().withClassName('MultiTenancyClass').do();

    }
}