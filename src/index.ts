import  express from "express";
import cors from "cors";
import { getPool } from "./config/database";
import userRouter from "./router/user.routes";
import borrowRouter from "./router/borrowrecords.Routes";
import categoriesRouter from './router/categories.Routes';
import booksRouter from './router/books.Routes';
import commentsRouter from './router/comments.Routes';

const app = express();  

const allowedOrigins = [
  "http://localhost:5173",
  "https://library-coral-iota.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


app.use(express.json());

app.use("/api",userRouter)
app.use("/api",borrowRouter)
app.use('/api', categoriesRouter);
app.use('/api', booksRouter);
app.use('/api', commentsRouter);

//middleware
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello, the express server is running")
})

app.get("/", (req, res) => {res.send("Hello, the express server is running")})
//load routes

const port = 3000
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})




getPool()
.then(() => console.log("Database connected successfully"))
.catch((err: any) => console.error("Database connection failed", err))
 
export default app;