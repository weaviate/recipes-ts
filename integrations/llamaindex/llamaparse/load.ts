import weaviate, { WeaviateClient } from 'weaviate-client'
import { LlamaParseReader } from 'llamaindex'
import { fileURLToPath } from 'url';
import { SentenceSplitter } from "llamaindex";
import path from 'path';
import 'dotenv/config';

async function main() {

    const weaviateURL = process.env.WEAVIATE_URL as string
    const weaviateKey = process.env.WEAVIATE_ADMIN_KEY as string
    const openaiKey = process.env.OPENAI_API_KEY as string

    // Step 1: Connect to your Weaviate instance  
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
        headers: {
            'X-OpenAI-Api-Key': openaiKey,  // Replace with your inference API key
        }
    })

    await client.collections.delete('PDFStore');

    if (await client.collections.exists('PDFStore') == false) {

        // Step 2: Create a collection with both a vectorizer and generative model
        await client.collections.create({
            name: 'PDFStore',
            // Define your OpenAI vectorizer and generative model  
            vectorizers: weaviate.configure.vectorizer.text2VecOpenAI({
                sourceProperties: ['title', 'text']
            }),
            generative: weaviate.configure.generative.openAI()
        });

        try {
            let pdfStoreCollection = client.collections.use('PDFStore');

            // Step 3: Fetch local PDF file
            const __filename = fileURLToPath(import.meta.url); 
            const __dirname = path.dirname(__filename);

            const pdf = path.join(__dirname, "./canada.pdf")

            // Set up the LlamaParse Reader
            const reader = new LlamaParseReader({ resultType: "text" });

            // Parse the document
            const documents = await reader.loadData(pdf);

            // Chunk the document
            const splitter = new SentenceSplitter({ chunkSize: 100, chunkOverlap: 6 });
            let itemsToInsert: Object[] = []

            for (const [pageIndex, page] of documents.entries()) {
                const texts = splitter.splitText(page.text);

                for (const [index, sentence] of texts.entries()) {
                    let pdfObject = {
                        pageNumber: pageIndex+1,
                        chunkID: index,
                        chunk: sentence,
                        fileName: page.metadata.file_name
                    }

                    let objectToInsert = {
                        properties: pdfObject,
                    }

                    itemsToInsert.push(objectToInsert)
                }
            }

            // Step 4: Bulk insert downloaded data into the "PDFStore" collection
            await pdfStoreCollection.data.insertMany(itemsToInsert)

            console.log('Data Imported!');
        } catch (e) {
            console.error(e);
        }
    }

    await client.close()
}

void main();