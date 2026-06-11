# Release Notes & Version History

This document tracks version releases, hotfixes, and structural updates to the Webbing SaaS platform.

---

## 🏷️ v0.8.0 - Installation Setup Settings & Release Overwrite Protection
**Release Date**: June 11, 2026

Version `v0.8.0` introduces essential features to turn Webbing into a distribution-ready CodeCanyon product, making installations on custom domains easy, secure, and resilient to updates.

### 🚀 Key Features and Enhancements
1. **Initial Installation Setup Wizard (`/setup`)**:
   * Created a responsive setup wizard that displays on fresh installations.
   * Prompts hosts to choose a custom app branding name, administrator credentials, and a secure password.
   * Prevents standard users from re-triggering configuration once initialized.
2. **CodeCanyon Purchase Code Activation**:
   * Integrated Envato purchase code validation format checks.
   * Stored the validated purchase code in the database system settings.
   * Created a **SaaS Licensing** tab in the Admin Console to view activation status, key history, and generate direct customer activation keys.
3. **Database Seeding and Next-Release Safeguards**:
   * Wrapped default user creations (`admin@webbing.in` and `user@webbing.in`) in checks to skip execution if database records exist, preventing default credentials from being recreated if the admin changed their email or password.
   * Replaced database seeding upsert updates with empty blocks (`update: {}`), ensuring that user-customized prices, plans, UPI payment IDs, and settings are never overwritten during next-release upgrades.
4. **General Page Layouts and Sizing**:
   * Widened the step-by-step generator wizard container width to `1150px` for a wider layout.
   * Corrected broken image preview pathing for "Modern Startup" design templates.
   * Handled section focus locks so active manual editor sections persist during updates without jumping to default views.
5. **eCommerce and Catalog Enhancements**:
   * Added dynamic storefront hero banner bindings to load directly from editor database sections.
   * Integrated editable "About" and "Contact" nav pages inside standard generated storefronts.
   * Added "Edit Product" actions inside the Catalog admin table, with support for multi-image uploads (both URLs and local files) and thumbnail sliders.
6. **API Key Security and Credit Bypass**:
   * Added backend filters to prevent admin LLM API credentials from leaking to standard users.
   * Configured an automatic credit bypass logic allowing users with active custom keys to bypass credits checking and billing constraints.
