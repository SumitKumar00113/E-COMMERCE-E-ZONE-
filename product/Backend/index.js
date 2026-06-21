import app from "./src/app.js";
import connectToDb from "./src/db/db.js"

connectToDb()
app.listen(3001,()=>{
    console.log("server is running on port http://localhost:3001")
})