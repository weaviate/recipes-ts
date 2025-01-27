## Welcome to our recipe 

[Similarity Search](https://weaviate.io/blog/vector-search-explained) leverages various machine learning models to perform searches based on semantic similarity. In Weaviate, this is done with `query.nearText`, `query.nearObject` and `query.nearVector` operators.

To run this, add you need to have access to [Weaviate Embeddings](https://weaviate.io/blog/introducing-weaviate-embeddings). 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx similarity-search/weaviate/load.ts
```

## 🔍 Step 2
Query your data with the following command

```bash
npx tsx similarity-search/weaviate/query.ts
```
