import weaviate from "weaviate-client";
import { openai } from "inngest";

import { inngest } from "./client";

export const generateMeal = inngest.createFunction(
  { id: "generate-meal", concurrency: 10 },
  { event: "meal.generate" },
  async ({ event, step }) => {
    const { participantsCount, preferences, cuisine_type } = event.data;

    // Connect to Weaviate
    const client = await weaviate.connectToWeaviateCloud(process.env.WCD_URL!, {
      authCredentials: new weaviate.ApiKey(process.env.WCD_API_KEY!),
      headers: {
        "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY!,
      },
    });

    // Query relevant recipes based on cusine type preference
    let relevantRecipes = await step.run("query-recipes", async () => {
      const collection = client.collections.get("Thefoodprocessorcuisinetype");
      const query = cuisine_type;

      const result = await collection.query.nearText(query, {
        limit: 10,
      });

      return result.objects.map((r) => r.properties.recipe).join(`\n`);
    });

    const allergiesAnalysis = await step.ai.infer("Allergies analysis", {
      model: openai({ model: "gpt-4" }),
      body: {
        messages: [
          {
            role: "system",
            content:
              'Given the following list meal requirements, return a list of allergies, if not allergies, return "not allergies"',
          },
          {
            role: "user",
            content: preferences.join(", "),
          },
        ],
        temperature: 0.7,
      },
    });

    let ingredientsAlternatives: any[] = [];

    // run some conditional AI steps
    if (allergiesAnalysis.choices[0].message.content !== "not allergies") {
      // Query relevant recipes based on cusine type preference
      ingredientsAlternatives = await step.run(
        "query-ingredients-alternatives",
        async () => {
          const collection = client.collections.get(
            "Thefoodprocessoringredientsalternatives"
          );
          const query = allergiesAnalysis.choices[0].message.content!;

          const result = await collection.query.nearText(query, {
            limit: 10,
          });

          return result.objects;
        }
      );
    }

    // Generate meal plan using step.ai.wrap()
    const mealPlan = await step.ai.infer("Generate a dinner menu", {
      model: openai({ model: "gpt-4" }),
      body: {
        messages: [
          {
            role: "system",
            content:
              "You are a professional chef and meal planner. Create a detailed dinner menu based on the provided recipes and requirements.",
          },
          {
            role: "user",
            content: `Create a dinner menu for ${participantsCount} people with these preferences: ${preferences.join(
              ", "
            )}.
      
      Use these recipes as inspiration:
      ${relevantRecipes}

      ${
        ingredientsAlternatives.length > 0 &&
        `Some allergies to ${
          allergiesAnalysis.choices[0].message.content
        } were detected, here are some ingredients alternatives to take into account: ${ingredientsAlternatives
          .map((r) => r.properties.ingredients_alternatives)
          .join(", ")}`
      }
      
      Include:
      1. Appetizers
      2. Main course
      3. Side dishes
      4. Dessert
      5. Estimated preparation time
      6. Special instructions
      
      Format the response in a clear, organized way.`,
          },
        ],
        temperature: 0.7,
      },
    });

    // Get wine pairings using step.ai.wrap()
    const wines = await step.run("wine-pairings", async () => {
      const collection = client.collections.get("Thefoodprocessorwinetype");
      const result = await collection.query.nearText(
        mealPlan.choices[0].message.content || "",
        {
          limit: 3,
        }
      );
      return result.objects;
    });

    // Generate wine pairings using step.ai.wrap()
    const winePairings = await step.ai.infer("Generate wine pairings", {
      model: openai({ model: "gpt-4" }),
      body: {
        messages: [
          {
            role: "system",
            content:
              "You are a sommelier specializing in wine pairings for holiday meals.",
          },
          {
            role: "user",
            content: `Given this dinner menu:
        ${mealPlan.choices[0].message.content}
        
        And these available wines:
        ${wines.map((w) => `${w.properties.wine_type}`).join("\n")}
        
        Provide specific wine pairing recommendations for each course, explaining why each wine complements the dish.`,
          },
        ],
        temperature: 0.7,
      },
    });

    // Generate shopping list using step.ai.wrap()
    const shoppingList = await step.ai.infer("Generate shopping list", {
      model: openai({ model: "gpt-4" }),
      body: {
        messages: [
          {
            role: "system",
            content:
              "You are a professional chef who specializes in scaling recipes and creating detailed shopping lists.",
          },
          {
            role: "user",
            content: `Given this meal plan for ${participantsCount} people:
        ${mealPlan.choices[0].message.content}
        
        Create a detailed shopping list with quantities scaled appropriately.
        Group items by category (produce, meat, dairy, pantry, etc.).
        Include any special ingredients or substitutions based on the preferences: ${preferences.join(
          ", "
        )}`,
          },
        ],
        temperature: 0.7,
      },
    });

    return {
      mealPlan: mealPlan.choices[0].message.content,
      winePairings: winePairings.choices[0].message.content,
      shoppingList: shoppingList.choices[0].message.content,
    };
  }
);

export const functions = [generateMeal];
