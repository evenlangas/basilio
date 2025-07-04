// MongoDB Index Creation Script for Recipe Search Scalability
// Run this script to ensure all necessary indexes are created for optimal performance

const { MongoClient } = require('mongodb');

// Replace with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/basilio';
const DATABASE_NAME = process.env.MONGODB_DB || 'basilio';

async function createRecipeIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const recipesCollection = db.collection('recipes');
    
    console.log('Creating recipe search indexes...');
    
    // 1. Text search index for title, description, and tags
    console.log('Creating text search index...');
    await recipesCollection.createIndex(
      { 
        title: 'text', 
        description: 'text', 
        tags: 'text' 
      },
      {
        weights: {
          title: 10,        // Title matches are most important
          tags: 5,          // Tag matches are moderately important  
          description: 1    // Description matches are least important
        },
        name: 'recipe_search_index'
      }
    );
    
    // 2. User's recipes by date
    console.log('Creating user recipes index...');
    await recipesCollection.createIndex({ createdBy: 1, createdAt: -1 });
    
    // 3. Public recipes by popularity
    console.log('Creating popularity index...');
    await recipesCollection.createIndex({ isPrivate: 1, averageRating: -1, totalRatings: -1 });
    
    // 4. Public recipes by date
    console.log('Creating public recipes by date index...');
    await recipesCollection.createIndex({ isPrivate: 1, createdAt: -1 });
    
    // 5. User's recipes with privacy filter
    console.log('Creating user privacy filter index...');
    await recipesCollection.createIndex({ createdBy: 1, isPrivate: 1 });
    
    // 6. Popular recipes general
    console.log('Creating general popularity index...');
    await recipesCollection.createIndex({ totalRatings: -1, averageRating: -1 });
    
    // 7. Recent recipes
    console.log('Creating recent recipes index...');
    await recipesCollection.createIndex({ createdAt: -1 });
    
    console.log('All indexes created successfully!');
    
    // Display existing indexes
    console.log('\nExisting indexes:');
    const indexes = await recipesCollection.listIndexes().toArray();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Get collection stats
    console.log('\nCollection statistics:');
    const stats = await recipesCollection.stats();
    console.log(`Total documents: ${stats.count}`);
    console.log(`Total size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Average document size: ${stats.avgObjSize} bytes`);
    
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Performance testing function
async function testSearchPerformance() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const recipesCollection = db.collection('recipes');
    
    console.log('\n=== PERFORMANCE TESTING ===');
    
    const testQueries = [
      'pasta',
      'chicken curry',
      'chocolate',
      'vegetarian',
      'quick dinner'
    ];
    
    for (const query of testQueries) {
      console.log(`\nTesting query: "${query}"`);
      
      const startTime = Date.now();
      
      // Test text search performance
      const results = await recipesCollection.find({
        $text: { $search: query }
      })
      .select('title description')
      .limit(20)
      .toArray();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      console.log(`Results: ${results.length} recipes found`);
      console.log(`Execution time: ${executionTime}ms`);
      
      if (executionTime > 100) {
        console.log('⚠️  Query took longer than 100ms - consider optimization');
      } else {
        console.log('✅ Query performance is good');
      }
    }
    
  } catch (error) {
    console.error('Error in performance testing:', error);
  } finally {
    await client.close();
  }
}

// Run the script
async function main() {
  console.log('🚀 Recipe Search Optimization Script');
  console.log('====================================');
  
  await createRecipeIndexes();
  
  // Uncomment to run performance tests
  // await testSearchPerformance();
  
  console.log('\n✅ Script completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Monitor query performance in production');
  console.log('2. Consider adding more specific indexes based on usage patterns');
  console.log('3. Set up database monitoring for index usage');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createRecipeIndexes, testSearchPerformance };