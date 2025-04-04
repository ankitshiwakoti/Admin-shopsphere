# ShopSphere Admin Panel

A collaborative project for managing the ShopSphere e-commerce platform's admin panel.

## Project Structure

```
shopsphere-admin/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── public/         # Static files
├── routes/         # Route definitions
├── scripts/        # Utility scripts
└── views/          # EJS templates
```

## Team Members

- Backend Developer: Ankit Shiwakoti
- Frontend Developer 1: Krisha Gurung
- Frontend Developer 2: Rupinder Kaur

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd shopsphere-admin
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shopsphere-admin
SESSION_SECRET=your-secret-key
```

4. Start the development server:
```bash
npm run dev
```

## Development Workflow

1. **Branch Naming Convention**:
   - Feature branches: `feature/feature-name`
   - Bug fixes: `fix/bug-description`
   - Frontend work: `frontend/component-name`
   - Backend work: `backend/feature-name`

2. **Commit Messages**:
   - Use clear, descriptive commit messages
   - Format: `[type] description`
   - Types: feat, fix, docs, style, refactor, test, chore

3. **Pull Request Process**:
   - Create PR with clear description
   - Request reviews from team members
   - Address review comments
   - Merge only after approval

4. **Code Review Guidelines**:
   - Check for code quality
   - Ensure tests pass
   - Verify functionality
   - Look for security issues

## Frontend Development

Frontend developers should:
1. Work in the `views/` directory
2. Follow the existing layout structure
3. Use Bootstrap for styling
4. Test responsive design
5. Ensure cross-browser compatibility

## Backend Development

Backend developer should:
1. Work in `controllers/`, `models/`, and `routes/` directories
2. Follow RESTful API principles
3. Implement proper error handling
4. Add input validation
5. Write API documentation

## Available Scripts

- `npm run dev`: Start development server
- `npm start`: Start production server
- `npm run create-admin`: Create initial admin user

## Getting Help

- For frontend issues: Contact [Frontend Developer 1]
- For backend issues: Contact [Backend Developer]
- For general questions: Create an issue in the repository 

## Route Structure and Permission System

### Authentication and Authorization

The application uses a multi-layered authentication and authorization system:

1. **Authentication**: Verifies that a user is logged in
2. **Role-based Authorization**: Checks if a user has the required role (admin, superadmin)
3. **Permission-based Authorization**: Checks if a user has specific permissions (manage_products, manage_categories, etc.)

### Middleware

- **protect**: Basic authentication check, ensures user is logged in
- **isAdmin**: Checks if user has admin or superadmin role
- **isSuperAdmin**: Checks if user has superadmin role
- **authorize**: Checks if user has one of the specified roles
- **checkPermission**: Checks if user has a specific permission

### Route Structure

All admin routes are consolidated in `routes/admin.js` and organized by feature:

#### Public Routes (No Authentication Required)
- `/admin/login`: Login page
- `/admin/signup`: Signup page
- `/admin/logout`: Logout

#### Protected Routes (Authentication Required)
- `/admin/dashboard`: Dashboard (requires 'view_dashboard' permission)

#### Category Management Routes
- View routes:
  - `/admin/categories`: Category management page (requires 'manage_categories' permission)
  - `/admin/categories/:id/edit`: Edit category page (requires 'manage_categories' permission)
- API routes:
  - `/admin/categories/create`: Create category (requires 'manage_categories' permission)
  - `/admin/categories/:id`: Update category (requires 'manage_categories' permission)
  - `/admin/categories/:id/delete`: Delete category (requires 'manage_categories' permission)

#### Product Management Routes
- View routes:
  - `/admin/products/manage`: Product management page (requires 'manage_products' permission)
  - `/admin/products/create`: Create product page (requires 'manage_products' permission)
  - `/admin/products/edit/:id`: Edit product page (requires 'manage_products' permission)
- API routes:
  - `/admin/products/create`: Create product (requires 'manage_products' permission)
  - `/admin/products/edit/:id`: Update product (requires 'manage_products' permission)
  - `/admin/products/:id`: Delete product (requires 'manage_products' permission)

#### Customer Management Routes
- View routes:
  - `/admin/customers`: Customer list page (requires 'manage_customers' permission)
  - `/admin/customers/:id`: Customer details page (requires 'manage_customers' permission)
  - `/admin/customers/:id/orders`: Customer orders page (requires 'manage_customers' permission)
- API routes:
  - `/admin/customers/:id/status`: Update customer status (requires 'manage_customers' permission)
  - `/admin/orders/:id/status`: Update order status (requires 'manage_customers' permission)

#### Admin Management Routes (Superadmin Only)
- `/admin/admins`: Admin list page
- `/admin/admins/:id/edit`: Edit admin page
- `/admin/admins`: Create admin
- `/admin/admins/:id/update`: Update admin
- `/admin/admins/:id/delete`: Delete admin

#### Role Management Routes (Superadmin Only)
- View routes:
  - `/admin/roles`: Role management page
- API routes:
  - `/admin/roles/list`: Get all roles
  - `/admin/roles`: Create role
  - `/admin/roles/assign`: Assign role to admin
  - `/admin/roles/remove`: Remove role from admin
  - `/admin/roles/:roleId/admins`: Get admins assigned to a role

#### Error Pages
- `/admin/unauthorized`: Unauthorized access page

### API Routes

API routes are organized separately:

- `/api/roles`: Role management API (requires superadmin role)

## Permission System

The application uses a role-based permission system:

1. **Roles**: Define sets of permissions (e.g., Product Manager, Category Manager)
2. **Permissions**: Define specific actions (e.g., manage_products, manage_categories)
3. **Admins**: Can have multiple roles, inheriting all permissions from those roles

### Available Permissions

- `view_dashboard`: Access to the dashboard
- `manage_products`: Manage products (create, update, delete)
- `manage_categories`: Manage categories (create, update, delete)
- `manage_customers`: Manage customers (view, update status)
- `manage_orders`: Manage orders (view, update status)
- `manage_admins`: Manage admins (create, update, delete)
- `manage_roles`: Manage roles (create, assign, remove) 