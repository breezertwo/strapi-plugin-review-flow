⚠️ This plugin is still in development and IS NOT FULLY FUNCTIONAL. Use at your own risk and do not rely on it for production environments yet. If you encounter any issues or have suggestions for improvement, please open an issue on the [GitHub repository](https://github.com/breezertwo/strapi-plugin-review-flow).

# Strapi Plugin Review Flow

Free & simple editorial review workflow plugin for Strapi 5. Add an approval workflow to your content to ensure quality & consistency and secure your content from unauthorized publication.

<p align="center">
  <a href="https://www.npmjs.com/package/strapi-plugin-review-flow">
    <img src="https://img.shields.io/npm/v/strapi-plugin-review-flow?style=flat-square&color=blue" alt="NPM Version" />
  </a>
  <a href="https://github.com/strapi/strapi">
    <img src="https://img.shields.io/badge/strapi-v5.0.0+-green?style=flat-square" alt="Strapi Version" />
  </a>
  <a href="https://github.com/breezertwo/strapi-plugin-review-flow/blob/main/LICENSE.md">
    <img src="https://img.shields.io/npm/l/strapi-plugin-review-flow?style=flat-square" alt="License" />
  </a>
</p>

---

## ✨ Features

- **Review Requests**: Assign content reviews to specific users
- **Approval Workflow**: Documents require approval before publishing
- **Task Center**: Dashboard showing reviews assigned to and by you
- **List View Column**: Review status visible in content list view
- **Comments & History**: Add comments when assigning or rejecting and see history until published. Add multiple comments right next to your content fields for detailed feedback.
- **i18n Support**: Per-locale review tracking
- **Bulk Actions**: Assign reviews to multiple entries at once

---

## 📸 Screenshots

![dragdropcrop](https://image2url.com/r2/default/gifs/1772834139956-79274ce8-c8d3-40f9-9f96-c3e7aa9a71eb.gif)

---

## 📦 Installation

```bash
# npm
npm install strapi-plugin-review-flow
```

---

## 🚀 How It Works

### 3 Simple States

| Status     | Badge | Description                   |
| ---------- | ----- | ----------------------------- |
| `pending`  | 🟡    | Awaiting reviewer action      |
| `approved` | 🟢    | Approved and ready to publish |
| `rejected` | 🔴    | Rejected, needs revision      |

### Step-by-Step

1. **Author** creates or edits content
2. **Author** requests a review from a user
3. **Reviewer** sees the task in their Task Center
4. **Reviewer** comments and rejects for revision or approves
5. If **approved**: content can be published

---

## 🔐 Permissions

Grant under **Settings → Roles → Plugins → Review Workflow**:

| Permission                   | Allows                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| `Can Assign Review`          | Request, re-request, & cancel requests                        |
| `Can Bulk Assign Reviews`    | Request reviews for several entries from the list view        |
| `Can Approve/Reject Reviews` | Act on assigned reviews & makes user selectable as a reviewer |
| `Publish Without Review`     | Bypass the approval gate                                      |

> The approval gate is enforced on Strapi's document service, which covers the admin panel and the REST/GraphQL API. Code writing through `strapi.db.query` or directly to the database bypasses it.

---

## 🔧 Configuration

The plugin works out of the box with no configuration required. Just enable in `plugin.ts` and go!

```ts
// config/plugins.ts
module.exports = {
  "review-workflow": {
    enabled: true,
    config: {
      /**
       * (optional) The field to use as title in the review center
       */
      titleField: "your_title_field_name",
      /**
       * (optional) The content types to enable review flow for. Defaults to all content if not specified.
       */
      contentTypes: ["api::article.article"],
    },
  },
};
```

The review flow only applies to `api::` content types that have draft & publish enabled. Listing a
content type without draft & publish in `contentTypes` has no effect.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).

If you find this plugin helpful, please consider:

- ⭐ **Starring** the repository
- 🐛 **Reporting** bugs and issues
- 🤝 **Contributing** to the project
- 💡 **Suggesting** new features
- 📣 **Sharing** with others who might benefit
