import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    let query: any;
    
    if (session.user.familyId) {
      // If user is part of a family, only show family recipes
      query = { _id: id, familyId: session.user.familyId };
    } else {
      // If user has no family, show only their personal recipes
      query = { _id: id, createdBy: session.user.id, familyId: null };
    }

    const recipe = await Recipe.findOne(query).populate('createdBy', 'name');

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = await params;
    
    await dbConnect();

    let updateQuery: any;
    
    if (session.user.familyId) {
      // If user is part of a family, only allow updating family recipes
      updateQuery = { _id: id, familyId: session.user.familyId };
    } else {
      // If user has no family, only allow updating their personal recipes
      updateQuery = { _id: id, createdBy: session.user.id, familyId: null };
    }

    const recipe = await Recipe.findOneAndUpdate(
      updateQuery,
      data,
      { new: true }
    ).populate('createdBy', 'name');

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    let deleteQuery: any;
    
    if (session.user.familyId) {
      // If user is part of a family, only allow deleting family recipes
      deleteQuery = { _id: id, familyId: session.user.familyId };
    } else {
      // If user has no family, only allow deleting their personal recipes
      deleteQuery = { _id: id, createdBy: session.user.id, familyId: null };
    }

    const recipe = await Recipe.findOneAndDelete(deleteQuery);

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}