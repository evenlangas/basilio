import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered', { user: user?.email, provider: account?.provider });
      
      if (account?.provider === 'google') {
        try {
          console.log('Attempting to connect to database...');
          await dbConnect();
          console.log('Database connected successfully');
          
          // Check if user exists in our User collection
          console.log('Looking for existing user with email:', user.email);
          let existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            console.log('Creating new user...');
            // Create new user in our User collection
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              familyId: null,
            });
            console.log('New user created:', existingUser._id);
          } else {
            console.log('Existing user found:', existingUser._id);
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          console.error('Error stack:', error.stack);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback triggered', { hasUser: !!user, provider: account?.provider });
      
      // Always refresh user data from database to get latest familyId
      if (token.email) {
        try {
          console.log('JWT: Connecting to database...');
          await dbConnect();
          console.log('JWT: Looking for user with email:', token.email);
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.familyId = dbUser.familyId?.toString() || null;
            token.userId = dbUser._id.toString();
            console.log('JWT: User found, updated token with familyId:', token.familyId);
          } else {
            console.log('JWT: User not found in database');
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          console.error('JWT error stack:', error.stack);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.familyId = token.familyId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };