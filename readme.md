# Welcome to the Weaviate Javascript recipes repository!
This repo covers end-to-end examples on the various features and integrations with [Weaviate](www.weaviate.io) for Javascript Developers! 

⚠️ Before getting started, you need to follow the installation **Setup Instructions** detailed in the setup section of this document. You will need the setup completed to successfully run the recipes.

<details>
  <summary>Setup Instructions 🚀 </summary>
  
  ### 1. Install npm packages
Clone this repository, and install dependencies

```
npm install
```
### 2. Choose where to run Weaviate

#### 2.1 Run in Weaviate Cloud Service

Head to [WCS](https://console.weaviate.cloud/), where you can easily create a free sandbox cluster. 
Take note of your `cluster url` and `apiKey`

#### 2.2 Run locally using Docker
Considering you already have docker installed, you can run:
```
docker compose up -d
``` 
**IMPORTANT:** make sure to define the environment variables before running Docker

### 3. Define environment variables
[get your OPENAI key here](https://platform.openai.com/account/api-keys)

[get your COHERE key here](https://dashboard.cohere.com/api-keys)

```
cp .env_example .env
```

If you are using docker, you can keep it like:
```
WEAVIATE_SCHEME_URL=http
WEAVIATE_URL=localhost:8080
OPENAI_API_KEY=<your openai apikey>
COHERE_API_KEY=<your cohere apikey>
```
if you are using WCS, you can keep it like:

```
WEAVIATE_SCHEME_URL=https
WEAVIATE_URL=<yourcluster.weaviate.network>
WEAVIATE_API_KEY=<your_apikey>
OPENAI_API_KEY=<your openai apikey>
COHERE_API_KEY=<your cohere apikey>
HUGGING_FACE_API_KEY=<your huggingface apikey>
PALM_API_KEY=<your palm apikey>
```

### 4. Run a Recipe!

```
npm run <recipe>
```

current available recipes:

- `npm run generative-search/openai`
- `npm run generative-search/cohere`
- `npm run similarity-search/openai`
- `npm run conditional-filters/contains-all-any`
- `npm run multi-tenancy/example`
- `npm run classification/zeroshot`
- `npm run classification/knn`
- `npm run data-with-vectors`
- _more coming soon!_
</details>


Here is an outline of the concepts this repository covers:

### Similarity Search 🔎
[Similarity Search]() shows how to run `nearText`, `nearObject` and `nearVector` queries in Weaviate. It is divided by the different providers:

* [Cohere]() - `npm run similarity-search/cohere`
* [HuggingFace]() - `npm run similarity-search/hugging-face`
* [OpenAI]() - `npm run similarity-search/openai`
* [PaLM]() - `npm run similarity-search/palm`
* [Transformers]() - coming soon ⏳

### Hybrid Search ⚖️
[Hybrid Search]() allows you to combine keyword and vector search. The notebook covers how to run a hybrid search query, search on a specific property, add in a `where` filter, and how to search with an embedding. It is divided by the different providers:

* [Cohere]() - coming soon ⏳
* [Contextionary]() - coming soon ⏳
* [HuggingFace]() - coming soon ⏳
* [OpenAI]() - coming soon ⏳
* [PaLM]() - coming soon ⏳
* [Transformers]() - coming soon ⏳

### Generative Search ⌨️
[Generative Search]() allows you to improve your search results by piping them through LLM models. It is divided by the different providers:

* [Cohere]() - `npm run generative-search/cohere`
* [OpenAI]() - `npm run generative-search/openai`
* [PaLM]() - `npm run generative-search/palm`

### Classification 🗂️
[Classification](https://weaviate.io/developers/weaviate/api/rest/classification) allows you to classify data objects by predicting cross-references based on the semantic meaning of the data objects.

* [Knn](https://weaviate.io/developers/weaviate/api/rest/classification#knn-classification) - `npm run classification/knn`
* [Zero-Shot](https://weaviate.io/developers/weaviate/api/rest/classification#zero-shot-classification) - `npm run classification/zeroshot`

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
