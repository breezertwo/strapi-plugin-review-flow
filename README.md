⚠️ This plugin is still in development and IS NOT FULLY FUNCTIONAL. Use at your own risk and do not rely on it for production environments yet. If you encounter any issues or have suggestions for improvement, please open an issue on the [GitHub repository](https://github.com/breezertwo/strapi-plugin-review-flow).

# Strapi Plugin Review Flow

Free & simple editorial review workflow plugin for Strapi 5. Add an approval gate to your content to ensure quality and consistency or secure your content from unauthorized publication.

<p align="center">
  <a href="https://www.npmjs.com/package/strapi-plugin-review-flow">
    <img src="https://img.shields.io/npm/v/strapi-plugin-review-flow?style=flat-square&color=blue" alt="NPM Version" />
  </a>
  <a href="https://github.com/strapi/strapi">
    <img src="https://img.shields.io/badge/strapi-v5.0.0+-green?style=flat-square" alt="Strapi Version" />
  </a>
  <a href="https://github.com/breezertwo/strapi-plugin-review-flow/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/strapi-plugin-review-flow?style=flat-square" alt="License" />
  </a>
</p>

---

## 🎯 Why Review Flow?

Strapi's built-in review workflows are an **Enterprise-only feature**. This plugin brings essential editorial review capabilities to the **Community Edition** — completely free and open source.

---

## ✨ Features

- **Review Requests**: Assign content reviews to specific users
- **Approval Gate**: Documents require approval before publishing
- **Task Center**: Dashboard showing reviews assigned to you and by you
- **List View Column**: Review status visible in content list
- **Comments & History**: Add comments when assigning or rejecting and see history until published
- **i18n Support**: Per-locale review tracking
- **Bulk Actions**: Assign reviews to multiple entries at once

---

## 📸 Screenshots

<!--
TODO: Add screenshots
<p align="center">
  <img src="docs/screenshots/task-center.png" alt="Task Center" width="800" />
</p>
-->

_Coming soon_

---

## 📦 Installation

```bash
# npm
npm install strapi-plugin-review-flow
```

---

## 🚀 How It Works

### The Review Cycle

```

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Draft │────▶│ Pending │────▶│ Approved │────▶ Ready to Publish
│ (Author) │ │ (Reviewer) │ │ │
└─────────────┘ └──────┬──────┘ └─────────────┘
│
▼
┌─────────────┐
│ Rejected │────▶ Back to Author
│ │
└─────────────┘

```

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
4. **Reviewer** approves or rejects
5. If **approved**: content can be published
6. If **rejected**: author revises and re-requests review

---

## 👮‍♀️ Permissions

Configure permissions in **Settings → Administration Panel → Roles**:

| Permission           | Description                 |
| -------------------- | --------------------------- |
| `review.assign`      | Request reviews from others |
| `review.approve`     | Approve assigned reviews    |
| `review.reject`      | Reject assigned reviews     |
| `review.bulk-assign` | Bulk request reviews        |

---

## 🔧 Configuration

The plugin works out of the box with no configuration required. Just enable and go!

```ts
// config/plugins.ts
module.exports = {
  'review-flow': {
    enabled: true,
  },
};
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 💖 Support

If you find this plugin helpful, please consider:

- ⭐ **Starring** the repository
- 🐛 **Reporting** bugs and issues
- 🤝 **Contributing** to the project
- 💡 **Suggesting** new features
- 📣 **Sharing** with others who might benefit
