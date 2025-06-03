import weaviate from 'weaviate-client';
import { QueryAgent } from 'weaviate-agents';
import "dotenv/config";

    async function main() {
      // Initialize Weaviate client
      const client = await weaviate.connectToWeaviateCloud(process.env.WEAVIATE_URL as string, {
        authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_ADMIN_KEY as string),
      });
    
      // Query Agent with Collection Configuration
      const qaWithConfig = new QueryAgent(client,{
        collections: [{
            name: 'ECommerce',
            targetVector: ['name_description_brand_vector'],
            viewProperties: ['description']
            // tenant: 'tenantA' // Optional for multi-tenancy
          },{ 
            name: 'FinancialContracts' 
        },{ 
            name: 'Weather' 
        }]
      });
    
    
      // Query with Collection Configuration
      const clothingResponse = await qaWithConfig.run(
        "I like vintage clothes and nice shoes. Recommend some of each below $60.",{
          collections: [{
              name: 'ECommerce',
              targetVector: ['name_description_brand_vector'],
              viewProperties: ['name', 'description', 'category', 'brand']
            },{
              name: 'FinancialContracts'
            }
          ]
        });
    
      clothingResponse.display();
    
      // Basic Query
      const basicResponse = await qaWithConfig.run(
        "I like vintage clothes and nice shoes. Recommend some of each below $60."
      );
    
      basicResponse.display();
    
      // Follow-up Query
      const followUpResponse = await qaWithConfig.run(
        "I like the vintage clothes options, can you do the same again but above $200?",
        { context: basicResponse }
      );
    
      followUpResponse.display();
    
      // Close client connection
      await client.close();
    }
    
    // Run the main function
    void main();