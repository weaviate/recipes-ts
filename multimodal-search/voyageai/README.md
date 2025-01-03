## Welcome to our recipe

[Multimodal Search](https://weaviate.io/blog/vector-search-explained) leverages various machine learning models to perform searches based on semantic similarity. In Weaviate, this is done with the `query.nearImage`, `query.nearObject` `query.nearObject`, and `query.nearMedia` operators.

To run this, add your `VOYAGEAI_API_KEY` to your .env file. 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx multimodal-search/voyageai/load.ts
```

## 🔍 Step 2
Query your data with the following command

```bash
npx tsx multimodal-search/voyageai/query.ts
```
