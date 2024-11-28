## Welcome to our recipe

[Generative Search](https://weaviate.io/developers/weaviate/search/generative) allows you to improve your search results by piping them through LLM models to perform RAG. In Weaviate, this is done with `generate.nearText`, `generate.nearObject` and `generate.nearVector` operators.

To run this, add your `COHERE_API_KEY` to your .env file. 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx generative-search/cohere/load.ts
```

## 🔍 Step 2
Query your data with the following command

```bash
npx tsx generative-search/cohere/query.ts
```
