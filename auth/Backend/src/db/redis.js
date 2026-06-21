import {Redis} from "ioredis"
import config from "../configs/auth.config.js"


const redis=new Redis({
  host:config.REDIS_HOST,
  port:config.REDIS_PORT,
  password:config.REDIS_PASSWORD
})

redis.on("connect",()=>{
    console.log("Redis connected successfully")
})


export default redis;