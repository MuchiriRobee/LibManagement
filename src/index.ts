import  express from "express";
import cors from "cors";
import { getPool } from "./config/database";
import userRouter from "./router/user.routes";
import borrowRouter from "./router/borrowrecords.Routes";
import categoriesRouter from './router/categories.Routes';
import booksRouter from './router/books.Routes';
import commentsRouter from './router/comments.Routes';

const app = express();  

// CORS CONFIG — Allow your Vite dev server
app.use(cors({
  origin: "http://localhost:5173",  // Vite default port
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