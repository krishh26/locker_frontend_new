# Locker Frontend

A comprehensive Learning Management System (LMS) built with Next.js, React, and TypeScript. This platform provides role-based access control for managing courses, continuing professional development (CPD), evidence libraries, and more.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (with Turbopack)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Redux Toolkit, Zustand
- **Form Management**: React Hook Form with Zod validation
- **Data Tables**: TanStack Table
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Theming**: next-themes (dark/light mode)

## ✨ Key Features

### Course Management
- **Course Builder**: Create and manage three types of courses:
  - **Qualification Courses**: Multi-step courses with units, assessment criteria, and topics
  - **Standard Courses**: Courses with modules and topics
  - **Gateway Courses**: Single-step courses with questions and assigned standards
- Course resources and details management
- Module/Unit progress tracking

### Learning & Development
- **CPD (Continuing Professional Development)**: Track and manage professional development activities
- **Skills Scan**: Assess and track learner skills
- **Learning Plan**: Create and manage personalized learning plans
- **Evidence Library**: Store and manage evidence documents
- **Resources**: Access learning materials and resources

### Communication & Collaboration
- **Forum**: Community discussions and knowledge sharing
- **Chat**: Real-time messaging
- **Mail**: Internal messaging system
- **Calendar**: Event and session management
- **Tasks**: Task management system

### Forms & Surveys
- Dynamic form builder
- Survey creation and management
- Form submission tracking
- Learner forms management

### Admin Features
- **User Management**: Manage users, learners, trainers, and employers
- **Course Administration**: Full course lifecycle management
- **Broadcast Messages**: Send announcements to users
- **QA Sample Plan**: Quality assurance planning
- **Caseload Management**: Manage learner caseloads
- **Funding Bands**: Manage funding configurations
- **Pricing Management**: Configure pricing plans
- **Settings**: System-wide configuration

### Additional Features
- **Health & Wellbeing**: Track and manage wellbeing
- **Time Log**: Track time spent on activities
- **Support**: Help and support system
- **FAQs**: Frequently asked questions
- **Documents to Sign**: Digital document signing workflow

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js app router
│   ├── (admin-root)/            # Admin-only routes
│   ├── (learner-root)/          # Learner/shared routes
│   ├── (public-root)/           # Public routes
│   ├── (user-root)/             # User dashboard
│   ├── auth/                    # Authentication pages
│   └── errors/                  # Error pages
├── components/                   # Reusable components
│   ├── ui/                      # shadcn/ui components
│   ├── forms/                   # Form components
│   └── dashboard/               # Dashboard components
├── config/                      # Configuration files
│   ├── auth-roles.ts           # Role definitions
│   └── route-access.ts         # Route access rules
├── contexts/                    # React contexts
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
├── store/                       # Redux store and slices
├── types/                       # TypeScript type definitions
└── utils/                       # Utility functions
```

## 👥 User Roles

The system supports the following roles:

- **Admin**: Full system access and administration
- **Learner**: Access to learning materials, courses, and personal development tools
- **Trainer**: Training and course delivery capabilities
- **Employer**: Employer-specific features and learner management
- **LIQA**: Lead Internal Quality Assurer
- **IQA**: Internal Quality Assurer
- **EQA**: External Quality Assurer

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd locker_frontend_new
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env.local file with your configuration
# Add your API endpoints, authentication keys, etc.
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint


## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components built on Radix UI primitives. Components are located in `src/components/ui/` and can be customized to match your design system.

## 🔐 Authentication & Authorization

The application implements a robust role-based access control (RBAC) system:

- **Middleware**: Route-level access control (`src/middleware.ts`)
- **Route Groups**: Organized by access level (admin-root, learner-root, user-root, public-root)
- **Dynamic Content**: Dashboard content changes based on user role
- **Sidebar Filtering**: Navigation items filtered by role

## 📦 Key Dependencies

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Redux Toolkit**: State management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **TanStack Table**: Data tables
- **Radix UI**: Accessible component primitives

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Follow the role-based routing guidelines
4. Write clear commit messages
5. Test your changes thoroughly

## 📄 License

[Add your license information here]

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)

---

Built with ❤️ using Next.js and React
