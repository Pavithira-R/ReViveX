# ReViveX – Repair. Reuse. Recycle.

ReViveX is a mobile application developed for the Mobile Application Development project.

## Project Goal

ReViveX provides a circular-economy platform for unwanted, damaged, old, or unused electronic devices. Users can choose to:

- Repair
- Reuse
- Sell
- Donate
- Recycle

## Main Features

- User registration and login
- Role-based access and user profiles
- Electronic item posting and management
- Categories, condition, photos, and location
- Search and filtering
- Smart Recommendation
- Repair service providers
- Repair requests, quotations, bookings, and status tracking
- Reuse and selling listings
- Offers and arrangements
- Donation flow
- Recycling requests
- Chat and messaging
- Notifications
- Reviews and ratings
- Eco points, badges, and environmental impact

## Technology Stack

**Mobile:** React Native, TypeScript

**Backend:** Node.js, Express.js

**Database:** PostgreSQL, Prisma ORM

**Supporting Tools:** Git, GitHub, Figma, Postman, Android Studio, Google Maps/Location Services, Firebase Cloud Messaging, Cloudinary or Supabase Storage

## Architecture

```text
React Native Mobile App
          |
          v
Node.js + Express REST API
          |
          v
      Prisma ORM
          |
          v
   PostgreSQL Database
```

## Team Modules

| Member | Module |
|---|---|
| Member 1 | Authentication & User Management |
| Member 2 | Item Management |
| Member 3 | Smart Recommendation & Discovery |
| Member 4 | Repair & Service Providers |
| Member 5 | Reuse / Sell / Donate / Recycle |
| Member 6 | Communication, Reviews, Eco Impact & Integration |

## Git Branching Strategy

```text
main
  |
  └── develop
       |
       ├── feature/auth
       ├── feature/items
       ├── feature/recommendation
       ├── feature/repair
       ├── feature/reuse-recycle
       └── feature/communication-impact
```

- `main` – stable project version
- `develop` – shared development and integration branch
- `feature/*` – individual member branches
- Do not develop directly on `main`
- Pull the latest `develop` before starting work
- Use meaningful commit messages
- Use Pull Requests for feature integration
- Test features before merging

## Documentation

Project development PDFs are maintained separately from the source-code repository unless the team later decides to add selected documentation to GitHub.

## Security

Never commit:

- API keys
- Passwords
- Database credentials
- Secret values
- `.env` files containing secrets
- Private credentials

## Project Status

Development setup phase.

**ReViveX – Repair. Reuse. Recycle.**
