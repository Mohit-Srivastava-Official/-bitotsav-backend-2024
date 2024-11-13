const dotenv = require("dotenv");
dotenv.config();
const app = require("./app");
const mongoose = require("mongoose");
const { ensurePublicFolder } = require("./utils/public");

// const { NODE_ENV } = process.env;
// console.log({ NODE_ENV });

const DB = process.env.DATABASE;
const PORT = process.env.PORT || 5000;

ensurePublicFolder();

mongoose.set("strictQuery", true);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Server is listening on http://localhost:${PORT}`);
    });
  });
