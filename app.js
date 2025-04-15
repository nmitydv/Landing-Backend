import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import mallRoutes from './routes/mallRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiter to all routes
app.use(limiter);

// Allowed origins for CORS
const allowedOrigins = [
  '*',
  'http://localhost:3000',
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.options('*', cors());  // Pre-flight requests handling

// Proper CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // if using cookies or auth headers
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Morgan logger

// Swagger Documentation
const swaggerFile = JSON.parse(
  readFileSync(new URL('./swagger-output.json', import.meta.url), 'utf-8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// API Routes
app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
