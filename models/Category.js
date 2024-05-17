import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  taxApplicability: { type: Boolean, default: false, required: true },
  tax: {
    type: Number,
  },
  taxType: { type: String, enum: ['Percentage', 'Fixed'] },
  subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
