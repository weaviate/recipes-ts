## Welcome to our recipe

This recipe demonstrates extracting text from a PDF file with [LlamaParse](https://www.llamaindex.ai/llamaparse) and chunking it before indexing it in a Vector Database and running RAG. 

To run this, add your `OPENAI_API_KEY` to your .env file. 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx integrations/llamaindex/llamaparse/load.ts
```

## 🔍 Step 2
Query your data with the following command

```bash
npx tsx integrations/llamaindex/llamaparse/query.ts
```
