## Welcome to our recipe

This recipe is an Agent/ [Agentic RAG](https://weaviate.io/blog/what-is-agentic-rag) implementation that uses [LlamaIndex](https://ts.llamaindex.ai/), [Resend](https://resend.com/), [OpenAI](https://openai.com/) and [Weaviate](https://weaviate.io/) to search a Weaviate collection of Wikipedia posts for a topic of your choosing and then send an email to a user on the topic. 

To run this, add your `OPENAI_API_KEY`, `RESEND_API_KEY` to your .env file. 

## 🌱 Step 1
Load your data with the following command


```bash
npx tsx agents/llamaindex/email-operations/load.ts
```

## 🔍 Step 2
Run your Agent with the following command

```bash
npx tsx agents/llamaindex/email-operations/run.ts
```
