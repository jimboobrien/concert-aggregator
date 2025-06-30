# Admin Authentication with JWT Custom Claims

This document outlines the method used for handling role-based access control (RBAC), specifically for identifying an `admin` user, using Supabase JWT custom claims. This approach is highly efficient as it embeds the user's role directly into the JSON Web Token (JWT), avoiding the need for extra database calls from the client to check user permissions.

## Overview

The process involves two key parts:
1.  **Setting the Claim (Backend):** A database hook in Supabase dynamically adds a custom `user_role` claim to the user's access token upon login.
2.  **Checking the Claim (Frontend):** The Next.js client-side code decodes the JWT to read the `user_role` claim and conditionally renders UI elements, such as the admin navigation links.

---

## 1. Setting the Admin Role (Backend)

The admin role is assigned via a "Custom Access Token Hook" in Supabase. This is a PostgreSQL function that intercepts the token generation process and injects custom data.

The implementation can be found in the following migration file:
`src/utils/supabase/migrations/20240801120000_add_custom_claim_hook.sql`

The core logic of the function is as follows:

```sql
-- Fetch the user role from the user_roles table
select role into user_role from public.user_roles where user_id = (event->>'user_id')::uuid;

claims := event->'claims';

if user_role is not null then
  -- Set the 'user_role' claim
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
else
  claims := jsonb_set(claims, '{user_role}', 'null');
end if;
```
This SQL code queries our `user_roles` table and injects the result into the JWT's payload under the key `user_role`.

---

## 2. Checking the Admin Role (Frontend)

The check is performed in the main navigation bar, which is a client component. This allows the UI to react dynamically to the user's authentication state.

The component is located at:
`src/components/navigation/MainNavbar.tsx`

The logic inside the component uses the `jwt-decode` library to inspect the access token provided by `supabase.auth.getSession()`:

```typescript
// ... imports
import { jwtDecode } from 'jwt-decode';

// ... component setup

interface DecodedToken {
  user_role?: string;
}

// ... inside the checkUserStatus function

const decodedToken = jwtDecode<DecodedToken>(session.access_token);
setIsAdmin(decodedToken.user_role === 'admin');
```
The component decodes the token and specifically checks if the `user_role` property is equal to `'admin'`, setting the `isAdmin` state accordingly.

---

## 3. Decoded JWT Structure

When an admin user is logged in, their decoded JWT will have the following structure. Note the presence of the `user_role` claim, which is distinct from the standard `role` claim.

```json
{
    "iss": "https://zptqlwtlfzndrravmsca.supabase.co/auth/v1",
    "sub": "3713c330-e72b-430e-acb8-4efa23444e8c",
    "aud": "authenticated",
    "exp": 1751058438,
    "iat": 1751054838,
    "email": "jim.obrien3@gmail.com",
    "phone": "",
    "app_metadata": {
        "provider": "email",
        "providers": [
            "email"
        ]
    },
    "user_metadata": {
        "email": "jim.obrien3@gmail.com",
        "email_verified": true,
        "phone_verified": false,
        "sub": "3713c330-e72b-430e-acb8-4efa23444e8c"
    },
    "role": "authenticated",
    "user_role": "admin",  // <-- Our custom claim for RBAC
    "aal": "aal1",
    "amr": [
        {
            "method": "password",
            "timestamp": 1751044350
        }
    ],
    "session_id": "2924e7ee-a199-407a-830e-166eddfe057b",
    "is_anonymous": false
}
```
The frontend logic relies entirely on the presence and value of this `user_role` claim to grant access to admin-only features. 