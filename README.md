> ⚠️ **Pre-release.** The plugin is published under a `5.0.0-alpha` version while the API settles. It is functional end to end, but expect breaking changes between alpha releases. Please [open an issue](https://github.com/breezertwo/strapi-plugin-review-flow/issues) for bugs or suggestions.

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
- **Cancel Requests**: Withdraw a review request whose reviewer is no longer available

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

A review always involves two people — you cannot request a review from yourself, and you cannot approve a review you requested. If a reviewer becomes unavailable, the requester (or a super admin) can cancel the request from the edit view or the Task Center.

---

## 🔐 Permissions

Grant these under **Settings → Roles → Plugins → Review Workflow**:

| Permission                   | Allows                                                                   |
| ---------------------------- | ------------------------------------------------------------------------ |
| `Can Assign Review`          | Request a review, re-request a rejected one, cancel own requests         |
| `Can Bulk Assign Reviews`    | Request reviews for several entries from the list view                   |
| `Can Approve/Reject Reviews` | Act on reviews assigned to you — also makes you selectable as a reviewer |
| `Publish Without Review`     | Bypass the approval gate entirely                                        |

> The approval gate is enforced on Strapi's document service, which covers the admin panel and the REST/GraphQL APIs. Code writing through `strapi.db.query` or directly to the database bypasses it, as does any role holding **Publish Without Review**.

---

## 🔧 Configuration

The plugin works out of the box with no configuration required. Just enable in `plugin.ts` and go!

```ts
// config/plugins.ts
module.exports = {
  'review-workflow': {
    enabled: true,
    config: {
      /**
       * (optional) The field to use as title in the review center
       */
      titleField: 'your_title_field_name',
      /**
       * (optional) The content types to enable review flow for. Defaults to all content if not specified.
       */
      contentTypes: ['api::article.article'],
    },
  },
};
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).

If you find this plugin helpful, please consider:

- ⭐ **Starring** the repository
- 🐛 **Reporting** bugs and issues
- 🤝 **Contributing** to the project
- 💡 **Suggesting** new features
- 📣 **Sharing** with others who might benefit
