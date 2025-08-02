/**
 * Migration Script: Convert Chef and EatenWith String References to User IDs
 * 
 * This script migrates existing Creation documents that use string-based 
 * user references (chefName, eatenWith) to the new user ID-based system
 * (chef, eatenWithUsers).
 * 
 * Usage: node scripts/migrate-user-references.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas (simplified versions)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const CreationSchema = new mongoose.Schema({
  title: String,
  chefName: String,
  eatenWith: String,
  chef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eatenWithUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Creation = mongoose.model('Creation', CreationSchema);

// Helper function to extract mentions from text
const extractMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

// Helper function to search for users by name (fuzzy matching)
const findUsersByName = async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  // Try exact match first
  const exactMatch = await User.findOne({ 
    name: { $regex: new RegExp(`^${searchTerm}$`, 'i') } 
  });
  
  if (exactMatch) return [exactMatch];
  
  // Try partial matches
  const partialMatches = await User.find({ 
    name: { $regex: new RegExp(searchTerm, 'i') } 
  }).limit(5);
  
  return partialMatches;
};

// Helper function to extract potential user names from free text
const extractPotentialUserNames = (text) => {
  if (!text) return [];
  
  // Extract @mentions
  const mentions = extractMentions(text);
  
  // Extract words that could be names (simple heuristic)
  const words = text
    .split(/[,\s]+/)
    .filter(word => 
      word.length > 2 && 
      !['and', 'with', 'the', 'was', 'were', 'ate', 'had', 'shared'].includes(word.toLowerCase()) &&
      /^[a-zA-Z]+$/.test(word) // Only alphabetic characters
    )
    .slice(0, 10); // Limit to prevent too many searches
  
  return [...mentions, ...words];
};

// Migration function for chef references
const migrateChefReferences = async () => {
  console.log('\n=== Migrating Chef References ===');
  
  const creationsWithChefNames = await Creation.find({
    chefName: { $exists: true, $ne: '' },
    chef: { $exists: false }
  });
  
  console.log(`Found ${creationsWithChefNames.length} creations with chef names to migrate`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const creation of creationsWithChefNames) {
    try {
      console.log(`\nProcessing creation: "${creation.title}" (Chef: "${creation.chefName}")`);
      
      const potentialNames = extractPotentialUserNames(creation.chefName);
      let foundChef = null;
      
      for (const name of potentialNames) {
        const users = await findUsersByName(name);
        if (users.length > 0) {
          foundChef = users[0]; // Take the best match
          console.log(`  ✓ Found chef: ${foundChef.name} (${foundChef._id})`);
          break;
        }
      }
      
      if (foundChef) {
        await Creation.updateOne(
          { _id: creation._id },
          { $set: { chef: foundChef._id } }
        );
        migratedCount++;
        console.log(`  ✓ Migration successful`);
      } else {
        skippedCount++;
        console.log(`  ⚠ No matching user found, keeping as string: "${creation.chefName}"`);
      }
      
    } catch (error) {
      console.error(`  ✗ Error processing creation ${creation._id}:`, error.message);
      skippedCount++;
    }
  }
  
  console.log(`\nChef Migration Results:`);
  console.log(`  Successfully migrated: ${migratedCount}`);
  console.log(`  Skipped (no match found): ${skippedCount}`);
};

// Migration function for eatenWith references
const migrateEatenWithReferences = async () => {
  console.log('\n=== Migrating EatenWith References ===');
  
  const creationsWithEatenWith = await Creation.find({
    eatenWith: { $exists: true, $ne: '' },
    eatenWithUsers: { $exists: false }
  });
  
  console.log(`Found ${creationsWithEatenWith.length} creations with eatenWith text to migrate`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const creation of creationsWithEatenWith) {
    try {
      console.log(`\nProcessing creation: "${creation.title}" (EatenWith: "${creation.eatenWith}")`);
      
      const potentialNames = extractPotentialUserNames(creation.eatenWith);
      const foundUsers = [];
      
      for (const name of potentialNames) {
        const users = await findUsersByName(name);
        for (const user of users) {
          // Avoid duplicates
          if (!foundUsers.some(u => u._id.toString() === user._id.toString())) {
            foundUsers.push(user);
            console.log(`  ✓ Found user: ${user.name} (${user._id})`);
          }
        }
        
        // Limit to prevent too many matches
        if (foundUsers.length >= 5) break;
      }
      
      if (foundUsers.length > 0) {
        await Creation.updateOne(
          { _id: creation._id },
          { $set: { eatenWithUsers: foundUsers.map(u => u._id) } }
        );
        migratedCount++;
        console.log(`  ✓ Migration successful (${foundUsers.length} users)`);
      } else {
        skippedCount++;
        console.log(`  ⚠ No matching users found, keeping as string: "${creation.eatenWith}"`);
      }
      
    } catch (error) {
      console.error(`  ✗ Error processing creation ${creation._id}:`, error.message);
      skippedCount++;
    }
  }
  
  console.log(`\nEatenWith Migration Results:`);
  console.log(`  Successfully migrated: ${migratedCount}`);
  console.log(`  Skipped (no match found): ${skippedCount}`);
};

// Statistics function
const showMigrationStats = async () => {
  console.log('\n=== Migration Statistics ===');
  
  const totalCreations = await Creation.countDocuments();
  const creationsWithChefName = await Creation.countDocuments({ chefName: { $ne: '' } });
  const creationsWithChef = await Creation.countDocuments({ chef: { $exists: true, $ne: null } });
  const creationsWithEatenWith = await Creation.countDocuments({ eatenWith: { $ne: '' } });
  const creationsWithEatenWithUsers = await Creation.countDocuments({ eatenWithUsers: { $exists: true, $not: { $size: 0 } } });
  
  console.log(`Total Creations: ${totalCreations}`);
  console.log(`\nChef References:`);
  console.log(`  String-based (chefName): ${creationsWithChefName}`);
  console.log(`  User ID-based (chef): ${creationsWithChef}`);
  console.log(`\nEatenWith References:`);
  console.log(`  String-based (eatenWith): ${creationsWithEatenWith}`);
  console.log(`  User ID-based (eatenWithUsers): ${creationsWithEatenWithUsers}`);
};

// Main migration function
const runMigration = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting User Reference Migration');
    console.log('This script will convert string-based user references to user IDs');
    
    // Show initial statistics
    await showMigrationStats();
    
    // Run migrations
    await migrateChefReferences();
    await migrateEatenWithReferences();
    
    // Show final statistics
    await showMigrationStats();
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Dry run function (for testing)
const runDryRun = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Running Migration Dry Run (No Changes Made)');
    
    await showMigrationStats();
    
    console.log('\n=== Dry Run: Chef References ===');
    const creationsWithChefNames = await Creation.find({
      chefName: { $exists: true, $ne: '' },
      chef: { $exists: false }
    }).limit(5);
    
    for (const creation of creationsWithChefNames) {
      console.log(`\nCreation: "${creation.title}"`);
      console.log(`  Chef Name: "${creation.chefName}"`);
      
      const potentialNames = extractPotentialUserNames(creation.chefName);
      console.log(`  Potential names to search: [${potentialNames.join(', ')}]`);
      
      for (const name of potentialNames.slice(0, 2)) { // Limit for dry run
        const users = await findUsersByName(name);
        if (users.length > 0) {
          console.log(`  Would map "${name}" to: ${users[0].name} (${users[0]._id})`);
          break;
        }
      }
    }
    
    console.log('\n=== Dry Run: EatenWith References ===');
    const creationsWithEatenWith = await Creation.find({
      eatenWith: { $exists: true, $ne: '' },
      eatenWithUsers: { $exists: false }
    }).limit(5);
    
    for (const creation of creationsWithEatenWith) {
      console.log(`\nCreation: "${creation.title}"`);
      console.log(`  EatenWith: "${creation.eatenWith}"`);
      
      const potentialNames = extractPotentialUserNames(creation.eatenWith);
      console.log(`  Potential names to search: [${potentialNames.join(', ')}]`);
      
      const foundUsers = [];
      for (const name of potentialNames.slice(0, 3)) { // Limit for dry run
        const users = await findUsersByName(name);
        foundUsers.push(...users.slice(0, 1)); // Take first match only
      }
      
      if (foundUsers.length > 0) {
        console.log(`  Would map to users: ${foundUsers.map(u => `${u.name} (${u._id})`).join(', ')}`);
      }
    }
    
    console.log('\n✅ Dry run completed!');
    
  } catch (error) {
    console.error('❌ Dry run failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Command line interface
const args = process.argv.slice(2);
if (args.includes('--dry-run')) {
  runDryRun();
} else if (args.includes('--stats')) {
  connectDB().then(showMigrationStats).then(() => mongoose.connection.close());
} else {
  runMigration();
}