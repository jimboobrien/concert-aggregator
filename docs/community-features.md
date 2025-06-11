# Community-Driven Content

## Overview

To foster a community-driven platform, we will empower users to contribute to our database of artists and venues. This involves creating submission forms and a system for tracking the status of venues, including potential closures and holiday hours. All user-submitted content will be subject to a review process before being integrated into the main database to ensure data quality.

## 1. Artist Submissions

Users will be able to submit new artists to the platform.

### Submission Form

A new page at `/artists/submit` will host the submission form with the following fields:

-   **Artist Name:** (text, required)
-   **Bio/Description:** (textarea, optional)
-   **Primary Genre:** (text, optional)
-   **YouTube Channel URL:** (url, optional)
-   **Official Website:** (url, optional)

### Backend Process

1.  A new table, `submitted_artists`, will be created to store these submissions. It will include columns for `name`, `bio`, `genre`, `youtube_url`, `website_url`, `status` (`pending_review`, `approved`, `rejected`), and `submitted_by` (a foreign key to `auth.users`).
2.  An API endpoint will handle form submissions and save the data to the `submitted_artists` table.

## 2. Venue Submissions

Users will be able to submit new venues.

### Submission Form

A new page at `/venues/submit` will host the venue submission form. The form will remember its state to prevent data loss. It will include:

-   **Venue Name:** (text, required)
-   **City:** (text, required)
-   **State/Province:** (text, required)
-   **Country:** (text, required)
-   **Official Website:** (url, optional)
-   **Capacity:** (number, optional)

### Backend Process

1. A new table, `submitted_venues`, will be created to store these submissions. It will include columns for `name`, `city`, `state`, `country`, `website`, `capacity`, `status` (`pending_review`, `approved`, `rejected`), and `submitted_by` (a foreign key to `auth.users`).
2.  An API endpoint will handle form submissions and save the data to the `submitted_venues` table.

## 3. Venue Status & Holiday Hours

To ensure our venue data is current, we will implement a system for tracking its operational status.

### Data Model Changes

The `venues` table will be updated with the following columns:

-   **`status`**: An `ENUM` or `TEXT` field to track the venue's status (e.g., `active`, `temporarily_closed`, `permanently_closed`). Defaults to `active`.
-   **`holiday_hours`**: A `JSONB` field to store information about special hours for holidays.

### Management

-   Venue pages will display their current status.
-   A system will need to be developed for users to report a venue as closed or to suggest updated hours, which will flag the venue for admin review.

## 4. Moderation & User Roles

To maintain data quality and manage user-submitted content, a moderation system with distinct user roles will be implemented.

### User Roles

-   **User:** Standard role for all registered users. They can submit new artists and venues, follow artists/venues, and view public content.
-   **Admin:** A privileged role for platform administrators. Admins can review, approve, reject, or edit user-submitted content.

### Moderation Queue

-   A new section in the application, accessible only to admins, will display all `pending_review` submissions from the `submitted_artists` and `submitted_venues` tables.
-   From this interface, an admin can:
    -   **Approve:** The submission is moved from the `submitted_*` table to the main `artists` or `venues` table. The status in the `submitted_*` table is changed to `approved`.
    -   **Reject:** The status in the `submitted_*` table is changed to `rejected`. The submission is not added to the main tables.
    -   **Edit:** Before approving, an admin can edit the submitted data to correct typos or add missing information. 