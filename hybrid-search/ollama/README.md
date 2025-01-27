## Welcome to our recipe 

[Hybrid Search](https://weaviate.io/blog/hybrid-search-explained) merges semantic and keyword search results to deliver the best of both search methods. In Weaviate, this is done with `query.hybrid`.

Follow [this guide](https://weaviate.io/developers/weaviate/model-providers/ollama) to setup Ollama with Weaviate.

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx hybrid-search/ollama/load.ts
```

## 🔍 Step 2
Query your data with the following command

```bash
npx tsx hybrid-search/ollama/query.ts
```
