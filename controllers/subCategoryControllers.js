import CustomError from '../utils/CustomError.js';
import Subcategory from '../models/Subcategory.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// api to create a subcategory
const createSubCategory = async (req, res, next) => {
  let deleteImage = true; // Flag to indicate whether to delete the image or not
  try {
    // Extract data from request body
    const { category, name, description, taxApplicability, tax } = req.body;
    // Check if image is provided
    if (!req.file) {
      return next(new CustomError('Image is required.', 400)); // Bad Request
    }

    // Validate required fields
    if (!category || !name || !description) {
      return next(
        new CustomError('category, name, and description are required.', 400)
      ); // Bad Request
    }

    const normalizedName =
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const normalizedCategoryName =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

    // Fetch parent category
    const parentCategory = await Category.findOne({
      name: normalizedCategoryName
    });

    if (!parentCategory) {
      return next(new CustomError("Provided category doesn't exist.", 404)); // Not Found
    }

    // if tax is negative
    if (tax && tax < 0) {
      return next(new CustomError("Tax can't be negative.", 400)); // Bad Request
    }

    const imageName = req.file.filename;
    const imageUrl = path.join(imageName);

    // Checking if Sub-category already exists under the same parent category
    const existingSubCategory = await Subcategory.findOne({
      name: normalizedName,
      category: parentCategory._id
    });

    if (existingSubCategory) {
      return next(new CustomError('Sub-category already exists.', 409)); // Conflict
    }

    const normalizedTax = tax ? tax : parentCategory?.tax || 0;
    const normalizedTaxApplicability = JSON.parse(
      taxApplicability || parentCategory?.taxApplicability
    ); //converting type string to boolean

    // Create new sub-category instance
    const subCategory = new Subcategory({
      name: normalizedName,
      image: imageUrl,
      description,
      category: parentCategory._id,
      taxApplicability: normalizedTaxApplicability, // If not provided, default to parent tax Applicability
      tax: normalizedTaxApplicability ? normalizedTax : undefined, // Only set tax if taxApplicability is true
      taxType: normalizedTaxApplicability
        ? parentCategory?.taxType || 'Percentage'
        : undefined //default to parent tax Type
    });

    // Save sub-category to database
    const savedSubCategory = await subCategory.save();

    // Add sub-category to parent category's subcategories array
    parentCategory.subcategories.push(savedSubCategory._id);
    await parentCategory.save();

    deleteImage = false;
    return res.status(201).json(savedSubCategory);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  } finally {
    // Delete the uploaded image if the flag is still true
    if (deleteImage && req.file) {
      const filePath = `uploads/${req.file.filename}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }
};

//api to retrieve all subcategories from the database
const getSubCategories = async (req, res, next) => {
  try {
    const subcategories = await Subcategory.find();
    return res.status(200).json(subcategories);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

//api to retrieve all subcategories under a specified category
const getSubCategoriesByCategory = async (req, res, next) => {
  const { categoryID } = req.params;

  // Check if categoryID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(categoryID)) {
    return next(new CustomError('Invalid category ID.', 400)); // Bad Request
  }

  try {
    // Find the category by its ID and populate the subcategories field
    const category = await Category.findById(categoryID).populate(
      'subcategories'
    );

    if (!category) {
      return next(new CustomError('Category not found.', 404)); // Not Found
    }

    // Return the populated subcategories
    return res.status(200).json(category.subcategories);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

//api to retrieve a subcategory by its name or ID along with its attributes, including the category it belongs to.
const getSubcategory = async (req, res, next) => {
  let { identifier } = req.params;

  // Convert the identifier to the format used in the database
  identifier = identifier.replace(/-/g, ' ').trim(); // Replace dashes with spaces and trim any leading or trailing spaces

  // Check if the identifier is a valid ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);

  try {
    let subcategory;
    if (isValidObjectId) {
      // If the identifier is a valid ObjectId, search by ID
      subcategory = await Subcategory.findById(identifier);
    } else {
      // If not a valid ObjectId, search by name
      subcategory = await Subcategory.findOne({
        name: { $regex: new RegExp(`^${identifier}$`, 'i') }
      });
      // Performed a case-insensitive search for the subcategory name in the database
    }

    if (!subcategory) {
      return next(new CustomError('Subcategory not found.', 404)); // Not Found
    }

    return res.status(200).json(subcategory);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

const editSubcategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, taxApplicability, tax } = req.body;

  // Check if the ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError('Invalid subcategory ID.', 400)); // Bad Request
  }

  try {
    // Find the subcategory by ID
    let subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return next(new CustomError('Subcategory not found.', 404)); // Not Found
    }

    // Check if user provided any attributes to change
    if (
      !name &&
      !description &&
      taxApplicability === undefined &&
      tax === undefined
    ) {
      return next(
        new CustomError('Please provide at least one attribute to change.', 400)
      ); // Bad Request
    }

    // Update subcategory attributes if provided
    if (name) {
      const normalizedName =
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      subcategory.name = normalizedName;
    }
    if (description) subcategory.description = description;
    if (taxApplicability !== undefined) {
      // Convert taxApplicability string to boolean
      const applicability = taxApplicability === 'true';

      // If taxApplicability changes to false, set tax to undefined
      if (!applicability) {
        subcategory.taxApplicability = false;
        subcategory.tax = undefined;
      } else {
        // If taxApplicability changes to true, set tax to user-provided value or default to 0
        subcategory.taxApplicability = true;
        subcategory.tax = tax ? parseFloat(tax) : 0; // Convert tax to number
      }
    }

    // Save the updated subcategory
    subcategory = await subcategory.save();

    return res.status(200).json(subcategory);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

export {
  createSubCategory,
  getSubCategories,
  getSubCategoriesByCategory,
  getSubcategory,
  editSubcategory
};
