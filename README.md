# School CRUD System - Backend

This is the backend repository for a school CRUD system, built using express and prisma. The main features include CRUD operations for Rooms/Classes, Students, and Siblings, the ability to view details for these entities, an admin section, a login section, and a dashboard for non-authenticated users.

![alt text](<images/my classes.gif>)
here you can create dynamically the claasses, name and capacity, create students and assign them to a class, assign them a sibling if exists. and visualize all the information seamlessly

## Getting Started

To get started, clone this repository and run `npm install` to install dependencies. You will need to create a `.env` file in the root directory of the project and add the following variables:
```
DATABASE_URL="db://url"
JWT_SECRET="64 bit ASCII string"
```
The `JWT_SECRET` can be generated using the following command:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Ensure your .env file is correctly set with DATABASE_URL.
to update the remote db schema:
```
npm i
npx prisma migrate dev --name init
```
Run this command in your terminal to create the admin user:
```
node -e "const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcrypt'); const prisma = new PrismaClient(); (async () => { const hashedPassword = bcrypt.hashSync('jqgdgVmVzjv', 10); await prisma.users.create({ data: { email: 'bob@example.com', password: hashedPassword, role: 'ADMIN' } }); console.log('Admin user created'); prisma.$disconnect(); })().catch(console.error);"
```

## Database Schema

The database schema includes the following tables:

### Classrooms
- id (int, auto-incremented)
- name (string, unique)
- capacity (int)
- students (relationship to `students` table)

### Students
- id (int, auto-incremented)
- name (string)
- gender (string)
- classroom_id (int, foreign key to `id` in `classrooms` table)
- profile_image_path (string)
- age (int)
- siblings (relationship to `siblings` table)

### Siblings
- id (int, auto-incremented)
- student_id (int, foreign key to `id` in `students` table)
- sibling_id (int, foreign key to `id` in `students` table)

### Users
- id (int, auto-incremented)
- email (string, unique)
- name (string)
- password (string)
- role (enum, either `USER` or `ADMIN`)

## Scripts

- `npm run dev`: start the development server
- `npm run build`: build the application for production
- `npm start`: start the production server

## Dependencies

- express
- prisma
- @prisma/client
- bcrypt
- crypto
- jsonwebtoken

## Plus Features

Additional features included in this project include:

- Dropdown selectors and descriptive sibling cards with delete button
- Suggestions in search by name classrooms
- MySQL database with foreign key relations and field unique validations according to app logic
- JWT authentication with session expiration by datetime and two authentication roles: USER and ADMIN
- Secure routing
- React hooks for app state
- Search by name in classes
- Search by name in students in class detail page
- Edit/delete buttons when auth session valid
- Profile image URL field in database (service not deployed)
- Full admin section and control of rooms/classes/students/details
- Env variables for backend API endpoints
- Tailwind CSS for all the interfaces
- Modals for easy editing, creating, and deleting
- Custom 404 error page

## Links

- [Express Documentation](https://expressjs.com/)
- [Generating a Random JWT Secret](https://mojitocoder.medium.com/generate-a-random-jwt-secret-22a89e8be00d)
- [JSON Web Tokens Documentation](https://www.npmjs.com/package/jsonwebtoken)
- [Railway App](https://railway.app/)
- [Custom Error Pages in Next.js](https://nextjs.org/docs/advanced-features/custom-error-page)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Environment Variables in Next.js](https://nextjs.org/docs/api-reference/next.config.js/environment-variables)