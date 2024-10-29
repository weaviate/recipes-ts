# Welcome to the Weaviate Javascript recipes repository!
This repo covers end-to-end examples of the various features and integrations with [Weaviate](www.weaviate.io) for Javascript Developers! 

⚠️ Before getting started, you need to follow the installation **Setup Instructions** detailed in the setup section of this document. You will need the setup completed to successfully run the recipes.

<details>
  <summary>Setup Instructions 🚀 </summary>
  
  ### 1. Install npm packages
Clone this repository, and install dependencies

```
npm install
```

Alternatively, you can run these recipes on [Stackblitz]()
### 2. Choose where to run Weaviate

#### 2.1 Run in Weaviate Cloud Service

Head to [WCS](https://console.weaviate.cloud/), where you can easily create a free sandbox cluster. 
Take note of your `cluster URL` and `apiKey`

#### 2.2 Run locally using Docker
Considering you already have docker installed, you can run:
```
docker compose up -d
``` 
**IMPORTANT:** make sure to define the environment variables before running Docker

### 3. Define environment variables
[Get your Open AI key here](https://platform.openai.com/account/api-keys)
[Get your Cohere key here](https://dashboard.cohere.com/api-keys)
[Get your Anthropic key here]()
[Get your Google key here]()
[Get your Mistral key here]()
[Get your HuggingFace key here]()

```
cp .env_example .env
```

If you are using docker, you can keep it like this:
```
WEAVIATE_SCHEME_URL=http
WEAVIATE_URL=localhost:8080
OPENAI_API_KEY=<your openai apikey>
COHERE_API_KEY=<your cohere apikey>
```
if you are using WCS, you can keep it like this:

```
WEAVIATE_URL=<https://yourcluster.weaviate.network>
WEAVIATE_ADMIN_KEY=<your_apikey>
OPENAI_API_KEY=<your openai apikey>
COHERE_API_KEY=<your cohere apikey>
HUGGING_FACE_API_KEY=<your huggingface apikey>
GOOGLE_API_KEY=<your google apikey>
ANTHROPIC_API_KEY=<your anthropic apikey>
MISTRAL_API_KEY=<your mistral apikey>
```

### 4. Run a Recipe!
Navigate to the folder containing the concept (e.g. generative search) and provider (e.g. Cohere) you want to use and follow the instructions the the folders README file. 

Here is an example to creating a collection and importanting data in preparation for a semantic search query. 

```npx tsx generative-search/cohere/load.ts```
</details>


Here is an outline of the concepts this repository covers:

### Similarity Search 🔎
[Similarity Search]() shows how to run `nearText`, `nearObject` and `nearVector` queries in Weaviate. We have examples with multiple providers available.


### Hybrid Search ⚖️
[Hybrid Search]() allows you to combine keyword and vector search. The notebook covers how to run a hybrid search query, search on a specific property, add in a `where` filter, and how to search with an embedding.We have examples with multiple providers available.


### Generative Search ⌨️
[Generative Search]() allows you to improve your search results by piping them through LLM models. We have examples with multiple providers available.


### Classification 🗂️
[Classification](https://weaviate.io/developers/weaviate/api/rest/classification) allows you to classify data objects by predicting cross-references based on the semantic meaning of the data objects.

* [Knn](https://weaviate.io/developers/weaviate/api/rest/classification#knn-classification) - coming soon ⏳
* [Zero-Shot](https://weaviate.io/developers/weaviate/api/rest/classification#zero-shot-classification) - coming soon ⏳

### Integrations 🤝
[Integrations](https://github.com/weaviate/recipes/tree/main/integrations) with Weaviate

* LlamaIndex
  * [Episode 1: Data Loaders]() - coming soon ⏳
  * [Episode 2: Indexes]() - coming soon ⏳
  * [Simple Query Engine]() - coming soon ⏳
  * [Sub Question Query Engine]() - coming soon ⏳

* Llama 2 Demo
  * [Quick demo on using the Llama 2 model using Replicate and LlamaIndex]() - coming soon ⏳

* GPTCache
  * [GPTCache notebook]() - coming soon ⏳

### Ranking 🏅
[Ranking]() in Weaviate
* [Cohere Rerank]() - coming soon ⏳

## Feedback ❓
Please note this is an ongoing project, and updates will be made frequently. If you have a feature you would like to see, please drop it in the [Weaviate Forum](https://forum.weaviate.io/c/general/4).
