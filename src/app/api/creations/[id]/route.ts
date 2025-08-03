import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import Notification from '@/models/Notification';

// Helper function to extract user mentions from text
const extractMentions = (text: string): string[] => {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    Recipe;
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const creation = await Creation.findById(id)
      .populate('createdBy', 'name image')
      .populate('likes', 'name image')
      .populate('chef', 'name image') // Populate new chef field
      .populate('eatenWithUsers', 'name image') // Populate new eatenWith field
      .populate({
        path: 'chefEntries.user',
        select: 'name image'
      })
      .populate({
        path: 'eatenWithEntries.user', 
        select: 'name image'
      })
      .populate({
        path: 'recipes.recipe',
        select: 'title description cookingTime servings image ingredients instructions averageRating'
      });

    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Check if user has permission to view this creation
    // (For now, all authenticated users can view all creations)
    // TODO: Add privacy controls if needed

    return NextResponse.json(creation);
  } catch (error) {
    console.error('Error fetching creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const creation = await Creation.findById(id);
    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Check if user owns this creation
    if (creation.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized - can only edit your own creations' }, { status: 403 });
    }

    const body = await request.json();
    console.log('PUT API received body:', { 
      chef: body.chef, 
      chefEntries: body.chefEntries, 
      eatenWithEntries: body.eatenWithEntries 
    });
    
    const { 
      title, 
      description, 
      image, 
      recipes, 
      eatenWith, 
      eatenWithUsers, 
      cookingTime, 
      drankWith, 
      chefName, 
      chef,
      chefEntries,
      eatenWithEntries
    } = body;

    // Store old user references for comparison
    const oldChef = creation.chef;
    const oldEatenWithUsers = creation.eatenWithUsers || [];
    const oldMentions = [
      ...extractMentions(creation.eatenWith || ''),
      ...extractMentions(creation.chefName || '')
    ];

    // Handle recipe rating updates
    // Helper function to safely update recipe ratings
    const updateRecipeRating = async (recipeId: string, userId: string, rating: number, creationId: string) => {
      try {
        const recipeDoc = await Recipe.findById(recipeId);
        if (!recipeDoc) return;

        // Remove any existing rating from this user for this creation
        recipeDoc.ratings = recipeDoc.ratings.filter(
          (r: any) => !(r.user.toString() === userId.toString() && r.creation.toString() === creationId.toString())
        );

        // Add new rating if rating > 0
        if (rating > 0) {
          recipeDoc.ratings.push({
            user: userId,
            rating: rating,
            creation: creationId,
            createdAt: new Date()
          });
        }

        // Recalculate average rating
        const totalRatings = recipeDoc.ratings.length;
        const sumRatings = recipeDoc.ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
        
        recipeDoc.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
        recipeDoc.totalRatings = totalRatings;

        await recipeDoc.save();
      } catch (error) {
        console.error('Error updating recipe rating:', error);
      }
    };

    // Step 1: Remove old ratings from previous recipes
    if (creation.recipes && creation.recipes.length > 0) {
      for (const oldRecipeItem of creation.recipes) {
        if (oldRecipeItem.recipe && oldRecipeItem.rating) {
          await updateRecipeRating(oldRecipeItem.recipe.toString(), user._id.toString(), 0, creation._id.toString());
        }
      }
    }
    
    // Step 2: Update ratings for current recipes
    if (recipes && Array.isArray(recipes)) {
      for (const recipeItem of recipes) {
        if (recipeItem.recipe && recipeItem.rating && typeof recipeItem.rating === 'number' && recipeItem.rating >= 0 && recipeItem.rating <= 5) {
          await updateRecipeRating(recipeItem.recipe, user._id.toString(), recipeItem.rating, creation._id.toString());
        }
      }
    }

    // Update the creation
    const updatedCreation = await Creation.findByIdAndUpdate(
      id,
      {
        title,
        description,
        image,
        recipes: recipes || [],
        // Legacy fields
        eatenWith,
        chefName,
        // New user ID fields
        eatenWithUsers: eatenWithUsers || [],
        chef: chef || null,
        // New flexible entry fields
        chefEntries: chefEntries || [],
        eatenWithEntries: eatenWithEntries || [],
        cookingTime,
        drankWith
      },
      { new: true }
    ).populate('createdBy', 'name image')
     .populate('likes', 'name image')
     .populate('chef', 'name image') // Populate new chef field
     .populate('eatenWithUsers', 'name image') // Populate new eatenWith field
     .populate({
       path: 'chefEntries.user',
       select: 'name image'
     })
     .populate({
       path: 'eatenWithEntries.user', 
       select: 'name image'
     })
     .populate({
       path: 'recipes.recipe',
       select: 'title description cookingTime servings image ingredients instructions averageRating'
     });

    // Create notifications for new user references
    const notificationPromises = [];
    
    // Handle chef notification (new user ID field takes precedence)
    if (chef && chef !== oldChef?.toString() && chef !== user._id.toString()) {
      notificationPromises.push(
        Notification.create({
          recipient: chef,
          sender: user._id,
          type: 'yum',
          title: 'You were credited as chef!',
          message: `${user.name} credited you as the chef for "${title}"`,
          data: {
            creationId: updatedCreation._id,
          },
        })
      );
    }
    
    // Handle eatenWith notifications (new user ID field takes precedence)
    if (eatenWithUsers && Array.isArray(eatenWithUsers)) {
      const newEatenWithUsers = eatenWithUsers.filter(userId => 
        userId !== user._id.toString() && 
        !oldEatenWithUsers.some(oldUser => oldUser.toString() === userId)
      );
      
      for (const eatenWithUserId of newEatenWithUsers) {
        notificationPromises.push(
          Notification.create({
            recipient: eatenWithUserId,
            sender: user._id,
            type: 'yum',
            title: 'You were mentioned in a creation!',
            message: `${user.name} mentioned you in their creation "${title}"`,
            data: {
              creationId: updatedCreation._id,
            },
          })
        );
      }
    } else {
      // Fallback to legacy string-based mentions for backward compatibility
      const newMentions = [
        ...extractMentions(eatenWith || ''),
        ...extractMentions(chefName || '')
      ];
      
      // Only notify for mentions that weren't in the original creation
      const mentionsToNotify = newMentions.filter(mention => 
        !oldMentions.some(oldMention => oldMention.toLowerCase() === mention.toLowerCase())
      );
      
      if (mentionsToNotify.length > 0) {
        const mentionedUsers = await User.find({ 
          name: { $in: mentionsToNotify.map(mention => new RegExp(`^${mention}$`, 'i')) }
        });

        for (const mentionedUser of mentionedUsers) {
          // Don't notify the creator themselves
          if (mentionedUser._id.toString() !== user._id.toString()) {
            const isChef = extractMentions(chefName || '').some(mention => 
              mentionedUser.name.toLowerCase() === mention.toLowerCase()
            );
            const isEatenWith = extractMentions(eatenWith || '').some(mention => 
              mentionedUser.name.toLowerCase() === mention.toLowerCase()
            );

            let notificationMessage = '';
            if (isChef) {
              notificationMessage = `${user.name} credited you as the chef for "${title}"`;
            } else if (isEatenWith) {
              notificationMessage = `${user.name} mentioned you in their creation "${title}"`;
            }

            if (notificationMessage) {
              notificationPromises.push(
                Notification.create({
                  recipient: mentionedUser._id,
                  sender: user._id,
                  type: 'yum',
                  title: 'You were mentioned in a creation!',
                  message: notificationMessage,
                  data: {
                    creationId: updatedCreation._id,
                  },
                })
              );
            }
          }
        }
      }
    }
    
    // Execute all notifications in parallel
    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises);
    }

    return NextResponse.json(updatedCreation);
  } catch (error) {
    console.error('Error updating creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const creation = await Creation.findById(id);
    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Check if user owns this creation
    if (creation.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized - can only delete your own creations' }, { status: 403 });
    }

    // Remove ratings from recipes if this creation had ratings
    if (creation.recipes && creation.recipes.length > 0) {
      for (const recipeItem of creation.recipes) {
        if (recipeItem.recipe && recipeItem.rating) {
          try {
            const recipeDoc = await Recipe.findById(recipeItem.recipe);
            if (recipeDoc) {
              // Remove this creation's rating from the recipe
              recipeDoc.ratings = recipeDoc.ratings.filter(
                (r: any) => r.creation.toString() !== creation._id.toString()
              );

              // Recalculate average rating
              const totalRatings = recipeDoc.ratings.length;
              const sumRatings = recipeDoc.ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
              
              recipeDoc.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
              recipeDoc.totalRatings = totalRatings;

              await recipeDoc.save();
            }
          } catch (error) {
            console.error('Error removing rating from recipe:', error);
          }
        }
      }
    }

    await Creation.findByIdAndDelete(id);

    // Update user stats - decrement creation count
    await User.findByIdAndUpdate(user._id, {
      $inc: { 
        'stats.creationsPosted': -1
      }
    });

    return NextResponse.json({ message: 'Creation deleted successfully' });
  } catch (error) {
    console.error('Error deleting creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}