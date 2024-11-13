const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const xss = require("xss-clean");
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const AppError = require("./utils/appError");
const userRouter = require("./route/userRoute");
const teamRouter = require("./route/teamRoute");
const eventRouter = require("./route/eventRoute");
const clubRouter = require("./route/clubRoute.js");
const categoriesRouter = require("./route/categoryRoute.js");
const leaderBoardRouter = require("./route/leaderBoardRoute");
const globalErrorHandler = require("./controller/errorController");

dotenv.config();

const app = express();

app.set("trust proxy", 1);

// Define CORS options to allow all origins
const corsOptions = {
  origin: "*", // Allow all origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Security middlewares without crossOriginResourcePolicy
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Route imports
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/leaderBoard", leaderBoardRouter);
app.use("/api/v1/club", clubRouter);

// To handle unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
