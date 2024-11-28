## Welcome to our recipe

[Similarity Search](https://weaviate.io/blog/vector-search-explained) leverages various machine learning models to perform searches based on semantic similarity. In Weaviate, this is done with `query.nearText`, `query.nearObject` and `query.nearVector` operators.

To run this, add your `GOOGLE_API_KEY` to your .env file. 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx similarity-search/google/load.ts
```

## 🔍 Step 2
Query your data with the following command

```bash
npx tsx similarity-search/google/query.ts
```
