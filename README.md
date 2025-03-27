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

- Backend Developer: [Your Name]
- Frontend Developer 1: [Name]
- Frontend Developer 2: [Name]

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