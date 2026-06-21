import dotenv from "dotenv";


dotenv.config();



const config={
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET_KEY:process.env.JWT_SECRET_KEY,
    IMAGEKIT_PUBLIC_KEY:process.env.IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_PRIVATE_KEY:process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_URL_ENDPOINT:process.env.IMAGEKIT_URL_ENDPOINT
}


export default config