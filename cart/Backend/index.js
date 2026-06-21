import app from "./src/app.js";
import connectToDb from "./src/db/db.js"


connectToDb()
app.listen(3002,()=>{
    console.log("server is running on port 3002")
})