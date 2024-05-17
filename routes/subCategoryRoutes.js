import express from 'express';
import { upload } from '../multer.js';
import {
  createSubCategory,
  getSubCategories,
  getSubCategoriesByCategory,
  getSubcategory,
  editSubcategory
} from '../controllers/subCategoryControllers.js';

const router = express.Router();

//POST Create Subcategory
router.post('/create', upload.single('image'), createSubCategory);

// GET all subcategories
router.get('/', getSubCategories);

// GET all subcategories under a category
router.get('/category/:categoryID', getSubCategoriesByCategory);

// GET subcategory by name or ID
router.get('/:identifier', getSubcategory);

// PUT Edit Subcategory attributes (name, description, taxApplicability, tax)
router.put('/:id', upload.none(), editSubcategory); // Added multer middleware for parsing multipart/form-data

export { router as subcategoryRouter };
