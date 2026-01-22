# Strapi Plugin Review Workflow

Free & simple editorial review workflow plugin for Strapi 5. Add an approval gate to your content to ensure quality and consistency or secure your content from unauthorized publication.

![Plugin Version](https://img.shields.io/badge/version-5.0.0-blue)
![Strapi Version](https://img.shields.io/badge/strapi-v5.0.0+-green)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Review Requests**: Assign content reviews to specific users
- **Approval Gate**: Documents require approval before publishing
- **Task Center**: Dashboard showing reviews assigned to you and by you
- **List View Column**: Review status visible in content list
- **i18n Support**: Per-locale review tracking

## 📦 Installation

```bash
npm install strapi-plugin-review-workflow
```

## 👮‍♀️ Permissions

Configure in Settings → Administration Panel → Roles:

| Permission           | Description                 |
| -------------------- | --------------------------- |
| `review.assign`      | Request reviews from others |
| `review.approve`     | Approve assigned reviews    |
| `review.reject`      | Reject assigned reviews     |
| `review.bulk-assign` | Bulk request reviews        |

## 🎖️ 3 Simple States

| Status     | Description                |
| ---------- | -------------------------- |
| `pending`  | Awaiting reviewer action   |
| `approved` | Approved, can be published |
| `rejected` | Rejected, needs revision   |
