# Welcome to the Weaviate Javascript recipes repository!
This repo covers end-to-end examples of various features and integrations with [Weaviate](www.weaviate.io) for Javascript Developers! 

> 💡 This repo can also be used online with [Replit](https://replit.com/@malgamves/recipes-ts)
> 
⚠️ Before getting started, you need to follow the installation **Setup Instructions** detailed in the setup section of this document. You will need the setup completed to successfully run the recipes.

<details>
  <summary>Setup Instructions 🚀 </summary>
## Setup Instructions 🚀 

### 1. Install npm packages
Clone this repository, and install dependencies

```
npm install
```
### 2. Choose where to run Weaviate

#### 2.1 Run in Weaviate Cloud Service

Head to [WCS](https://console.weaviate.cloud/), where you can easily create a free sandbox cluster. 
Take note of your `cluster URL` and `apiKey` and add them to your `.env` file as `WEAVIATE_URL` and `WEAVIATE_ADMIN_KEY` respectively. 

#### 2.2 Run locally using Docker
Considering you already have docker installed, you can run:
```
docker compose up -d
```
> ⚠️ If you use Docker, please update all the `connectToWeeaviateCloud()` methods to `connectToLocal()`. 

**IMPORTANT:** Make sure to define your environment variables before running Docker

### 3. Define environment variables
The `.env.example` file contains all the environment variables you would need to run the recipes.
Go to each provider website to create and copy your environment variables, e.g. access your [Cohere](https://dashboard.cohere.com/api-keys)
variables here. 
```
cp .env_example .env
```

Now you're ready to run a recipe! 
</details>

## Run a Recipe!

Navigate to the concept you want to run, pick one of the providers selected and follow the instructions in the `README.md`. 
Here is an example of how to run a recipe of similarity search with Cohere. 

> 💡 Remember to add your `COHERE_API_KEY` to your `.env` file. 

### 🌱 Step 1
Load your data with the following command


```bash
npx tsx similarity-search/cohere/load.ts
```

### 🔍 Step 2
Query your data with the following command

```bash
npx tsx similarity-search/cohere/query.ts
```


## Concepts Covered 🗺️

Here are some of the concepts this repository covers:

### Similarity Search 🔎
[Similarity Search](/similarity-search) shows how to run `nearText`, `nearObject` and `nearVector` queries in Weaviate. 


### Generative Search ⌨️
[Generative Search](/generative-search) allows you to improve your search results by piping them through LLM models. It is divided by the different providers:


## Feedback ❓
Please note this is an ongoing project, and updates will be made frequently. If you have a feature you would like to see, please drop it in the [Weaviate Forum](https://forum.weaviate.io/c/general/4) or open an issue.

