import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    await dbConnect();
    
    const dbUser = await User.findById(session.user.id);
    
    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
        familyId: session.user.familyId,
      },
      dbUser: {
        _id: dbUser?._id,
        email: dbUser?.email,
        familyId: dbUser?.familyId,
      },
      match: session.user.familyId === dbUser?.familyId?.toString()
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}