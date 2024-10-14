import weaviate, { WeaviateClient } from 'weaviate-client'
import axios from 'axios';
require('dotenv').config();

async function main() {

  const client = await weaviate.connectToWeaviateCloud(process.env.WEAVIATE_URL || '',
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_ADMIN_KEY || ''),
      headers: {
        'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',  // Replace with your inference API key
      }
    }
  )

  await client.collections.delete('JeopardyQuestion');

  if (await client.collections.exists('JeopardyQuestion') == false) {
    // lets create and import our collection
    await client.collections.create({
      name: 'JeopardyQuestion',
      properties: [
        {
          name: 'Category',
          dataType: 'text' as const,
          description: 'Category of the question',
        },
        {
          name: 'Question',
          dataType: 'text' as const,
          description: 'The question',
        },
        {
          name: 'Answer',
          dataType: 'text' as const,
          description: 'The answer',
        }
      ],
      vectorizers: weaviate.configure.vectorizer.text2VecOpenAI(),
      generative: weaviate.configure.generative.openAI()
    });

    try {
      let jeopardyCollection = client.collections.get('JeopardyQuestion');

      const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json'
      const jeopardyQuestions = await axios.get(url);

      const res = await jeopardyCollection.data.insertMany(jeopardyQuestions.data)

      console.log('Data Imported');
    } catch (e) {
      console.error(e);
    }
  }
}

void main();
