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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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
