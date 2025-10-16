# sekaLabs 2025 POS System

A modern, full-featured Point-of-Sale (POS) system built with React, TypeScript, and Supabase. This system provides comprehensive retail management capabilities with role-based access control, real-time inventory management, and detailed reporting.

![POS System](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.50.5-3ECF8E.svg)

## 🚀 Features

### Core POS Functionality

- **Point of Sale Terminal** - Intuitive checkout interface with product search and cart management
- **Receipt Printing** - Generate and print receipts for transactions
- **Multiple Payment Methods** - Support for various payment options
- **Sales Management** - Complete transaction history and management

### Inventory Management

- **Product Catalog** - Add, edit, and manage product inventory
- **Stock Tracking** - Real-time inventory levels and alerts
- **Category Management** - Organize products by categories
- **Barcode Support** - Product identification and quick scanning

### Customer Management

- **Customer Database** - Store and manage customer information
- **Purchase History** - Track customer buying patterns
- **Customer Profiles** - Detailed customer records and preferences

### User Management & Security

- **Role-Based Access Control** - Admin, Manager, and Cashier roles
- **User Authentication** - Secure login with Supabase Auth
- **Permission Management** - Granular access control for different features

### Reporting & Analytics

- **Sales Reports** - Comprehensive sales analytics and insights
- **Inventory Reports** - Stock levels, low inventory alerts
- **Transaction History** - Detailed transaction records
- **Performance Metrics** - Business performance tracking

### Additional Features

- **Discount Management** - Create and apply various discount types
- **Settings Configuration** - Customizable system settings
- **Dark/Light Theme** - Modern UI with theme switching
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.1
- **Backend**: Supabase (Database, Auth, Real-time)
- **Build Tool**: Vite 5.4.2
- **UI Components**: Custom components with Framer Motion animations
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Notifications**: SweetAlert2

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Supabase Account** - For database and authentication

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Keshara1997/POS-system.git
   cd POS-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL script in `supabase_init.sql` to set up your database schema
   - Copy your Supabase URL and anon key

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173` to view the application

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── customers/      # Customer management
│   ├── discounts/      # Discount management
│   ├── inventory/      # Inventory management
│   ├── layout/         # Layout components
│   ├── pos/            # POS terminal components
│   ├── reports/        # Reporting components
│   ├── settings/       # Settings components
│   ├── transactions/   # Transaction management
│   ├── users/          # User management
│   └── ui/             # Reusable UI components
├── context/            # React contexts
├── lib/                # Utility libraries and services
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
```

## 👥 User Roles

### Admin

- Full system access
- User management
- All reports and analytics
- System settings

### Manager

- POS operations
- Inventory management
- Customer management
- Sales reports
- Discount management

### Cashier

- POS terminal access only
- Process transactions
- View basic product information

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🗄️ Database Schema

The system uses Supabase with the following main tables:

- `users` - User accounts and roles
- `products` - Product catalog
- `categories` - Product categories
- `customers` - Customer information
- `transactions` - Sales transactions
- `transaction_items` - Individual transaction items
- `discounts` - Discount configurations

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface
- **Responsive Layout** - Works on all device sizes
- **Dark/Light Themes** - User preference support
- **Smooth Animations** - Enhanced user experience with Framer Motion
- **Intuitive Navigation** - Easy-to-use interface for all user types

## 🔒 Security Features

- **Authentication** - Secure user login with Supabase Auth
- **Role-Based Access** - Granular permissions system
- **Data Validation** - Input validation and sanitization
- **Secure API** - Protected database operations

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🌿 Branch Management

This project follows a structured branching strategy to ensure organized development and deployment:

### Branch Structure

- **`main`** - Production-ready code, always stable and deployable
- **`develop`** - Integration branch for features, staging environment
- **`feature/*`** - Feature development branches (e.g., `feature/user-authentication`)
- **`bugfix/*`** - Bug fix branches (e.g., `bugfix/inventory-calculation`)
- **`hotfix/*`** - Critical production fixes (e.g., `hotfix/security-patch`)
- **`release/*`** - Release preparation branches (e.g., `release/v1.1.0`)

### Branch Naming Conventions

- **Features**: `feature/description-of-feature`
- **Bug fixes**: `bugfix/issue-description`
- **Hotfixes**: `hotfix/critical-issue`
- **Releases**: `release/version-number`
- **Documentation**: `docs/update-description`

### Workflow

1. **Feature Development**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   # Make your changes
   git push origin feature/your-feature-name
   ```

2. **Bug Fixes**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b bugfix/issue-description
   # Fix the issue
   git push origin bugfix/issue-description
   ```

3. **Hotfixes** (for critical production issues)
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue
   # Fix the critical issue
   git push origin hotfix/critical-issue
   ```

## 🍴 Git Repository Fork

### Forking the Repository

To contribute to this project, you'll need to fork the repository:

1. **Fork on GitHub**

   - Go to the [repository page](https://github.com/Keshara1997/POS-system)
   - Click the "Fork" button in the top-right corner
   - Choose your account to fork to

2. **Clone Your Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/POS-system.git
   cd POS-system
   ```

3. **Add Upstream Remote**

   ```bash
   git remote add upstream https://github.com/Keshara1997/POS-system.git
   ```

4. **Keep Your Fork Updated**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git push origin main
   ```

### Working with Forks

- **Sync with upstream**: Regularly pull changes from the main repository
- **Create branches**: Always work on feature branches, never directly on main
- **Submit PRs**: Create pull requests from your fork to the main repository
- **Stay updated**: Keep your fork synchronized with the upstream repository

## 🤝 Contributing

### Getting Started

1. **Fork the repository** (see [Git Repository Fork](#-git-repository-fork) section above)
2. **Clone your fork** and set up the development environment
3. **Create a feature branch** following our [branch naming conventions](#branch-naming-conventions)
4. **Make your changes** and test thoroughly
5. **Commit your changes** with descriptive commit messages
6. **Push to your fork** and create a Pull Request

### Pull Request Process

1. **Create a Pull Request** from your feature branch to `develop`
2. **Fill out the PR template** with:

   - Description of changes
   - Screenshots (if applicable)
   - Testing instructions
   - Related issues (if any)

3. **Code Review** - Maintainers will review your code
4. **Address feedback** - Make requested changes
5. **Merge** - Once approved, your changes will be merged

### Commit Message Guidelines

Use conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:

```bash
git commit -m "feat: add user authentication system"
git commit -m "fix: resolve inventory calculation bug"
git commit -m "docs: update API documentation"
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**sekaLabs 2025**

- Email: info@sekalabs.lk
- GitHub: [@Keshara1997](https://github.com/Keshara1997)

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by Supabase for backend services
- UI components inspired by modern design systems
- Icons provided by Lucide React

---

**sekaLabs 2025** - Empowering businesses with modern POS solutions.
