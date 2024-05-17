import express from 'express';
import { upload } from '../multer.js';
import {
  createCategory,
  getCategories,
  getCategory,
  editCategory
} from '../controllers/categoryControllers.js';

const router = express.Router();

//POST Create Category
router.post('/create', upload.single('image'), createCategory);

// GET all categories
router.get('/', getCategories);

// GET category by name or ID
router.get('/:identifier', getCategory);

// PUT Edit category attributes (name, description, taxApplicability, tax)
router.put('/:id', upload.none(), editCategory); // Added multer middleware for parsing multipart/form-data

export { router as categoryRouter };
