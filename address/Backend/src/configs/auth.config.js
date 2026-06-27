import dotenv from "dotenv";

dotenv.config();


const config={
MONGO_URI:process.env.MONGO_URI,
JWT_SECRET_KEY:process.env.JWT_SECRET_KEY
}

export default config