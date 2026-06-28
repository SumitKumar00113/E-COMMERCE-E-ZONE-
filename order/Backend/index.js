import app from "./src/app.js";
import connectToDb from "./src/db/db.js";

// =========================
// Order Server Entry Point
// =========================
const port = process.env.PORT || 3003;

connectToDb();
app.listen(port, () => {
  console.log(`server is running on port http://localhost:${port}`);
});
