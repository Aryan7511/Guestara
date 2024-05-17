import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

//config
if (process.env.NODE_ENV !== 'PRODUCTION') {
  dotenv.config({
    path: './.env'
  });
}

const DB_URL = process.env.DB_URL;
const PORT = process.env.PORT || 8001;

const start = async () => {
  try {
    const res = await mongoose.connect(DB_URL);
    console.log(`mongodb connected with server: ${res.connection.host}`);
  } catch (error) {
    console.log(error);
  }

  app.listen(PORT, (err) => {
    if (err) {
      console.log('Error in server setup');
    } else {
      console.log(`Server is running on http://localhost:${PORT}`);
    }
  });
};

start();
