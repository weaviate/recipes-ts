## Welcome to our recipe

This recipe is an implementation of the [Weaviate Query Agent](https://weaviate.io/developers/agents/query) 

To run this, add your the API key for your embedding model provider to your `.env` file.

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx agents/weaviate/query/load.ts
```

## 🔍 Step 2
Run your Agent with the following command

```bash
npx tsx agents/weaviate/query/run.ts
```
