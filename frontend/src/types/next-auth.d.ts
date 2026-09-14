import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    backendToken: string;
    store: {
      id:                    string;
      name:                  string;
      slug:                  string;
      logo_url:              string | null;
      plan_tier:             string;
      plan_expires_at:       string | null;
      custom_domain:         string | null;
      custom_domain_status:  string;
      xendit_account_status: string;
    } | null;
    user: DefaultSession['user'] & {
      role:         string;
      phoneNumber:  string;
      isSuperadmin: boolean;
    };
  }
  interface User {
    backendToken: string;
    store:        Session['store'];
    role:         string;
    phoneNumber:  string;
    isSuperadmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken: string;
    store:        any;
    role:         string;
    phoneNumber:  string;
    isSuperadmin: boolean;
  }
}
