# Page snapshot

```yaml
- navigation:
  - link " Concert Aggregator":
    - /url: /
  - link " Home":
    - /url: /
  - link " Venues":
    - /url: /venues
  - link " Artists":
    - /url: /artists
  - link " Login":
    - /url: /login
  - link "Sign Up":
    - /url: /login?signup=true
- alert
- button "Open Next.js Dev Tools":
  - img
- heading "Forgot Password" [level=1]
- paragraph: Enter your email address and we will send you a link to reset your password.
- text: "An unexpected error occurred. Please try again. Email:"
- textbox "Email:"
- button "Send Reset Link"
- link "Back to Login":
  - /url: /login
```