## Welcome to our recipe

This recipe is an Agent/[Agentic RAG](https://weaviate.io/blog/what-is-agentic-rag) implementation that uses [LlamaIndex](https://ts.llamaindex.ai/), [Vonage](https://www.vonage.fr/), [OpenAI](https://openai.com/) and [Weaviate](https://weaviate.io/) to search a Weaviate collection of conference talks for a topic of your choosing and then make a call to a user on the topic. 

To run this, add your `OPENAI_API_KEY`, `VONAGE_API_KEY` to your .env file. 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx agents/llamaindex/call-operations/load.ts
```

## 🔍 Step 2
Run your Agent with the following command

```bash
npx tsx agents/llamaindex/call-operations/run.ts
```