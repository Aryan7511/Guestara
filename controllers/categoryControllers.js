import CustomError from '../utils/CustomError.js';
import Category from '../models/Category.js';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

// api to create a category
const createCategory = async (req, res, next) => {
  let deleteImage = true; // Flag to indicate whether to delete the image or not
  try {
    // Extract data from request body
    const { name, description, taxApplicability, tax, taxType } = req.body;

    // Check if image is provided
    if (!req.file) {
      return next(new CustomError('Image is required.', 400)); // Bad Request
    }

    // Validate required fields
    if (!name || !description) {
      return next(new CustomError('Name and description are required.', 400)); // Bad Request
    }
    const normalizedName =
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    // if tax is negative
    if (tax && tax < 0) {
      return next(new CustomError("Tax can't be negative.", 400)); // Bad Request
    }

    // Validate taxType
    const normalizedtaxType = taxType
      ? taxType.charAt(0).toUpperCase() + taxType.slice(1).toLowerCase()
      : null;
    if (taxType && !['Percentage', 'Fixed'].includes(normalizedtaxType)) {
      return next(
        new CustomError(
          "Invalid taxType. TaxType must be either 'Percentage' or 'Fixed'.",
          400
        )
      ); //Bad Request
    }
    const imageName = req.file.filename;
    const imageUrl = path.join(imageName);

    //checking if Category already exists
    const existingCategory = await Category.findOne({ name: normalizedName });
    if (existingCategory) {
      return next(new CustomError('Category already exists.', 409)); // Conflict
    }

    const normalizedtaxApplicability = JSON.parse(taxApplicability); //converting type string to boolean

    // Create new category instance
    const category = new Category({
      name: normalizedName,
      image: imageUrl,
      description,
      taxApplicability: taxApplicability || false, // If not provided, default to false
      tax: normalizedtaxApplicability ? tax || 0 : undefined, // Only set tax if taxApplicability is true
      taxType: normalizedtaxApplicability
        ? normalizedtaxType || 'Percentage'
        : undefined // Only set taxType if taxApplicability is true
    });

    // Save category to database
    const savedCategory = await category.save();
    deleteImage = false;
    return res.status(201).json(savedCategory);
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

//api to get all categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find(); // Retrieve all categories from the database
    return res.status(200).json(categories);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

const getCategory = async (req, res, next) => {
  let { identifier } = req.params;

  // Convert the identifier to the format used in the database
  identifier = identifier.replace(/-/g, ' ').trim(); // Replace dashes with spaces and trim any leading or trailing spaces

  // Check if the identifier is a valid ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);

  try {
    let category;
    if (isValidObjectId) {
      // If the identifier is a valid ObjectId, search by ID
      category = await Category.findById(identifier);
    } else {
      // If not a valid ObjectId, search by name
      category = await Category.findOne({
        name: { $regex: new RegExp(`^${identifier}$`, 'i') }
      });
      // Performed a case-insensitive search for the category name in the database
    }

    if (!category) {
      return next(new CustomError('Category not found.', 404)); // Not Found
    }

    return res.status(200).json(category);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

const editCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, taxApplicability, tax } = req.body;
  // Check if the ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError('Invalid category ID.', 400)); // Bad Request
  }

  try {
    // Find the category by ID
    let category = await Category.findById(id);
    if (!category) {
      return next(new CustomError('Category not found.', 404)); // Not Found
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

    // Update category attributes if provided
    if (name) {
      const normalizedName =
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      category.name = normalizedName;
    }
    if (description) category.description = description;
    if (taxApplicability !== undefined) {
      // Convert taxApplicability string to boolean
      const applicability = taxApplicability === 'true';

      // If taxApplicability changes to false, set tax to undefined
      if (!applicability) {
        category.taxApplicability = false;
        category.tax = undefined;
      } else {
        // If taxApplicability changes to true, set tax to user-provided value or default to 0
        category.taxApplicability = true;
        category.tax = tax ? parseFloat(tax) : 0; // Convert tax to number
      }
    }

    // Save the updated category
    category = await category.save();

    return res.status(200).json(category);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

export { createCategory, getCategories, getCategory, editCategory };
