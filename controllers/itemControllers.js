import CustomError from '../utils/CustomError.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Item from '../models/Item.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// api to create an item
const createItem = async (req, res, next) => {
  let deleteImage = true; // Flag to indicate whether to delete the image or not
  try {
    // Extract data from request body
    const {
      name,
      description,
      taxApplicability,
      tax,
      baseAmount,
      discount,
      category,
      subcategory
    } = req.body;
    // Check if image is provided
    if (!req.file) {
      return next(new CustomError('Image is required.', 400)); // Bad Request
    }

    // Validate required fields
    if (
      !name ||
      !description ||
      baseAmount === undefined ||
      discount === undefined
    ) {
      return next(
        new CustomError(
          'Name, description, baseAmount, and discount are required.',
          400
        )
      ); // Bad Request
    }

    // if tax is negative
    if (tax && tax < 0) {
      return next(new CustomError("Tax can't be negative.", 400)); // Bad Request
    }

    const normalizedName =
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const existingItem = await Item.findOne({ name: normalizedName });
    if (existingItem) {
      return next(new CustomError('Item already exists.', 409)); // Conflict
    }

    const imageName = req.file.filename;
    const imageUrl = path.join(imageName);

    const taxApplicable = taxApplicability === 'true'; //to convert into boolean type

    // Check if category exists
    let categoryObject;
    if (category) {
      const normalizedCategoryName =
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      categoryObject = await Category.findOne({ name: normalizedCategoryName });
    }

    // Check if subcategory exists
    let subcategoryObject;
    if (subcategory && categoryObject) {
      const normalizedSubCategoryName =
        subcategory.charAt(0).toUpperCase() +
        subcategory.slice(1).toLowerCase();
      subcategoryObject = await Subcategory.findOne({
        name: normalizedSubCategoryName,
        category: categoryObject?._id
      });
    }

    if (
      !categoryObject ||
      (categoryObject && subcategory && !subcategoryObject)
    ) {
      return next(
        new CustomError(
          'please provide correct details of category and subcategory',
          404
        )
      ); // Not Found
    }

    const totalAmount = parseFloat(baseAmount) - parseFloat(discount);
    if (totalAmount <= 0) {
      return next(
        new CustomError(
          'Discount can\'t be greater than base amount.',
          40
        )
      );
    }

    // Create new item instance
    const item = new Item({
      name: normalizedName,
      image: imageUrl,
      description,
      taxApplicability: taxApplicability || false, // If not provided, default to false
      tax: taxApplicable ? tax || 0 : undefined,
      baseAmount: baseAmount,
      discount: discount,
      totalAmount: totalAmount,
      category: categoryObject?._id,
      subcategory: subcategoryObject?._id
    });

    // Save item to database
    const savedItem = await item.save();

    // Add item to parent category's items array
    categoryObject.items.push(savedItem._id);
    await categoryObject.save();

    if (subcategoryObject) {
      // Add items to parent subcategory's if exits to items array
      subcategoryObject.items.push(savedItem._id);
      await subcategoryObject.save();
    }

    deleteImage = false;

    return res.status(201).json(savedItem);
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

// API to get all items
const getAllItems = async (req, res, next) => {
  try {
    const items = await Item.find();
    return res.status(200).json(items);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

// API to get all items under a category
const getItemsByCategory = async (req, res, next) => {
  const { categoryID } = req.params;

  // Check if categoryID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(categoryID)) {
    return next(new CustomError('Invalid category ID.', 400)); // Bad Request
  }

  try {
    const items = await Item.find({ category: categoryID });
    return res.status(200).json(items);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

// API to get all items under a sub-category
const getItemsBySubcategory = async (req, res, next) => {
  const { subcategoryID } = req.params;

  // Check if subcategoryID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(subcategoryID)) {
    return next(new CustomError('Invalid subcategory ID.', 400)); // Bad Request
  }

  try {
    const subcategory = await Subcategory.findById(subcategoryID).populate(
      'items'
    );

    if (!subcategory) {
      return next(new CustomError('Subcategory not found.', 404)); // Not Found
    }

    return res.status(200).json(subcategory.items);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

// API to get an item by name or ID along with its attributes
const getItem = async (req, res, next) => {
  let { identifier } = req.params;

  // Convert the identifier to the format used in the database
  identifier = identifier.replace(/-/g, ' ').trim(); // Replace dashes with spaces and trim any leading or trailing spaces

  // Check if the identifier is a valid ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);

  try {
    let item;
    if (isValidObjectId) {
      // If the identifier is a valid ObjectId, search by ID
      item = await Item.findById(identifier);
    } else {
      // If not a valid ObjectId, search by name (case-insensitive)
      item = await Item.findOne({
        name: { $regex: new RegExp(`^${identifier}$`, 'i') }
      });
    }

    if (!item) {
      return next(new CustomError('Item not found.', 404)); // Not Found
    }

    return res.status(200).json(item);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

const editItem = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, taxApplicability, tax } = req.body;

  // Check if the ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError('Invalid item ID.', 400)); // Bad Request
  }

  try {
    // Find the item by ID
    let item = await Item.findById(id);
    if (!item) {
      return next(new CustomError('Item not found.', 404)); // Not Found
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

    // Update item attributes if provided
    if (name) {
      const normalizedName =
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      item.name = normalizedName;
    }
    if (description) item.description = description;
    if (taxApplicability !== undefined) {
      // Convert taxApplicability string to boolean
      const applicability = taxApplicability === 'true';

      // If taxApplicability changes to false, set tax to undefined
      if (!applicability) {
        item.taxApplicability = false;
        item.tax = undefined;
      } else {
        // If taxApplicability changes to true, set tax to user-provided value or default to 0
        item.taxApplicability = true;
        item.tax = tax ? parseFloat(tax) : 0; // Convert tax to number
      }
    }

    // Save the updated item
    item = await item.save();

    return res.status(200).json(item);
  } catch (error) {
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

// API to search the item by its name
const searchItem = async (req, res, next) => {
  let { name } = req.query; // Get the item name from the query parameters
  // Convert the identifier to the format used in the database
  name = name.replace(/-/g, ' ').trim(); // Replace dashes with spaces and trim any leading or trailing spaces
  console.log(name);
  try {
    // Perform a case-insensitive search for items containing the provided name
    const items = await Item.find({
      name: { $regex: new RegExp(name, 'i') }
    });

    // Check if any items were found
    if (!items || items.length === 0) {
      return res.status(404).json({ message: 'No items found.' });
    }

    // Return the found items
    return res.status(200).json(items);
  } catch (error) {
    // Handle errors
    return next(new CustomError(error.message, 500)); // Internal Server Error
  }
};

export {
  createItem,
  getAllItems,
  getItemsByCategory,
  getItemsBySubcategory,
  getItem,
  editItem,
  searchItem
};
