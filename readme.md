# Welcome to the Weaviate Javascript recipes repository!
This repo covers end-to-end examples of various features and integrations with [Weaviate](www.weaviate.io) for Javascript Developers! 

> 💡 This repo can also be used online with [Replit](https://replit.com/@malgamves/recipes-ts)


## What are recipes? 

Recipes are end-to-end scripts showing various features and integrations. Recipes act as a reference for what using the Weaviate client can look like. 


## Concepts Covered 🗺️

Here are some of the concepts this repository covers:

### Similarity Search 🔎
[Similarity Search](/similarity-search) leverages various machine learning models to perform searches based on semantic similarity. In Weaviate, this is done with `query.nearText`, `query.nearObject` and `query.nearVector` operators.


### Generative Search ⌨️
[Generative Search](/generative-search) allows you to improve your search results by piping them through LLM models to perform RAG. In Weaviate, this is done with `generate.nearText`, `generate.nearObject` and `generate.nearVector` operators.

> ⚠️ Before getting started, you need to follow the installation **Setup Instructions** detailed in the setup section of this document. You will need the setup completed to successfully run the recipes.


## 🚀 Setup Instructions

<details>
  <summary> 🌐 Run on Replit</summary>

### 1. Open on recipes on Replit

Navigate to the recipes [Replit](https://replit.com/@malgamves/recipes-ts) and fork it.

### 2. Run in Weaviate Cloud Service

Head to [WCS](https://console.weaviate.cloud/), where you can easily create a free sandbox cluster. 
Take note of your `cluster URL` and `apiKey` and add them to your `.env` file as `WEAVIATE_URL` and `WEAVIATE_ADMIN_KEY` respectively. 

### 3. Define environment variables
The `.env.example` file contains all the environment variables you would need to run the recipes.
Go to each provider website to create and copy your environment variables, e.g. access your [Cohere](https://dashboard.cohere.com/api-keys) variables here. 
```
cp .env_example .env
```

Now you're ready to run a recipe! 

</details>

<details>
  <summary> 🏡 Run locally</summary>
  
### 1. Install npm packages
Clone this repository, and install the project dependencies

```
npm install
```

### 2. Run locally using Docker
Considering you already have docker installed, follow along our Docker [installation guide](https://weaviate.io/developers/weaviate/installation/docker-compose). Then run the command below to start your Weaviate server.

```
docker compose up -d
```
> ⚠️ When using Docker, remember to update all the `connectToWeaviateCloud()` methods to `connectToLocal()`. 

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

Recipes are organized by concepts using folders (i.e similarity search). Each concept folder has multiple folders showing its implementation with various model providers (i.e Cohere, Mistral AI etc).
Provider sub folders contain relevant scripts and a `README.md` file with details on how to run each specific recipe.

To run a recipe, navigate to the concept you are interested in and select a provider to run it with.Follow the instructions in the `README.md` file and you should be good to go. 

> ⚠️ Remember to add the relevant API keys to your `.env` files

## Feedback ❓
Please note this is an ongoing project, and updates will be made frequently. If you have a feature you would like to see, please drop it in the [Weaviate Forum](https://forum.weaviate.io/c/general/4) or open an issue.

