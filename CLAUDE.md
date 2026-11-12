# Finance Audit Pro - Project Master Prompt

## Project Overview
Finance Audit Pro is a comprehensive audit management platform designed to streamline financial compliance, streamline audit processes, and provide real-time insights for finance teams.

## Core Principles
- **Accuracy First**: All financial calculations and reports must be precise and auditable
- **Compliance Ready**: Every feature must adhere to SOX, GAAP, and industry-specific regulatory requirements
- **User-Centric Design**: Finance professionals need tools that save time, not create busywork
- **Transparency**: All audit trails and methodology must be clear and accessible

## Team Structure
- **Project Lead**: [To be determined]
- **Lead Developer**: [To be determined]
- **QA Specialist**: [To be determined]

## Architecture & Technology Stack
- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with role-based access control
- **Hosting**: AWS (S3 for storage, EC2 for compute, RDS for database)

## Key Features (MVP)
1. **Client Onboarding**
   - Document upload and categorization
   - KYC verification workflow
   - Client profile management

2. **Audit Workflow**
   - Task assignment and tracking
   - Evidence collection
   - Findings documentation
   - Review and approval cycles

3. **Reporting Engine**
   - Real-time dashboards
   - Customizable audit reports
   - Export to PDF/Excel
   - Executive summaries

4. **Compliance Management**
   - Regulatory requirement checklist
   - Automated compliance scoring
   - Evidence mapping to requirements

## Data Model
- **Clients**: Client profiles, documents, correspondence
- **Audits**: Audit plans, workpapers, findings, status
- **Users**: Team members, roles, permissions
- **Documents**: Uploaded files, version history, access logs
- **Standards**: Compliance frameworks, control libraries

## File Structure
```
Finance Aduit Pro/
├── CLAUDE.md              # This master prompt
├── README.md              # Project overview and setup
├── package.json           # Dependencies and scripts
├── prisma/                # Database schema
├── src/
│   ├── server/            # Backend code
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, validation
│   │   └── services/      # Business logic
│   └── client/            # Frontend code
│       ├── components/    # Reusable UI
│       ├── pages/         # Route-based pages
│       └── hooks/         # Custom React hooks
├── tests/                 # Unit and integration tests
└── docs/                  # Documentation
```

## Development Standards
- **Code Style**: TypeScript strict mode, ESLint, Prettier
- **Testing**: Jest for unit tests, Cypress for E2E
- **Documentation**: JSDoc for all functions, Markdown for design docs
- **Git Workflow**: Feature branches, pull requests, conventional commits

## Security Requirements
- All data encrypted at rest and in transit
- Role-based access control (RBAC) enforced on all endpoints
- Audit logs for all sensitive operations
- Regular security scans (OWASP Top 10 coverage)

## Compliance Requirements
- Maintain complete audit trail of all file interactions
- Implement retention policies per regulatory requirements
- Ensure audit evidence is tamper-evident
- Support for audit sampling and testing

## Known Bugs/Issues
- None currently

## Getting Started
1. Clone repository
2. Run `npm install`
3. Set up environment variables (see .env.example)
4. Run `npx prisma migrate dev` to set up database
5. Run `npm run dev` for development

## Questions to Ask When Stuck
1. What is the regulatory requirement this impacts?
2. How does this affect auditability?
3. Have we considered the data retention implications?
4. What happens if this financial data is incorrect?