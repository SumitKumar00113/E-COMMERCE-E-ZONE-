import app from "./src/app.js";
import connectToDb from "./src/db/db.js"


connectToDb()
app.listen(3003,()=>{
    console.log("server is runnig on port : 3003");
})