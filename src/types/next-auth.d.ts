import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      familyId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    familyId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    familyId?: string | null;
  }
}