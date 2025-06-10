# CRUD Functionality Configuration

## Overview

To streamline the management of CRUD (Create, Read, Update, Delete) operations and to easily integrate with our role-based access control, we will use a central configuration file named `crud-config.json`. This file will define which database tables are available for CRUD operations and what roles are required for each action.

## `crud-config.json` Structure

The `crud-config.json` file will be located in the root of the project. It will contain an array of objects, where each object represents a database table that requires CRUD functionality.

```json
[
  {
    "table_name": "artists",
    "allow_create": ["admin"],
    "allow_read": ["all"],
    "allow_update": ["admin"],
    "allow_delete": ["admin"]
  },
  {
    "table_name": "venues",
    "allow_create": ["admin"],
    "allow_read": ["all"],
    "allow_update": ["admin"],
    "allow_delete": ["admin"]
  },
  {
    "table_name": "submitted_artists",
    "allow_create": ["user", "admin"],
    "allow_read": ["admin"],
    "allow_update": ["admin"],
    "allow_delete": ["admin"]
  },
  {
    "table_name": "submitted_venues",
    "allow_create": ["user", "admin"],
    "allow_read": ["admin"],
    "allow_update": ["admin"],
    "allow_delete": ["admin"]
  }
]
```

### Key Definitions

-   **`table_name`**: The exact name of the database table in Supabase.
-   **`allow_create`**: An array of roles that are permitted to create new records in this table.
-   **`allow_read`**: An array of roles that are permitted to read records from this table. `"all"` signifies public access.
-   **`allow_update`**: An array of roles that are permitted to update existing records.
-   **`allow_delete`**: An array of roles that are permitted to delete records.

## Automated Scaffolding

To accelerate development, we will implement a scaffolding script that automatically generates the necessary files for a new CRUD interface whenever a new table definition is added to `crud-config.json`.

### Triggering the Scaffolding

The scaffolding process will be initiated by running a script from the command line:

```bash
npm run scaffold-crud
```

This script will scan the `crud-config.json` file and identify any tables that do not yet have corresponding migration files or CRUD interface directories.

### Generated Files

For each new table definition, the script will generate the following:

1.  **Database Migration:** A new Supabase migration file will be created in `src/utils/supabase/migrations/`. This file will contain a basic `CREATE TABLE` statement with default columns (e.g., `id`, `name`, `created_at`, `updated_at`).
2.  **CRUD Interface:** A new directory will be created under `src/app/admin/[table_name]/`. This directory will contain placeholder React components for:
    -   `page.tsx`: A page to list all records.
    -   `create/page.tsx`: A page with a form to create a new record.
    -   `[id]/edit/page.tsx`: A page with a form to edit an existing record.
3.  **API Routes:** A corresponding directory will be created under `src/app/api/[table_name]/` containing basic API route handlers for `GET`, `POST`, `PUT`, and `DELETE` operations, protected by the roles defined in the config.

### Developer Workflow

After running the scaffolding script, the developer will be responsible for:

1.  Reviewing and customizing the generated database migration file to add table-specific columns.
2.  Running the migration (`npx supabase db push`).
3.  Updating the generated React components with the correct form fields and logic.
4.  Customizing the API routes if any special logic is required.

This automated process provides a consistent and efficient starting point for building new CRUD interfaces.

## Implementation Details

The automated scaffolding system was implemented through the following steps:

1.  **Node.js Script:** A script was created at `scripts/scaffold-crud.mjs`. This script uses Node.js's built-in `fs` (file system) and `path` modules to:
    -   Read and parse the `crud-config.json` file.
    -   Check for the existence of corresponding migration and UI files to avoid duplication.
    -   Generate new files (`.sql` for migrations, `.tsx` for UI components, `.ts` for API routes) based on predefined templates within the script.
    -   Write these new files to the appropriate directories (`src/utils/supabase/migrations/`, `src/app/admin/`, `src/app/api/`).

2.  **NPM Script:** To make the scaffolding script easily executable, a new command was added to the `scripts` section of the `package.json` file:
    ```json
    "scaffold-crud": "node scripts/scaffold-crud.mjs"
    ```
    This allows any developer on the project to run the scaffolding process by simply executing `npm run scaffold-crud` from the terminal.

## Implementation

The application's backend will read this configuration file to dynamically protect API routes and authorize CRUD operations. Before performing any database action, the backend will verify if the authenticated user's role is present in the corresponding `allow_*` array for the requested table and operation. This approach centralizes our authorization logic, making it easier to manage and update permissions. 