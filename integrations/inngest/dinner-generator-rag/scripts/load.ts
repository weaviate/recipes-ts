import "dotenv/config";
import weaviate from "weaviate-client";
import fs from "fs/promises";
import path from "path";

async function processJsonFile(
  filePath: string,
  client: any,
  batchSize: number = 100
) {
  const jsonData = JSON.parse(await fs.readFile(filePath, "utf-8"));
  let count = 0;
  let records: any[] = [];

  // Create collection name from filename (without extension)
  const collectionName = path
    .basename(filePath, ".json")
    .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
    .replace(/^[0-9]/, "C$&"); // Prefix with 'C' if starts with number

  const properties = Object.keys(jsonData[0]);

  // Create collection for this file
  const collection = await client.collections.create({
    name: collectionName,
    properties: properties.map((property) => ({
      name: property,
      dataType: "text" as const,
    })),
    vectorizers: [
      weaviate.configure.vectorizer.text2VecOpenAI({
        name: "recipe_vector",
        sourceProperties: properties as any,
      }),
    ],
  });

  for (const record of jsonData) {
    const { id: _, ...cleanRecord } = record;

    records.push({
      class: collectionName,
      properties: cleanRecord,
    });

    count++;

    if (count % batchSize === 0) {
      console.log(
        `Processing batch from ${path.basename(filePath)}: ${
          records.length
        } records`
      );
      await collection.data.insertMany(records);
      records = [];
    }
  }

  // Process any remaining records
  if (records.length > 0) {
    console.log(
      `Processing final batch from ${path.basename(filePath)}: ${
        records.length
      } records`
    );
    await collection.data.insertMany(records);
  }

  return { count, collectionName };
}

async function main() {
  // Environment variables are now properly typed and loaded
  const wcdUrl = process.env.WCD_URL;
  const wcdApiKey = process.env.WCD_API_KEY;

  if (!wcdUrl || !wcdApiKey) {
    throw new Error("Missing required environment variables");
  }

  const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
    authCredentials: new weaviate.ApiKey(wcdApiKey),
    headers: {
      "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY!,
    },
  });

  const dataDir = path.join(__dirname, "../data");
  const files = await fs.readdir(dataDir);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  let totalProcessed = 0;
  const collections: string[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(dataDir, file);
    console.log(`Processing file: ${file}`);
    const { count: processedCount, collectionName } = await processJsonFile(
      filePath,
      client
    );
    totalProcessed += processedCount;
    collections.push(collectionName);
    console.log(
      `Completed processing ${file}: ${processedCount} records into collection "${collectionName}"`
    );
  }

  console.log(`Total records processed across all files: ${totalProcessed}`);
  console.log(`Created collections: ${collections.join(", ")}`);
}

main().catch(console.error);
