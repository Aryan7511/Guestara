import express from 'express';
import { upload } from '../multer.js';
import {
  createItem,
  getAllItems,
  getItemsByCategory,
  getItemsBySubcategory,
  getItem,
  editItem,
  searchItem
} from '../controllers/itemControllers.js';

const router = express.Router();

//POST Create Item
router.post('/create', upload.single('image'), createItem);

// GET all Items
router.get('/', getAllItems);

// GET all Items under a category
router.get('/category/:categoryID', getItemsByCategory);

// GET all Items under a subcategory
router.get('/subcategory/:subcategoryID', getItemsBySubcategory);

// Search item by name
router.get('/search', searchItem);

// GET Item by name or ID
router.get('/:identifier', getItem);

// PUT Edit Item attributes (name, description, taxApplicability, tax)
router.put('/:id', upload.none(), editItem); // Added multer middleware for parsing multipart/form-data


export { router as itemRouter };
