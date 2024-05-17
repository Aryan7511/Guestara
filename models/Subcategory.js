import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  taxApplicability: { type: Boolean, default: false ,required: true},
  tax: {
    type: Number,
  },
  taxType: { type: String, enum: ['Percentage', 'Fixed'] },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

export default Subcategory;
