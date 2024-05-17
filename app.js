import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorResponserHandler } from './middlewares/errorHandler.js';

//importing routes
import { categoryRouter } from './routes/categoryRoutes.js';
import { itemRouter } from './routes/itemRoutes.js';
import { subcategoryRouter } from './routes/subCategoryRoutes.js';

const app = express();

// Get the directory name using import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(morgan('common'));
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/', express.static(path.join(__dirname, './uploads')));

app.use('/test', (req, res) => {
  res.status(200).json({ message: 'Server is Running!' });
});

app.use('/api/category', categoryRouter);
app.use('/api/subcategory', subcategoryRouter);
app.use('/api/item', itemRouter);

app.use(errorResponserHandler);

export default app;
