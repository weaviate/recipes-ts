## Welcome to our recipe

[Hybrid Search](https://weaviate.io/blog/hybrid-search-explained) merges semantic and keyword search results to deliver the best of both search methods. In Weaviate, this is done with `query.hybrid`.

To run this, add your `COHERE_API_KEY` to your .env file. 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx hybrid-search/cohere/load.ts
```

## 🔍 Step 2
Query your data with the following command

```bash
npx tsx hybrid-search/cohere/query.ts
```
