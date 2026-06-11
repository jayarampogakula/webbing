# Administrator Setup and Settings Configuration

This document explains how to set up the administrator account, configure system settings, and manage licensing.

---

## 🚀 Initial Installation Setup Screen
When you first run Webbing on a new VPS/domain, the platform automatically detects that the default developer credentials (`admin@webbing.in` / `Admin123`) are active, or that no admin is configured, and routes you to the installation setup wizard:

* **Location**: Navigate to `http://yourdomain.com/setup`
* **Fields**:
  1. **SaaS Platform Branding Name**: Set the app's global display name (e.g. `Webbing`).
  2. **CodeCanyon License Purchase Code**: Enter your Envato/CodeCanyon purchase code/license key (valid UUID format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` or a custom direct key).
  3. **Administrator Full Name**: The name of the primary administrator.
  4. **Administrator Custom Email**: The login email you will use.
  5. **Admin Password / Confirm Password**: The password to secure your admin account.

Submitting this form transactionally upgrades the default account and registers the configuration details securely in the database. Subsequent visits to `/setup` are blocked.

---

## 🔒 CodeCanyon License Activation System
Webbing features a robust license verification system:
* **Format Check**: Purchase codes must match the standard Envato purchase code format (UUIDv4) or custom keys matching the pattern `WEBBING-XXXX-XXXX-XXXX-XXXX`.
* **Validation**: Validation is performed locally and offline to prevent external seller server dependencies, keeping your installation light and reliable.
* **Licensing Console**:
  * Navigate to **Admin Console > SaaS Licensing**.
  * View your active purchase code, activation status, and the platform version (`v0.8.0`).
  * You can update the purchase code or generate direct client keys using the integrated **License Key Generator**.

---

## ⚙️ Customizing Global Platform branding
To edit policies, email templates, and other platform details:
1. Log in to your administrator account and go to `/admin`.
2. Navigate to **Platform Settings**:
   * **Application Name / Support Email / Logo**: Propagation occurs globally across all landing templates, footers, and emails.
   * **UPI ID**: Set the default UPI address to receive offline plan payments (e.g., `yourname@ybl`).
   * **Terms / Privacy / Refund Policies**: Type in your custom markdown text. If left empty, default templates are rendered.
   * **Affiliate Referral Configuration**: Toggle the affiliate partner program on/off and configure referral commission percentages.
