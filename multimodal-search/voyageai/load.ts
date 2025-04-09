import weaviate, { WeaviateClient, configure } from 'weaviate-client'
import { pdfToPng } from 'pdf-to-png-converter'
import * as fs from  'fs'
import path from 'path'
import 'dotenv/config'

async function main() {

  const weaviateURL = process.env.WEAVIATE_URL as string
  const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
  const voyageaiKey = process.env.VOYAGEAI_API_KEY as string

  // Step 1: Connect to your Weaviate instance  
  const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
    authCredentials: new weaviate.ApiKey(weaviateKey),
    headers: {  
      'X-VoyageAI-Api-Key': voyageaiKey,  // Replace with your inference API key
    }
  })

  // Delete the "PDFLibrary" collection if it exists
  await client.collections.delete('PDFLibrary');

  if (await client.collections.exists('PDFLibrary') == false) {

    // Step 2: Create a collection with both a vectorizer and generative model
    await client.collections.create({
      name: 'PDFLibrary',
      properties: [{
        name: "pageNumber",
        dataType: configure.dataType.NUMBER,
      },
      {
        name: "pageImage",
        dataType: configure.dataType.BLOB
      }
      ],
      // Define your VoyageAI vectorizer 
      vectorizers: weaviate.configure.vectorizer.multi2VecVoyageAI({
        imageFields: ["pageImage"],
      }),
    });

    try {
      let pdfLibraryCollection = client.collections.use('PDFLibrary');

      // Step 3: Fetch local PDF file
      const pdf = fs.readFileSync(path.join(__dirname, "animals.pdf"));
      const pdfImages = await pdfToPng(pdf);

      let itemsToInsert: Object[] = []

      for (var page of pdfImages) {
        let pdfObject = {
          pageNumber: page.pageNumber,
          pageImage: page.content.toString('base64'),
      }

      // Insert
      let objectToInsert = {
          properties: pdfObject,
      }
  
      // Add object to batching array
      itemsToInsert.push(objectToInsert)
      }

      // Step 4: Bulk insert downloaded data into the "PDFLibrary" collection
      const res =  await pdfLibraryCollection.data.insertMany(itemsToInsert)

      console.log('Data Imported');
    } catch (e) {
      console.error(e);
    }
  }

  await client.close()
}


void main();