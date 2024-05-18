# Menu Management System

This project is a backend Menu Management System for restaurants to streamline and automate menu creation and management.

## Features

Category Management:
- Create, read, and update menu categories.

Subcategory Management:
- Organize items into subcategories within main categories for better structure and navigation.

Item Management:
- Add, edit, and update items within categories or subcategories, complete with details like description, price, and applicable taxes.

Search Functionality:
- Search for items by name or ID for quick access to information.
## Base URL

The backend is hosted on Render. The base URL for the API is:
[https://guestara-task-aryan.onrender.com](https://guestara-task-aryan.onrender.com)

To verify if the hosted backend is operational, [click here](https://guestara-task-aryan.onrender.com/test). If you see "Server is Running!" in the response, the backend is up and running.


## API Documentation

For detailed API documentation, please refer to the Postman documentation:

- [Category Collection](https://documenter.getpostman.com/view/29482476/2sA3JT3yWt)
- [Sub-Category Collection](https://documenter.getpostman.com/view/29482476/2sA3JT3ybH)
- [Item Collection](https://documenter.getpostman.com/view/29482476/2sA3JT3ybF)
## API Routes

#### Category Routes

- **POST /api/category/create** - Create a new category
- **GET /api/category/** - Get all categories
- **GET /api/category/:identifier** - Get a category by name or ID
- **PUT /api/category/:id** - Edit category attributes (name, description, taxApplicability, tax)

#### Subcategory Routes

- **POST /api/subcategory/create** - Create a new subcategory
- **GET /api/subcategory/** - Get all subcategories
- **GET /api/subcategory/category/:categoryID** - Get all subcategories under a category
- **GET /api/subcategory/:identifier** - Get a subcategory by name or ID
- **PUT /api/subcategory/:id** - Edit subcategory attributes (name, description, taxApplicability, tax)

#### Item Routes

- **POST /api/item/create** - Create a new item
- **GET /api/item/** - Get all items
- **GET /api/item/category/:categoryID** - Get all items under a category
- **GET /api/item/subcategory/:subcategoryID** - Get all items under a subcategory
- **GET /api/item/search** - Search item by name
- **GET /api/item/:identifier** - Get an item by name or ID
- **PUT /api/item/:id** - Edit item attributes (name, description, taxApplicability, tax)


## Run Locally

Clone the project

```bash
  git clone https://github.com/Aryan7511/Guestara.git
```

Go to the Guestara directory

```bash
  cd Guestara
```
Install dependencies

```bash
  npm install
```

Rename the environment file

```bash
  Rename the .env.example file to .env
```
Set up environment variables
```bash
  Open the .env file and set the DB_URL variable to your MongoDB connection URL.
```

Start the server

```bash
  npm start
```

## Tech Stack

**Server:** Node, Express

