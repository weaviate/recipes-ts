import weaviate, { ApiKey, WeaviateClient, generateUuid5 } from 'weaviate-ts-client';
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
    const sentiments_schema_definition = {
        "class": 'Sentiment',
        "vectorizer": "text2vec-openai",
        "description": 'sentiment',  
        "properties": [
            {
            "dataType": [ 'text'],
            "description": 'name of sentiment',
            "name": 'name',
            }            
        ]
    }
    // let's create the sentiment class
    let new_class = await client.schema.classCreator().withClass(sentiments_schema_definition).do();
    console.log('We have a new class for Sentiment!');

    // now let's create the comment schema
    const comment_schema_definition = {
        "class": 'Comment',
        "vectorizer": "text2vec-openai",
        "description": 'comment',  
        "properties": [
            {
            "name": 'body',
            "description": 'comment text',
            "dataType": [ 'text'],
            },
            {
            "name": 'sentiment',
            "description": 'comment sentiment',
            "dataType": ["Sentiment"],
            },
            {
                "name": 'training_data',
                "description": 'is this a training data?',
                "dataType": ["boolean"],
                }            
        ]
    }
    // let's create the category class
    await client.schema.classCreator().withClass(comment_schema_definition).do();
    console.log('We have a new class for Ticket!');

}


// Import data into your collection
async function importData() {
    const training_data = [
        {"sentiment": "positive", "text": "I absolutely love this product!"},
        {"sentiment": "positive", "text": "This is the best day ever!"},
        {"sentiment": "positive", "text": "I can't believe how wonderful this is!"},
        {"sentiment": "positive", "text": "The weather is perfect for a picnic."},
        {"sentiment": "neutral", "text": "The weather today is neither hot nor cold."},
        {"sentiment": "neutral", "text": "I'm having a regular day at work."},
        {"sentiment": "neutral", "text": "The traffic was just as usual this morning."},
        {"sentiment": "neutral", "text": "I'm experiencing a typical weekend."},
        {"sentiment": "negative", "text": "Conflict with friends is bringing me down."},
        {"sentiment": "negative", "text": "The food at that restaurant was terrible!"},
        {"sentiment": "negative", "text": "My new pet is causing me endless trouble."},
        {"sentiment": "negative", "text": "My birthday party was a disaster!"},
        {"sentiment": "negative", "text": "I received bad news from a loved one."},
    ]
    
    const data_to_classify = [
        {"sentiment": "positive", "text": "I'm so grateful for all the support I received."},
        {"sentiment": "positive", "text": "This book is a masterpiece of literature."},
        {"sentiment": "positive", "text": "My family is amazing and supportive."},
        {"sentiment": "positive", "text": "I aced the exam; I'm on cloud nine!"},
        {"sentiment": "positive", "text": "My favorite team won the championship!"},
        {"sentiment": "positive", "text": "The sunset at the beach was breathtaking."},
        {"sentiment": "positive", "text": "I just got a promotion at work! So happy!"},
        {"sentiment": "positive", "text": "Spending time with friends always brightens my day."},
        {"sentiment": "positive", "text": "The food at that restaurant was delicious!"},
        {"sentiment": "positive", "text": "I'm in love with the new puppy we adopted."},
        {"sentiment": "positive", "text": "My birthday party was a blast!"},
        {"sentiment": "positive", "text": "I received a surprise gift from a loved one."},
        {"sentiment": "positive", "text": "Reuniting with an old friend was heartwarming."},
        {"sentiment": "positive", "text": "This movie made me laugh so hard."},
        {"sentiment": "positive", "text": "I reached a personal milestone today!"},
        {"sentiment": "neutral", "text": "My breakfast was plain, but satisfying."},
        {"sentiment": "neutral", "text": "The news headlines are uneventful today."},
        {"sentiment": "neutral", "text": "I'm taking a casual stroll in the park."},
        {"sentiment": "neutral", "text": "I have some standard chores to complete."},
        {"sentiment": "neutral", "text": "The movie I watched was neither good nor bad."},
        {"sentiment": "neutral", "text": "I'm attending a regular meeting this afternoon."},
        {"sentiment": "negative", "text": "I'm feeling really down and frustrated."},
        {"sentiment": "negative", "text": "This day has been a total disaster."},
        {"sentiment": "negative", "text": "I can't believe how awful this situation is."},
        {"sentiment": "negative", "text": "The rainy weather is ruining my plans."},
        {"sentiment": "negative", "text": "I'm so disappointed with the service I received."},
        {"sentiment": "negative", "text": "This book is a waste of time."},
        {"sentiment": "negative", "text": "My family is causing me a lot of stress."},
        {"sentiment": "negative", "text": "I failed the exam; I'm in the dumps."},
        {"sentiment": "negative", "text": "My favorite team lost the championship."},
        {"sentiment": "negative", "text": "The view from the window is depressing."},
        {"sentiment": "negative", "text": "I just got laid off at work! So upset!"},
    ]

    const sentiments = [
        "positive",
        "neutral",
        "negative"
    ]
    var batcher = client.batch.objectsBatcher();

    // import sentiments
    for (const obj of sentiments) {
        batcher = batcher.withObject({
            class: 'Sentiment',
            properties: {"name": obj},
            id: generateUuid5(obj) // we want to define a fixed ID based on obj value
        });
    }
    // insert batched objects
    await batcher.do();
    console.log('Data Imported sentiments', sentiments.length);

    // lets create a new batcher, now to import the trained comments
    var batcher = client.batch.objectsBatcher();
    for (const obj of training_data) {
        batcher = batcher.withObject({
            class: 'Comment',
            properties: {
                "body": obj["text"],
                "training_data": true,
                "sentiment": [{
                    // now we pass the beacon to our sentimento object
                    // note that we defined it's id based on its valaue
                    // so now we can reuse and get the very same id
                    "beacon": `weaviate://localhost/${generateUuid5(obj["sentiment"])}`
                }]
            },
        });
    }
    // insert batched objects
    await batcher.do();
    console.log('Data Imported for training comments', training_data.length);

    // lets create a new batcher, now to import the unclassified comments
    var batcher = client.batch.objectsBatcher();
    for (const obj of data_to_classify) {
        batcher = batcher.withObject({
            class: 'Comment',
            properties: {
                "body": obj["text"],
                "training_data": false
            },
        });
    }
    // insert batched objects
    await batcher.do();
    console.log('Data Imported for unclassified comments ', data_to_classify.length);
}

async function scheduleClassification(){
    let response = await client.classifications.scheduler()
    .withType("knn")
    .withSettings({ k: 3 })
    .withClassName("Comment")
    .withClassifyProperties(["sentiment"])
    .withBasedOnProperties(["body"])
    .withWaitForCompletion()
    //.withWaitTimeout(30 * 1000) // 30 seconds
    .do()
    console.log("Classification Scheduled", JSON.stringify(response, null, 2));
}

// Check if collection exists
async function collectionExists() {
    return (await client.schema.exists('Sentiment') && await client.schema.exists('Comment'));
}

// Helper function to delete the collection
async function deleteCollection() {
    // Delete the collection if it already exists
    if (await collectionExists()) {
        console.log('DELETING')
        await client.schema.classDeleter().withClassName('Sentiment').do();
        await client.schema.classDeleter().withClassName('Comment').do();

    }
}

async function showData(){
    const response = await client.graphql.get()
    .withClassName("Comment")
    .withFields("body training_data sentiment{ ... on Sentiment{name}} _additional{classification{basedOn classifiedFields completed id scope}}").do();
    let comments = response.data["Get"]["Comment"]
    for (const obj of comments) {
        console.log("####")
        console.log(
            "Comment:", obj["body"],
        )
        console.log(
            "Sentiment:", obj["sentiment"]
        )
        console.log(
            "Training Data?:", obj["training_data"]
        )
    }
}

runFullExample();