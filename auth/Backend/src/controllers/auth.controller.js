import userModel from "../models/user.model.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import config from "../configs/auth.config.js"
import redis from "../db/redis.js"
const registerUser = async (req, res) => {
try{
  const {
    fullName: { firstName, lastName },
    userName,
    email,
    mobNo: { country, number },
    password,
    role
    
  } = req.body;
const isUserExist = await userModel.findOne({
  $or: [
    { userName },
    { email },
    { "mobNo.number": number }
  ]
});
  if(isUserExist){
    return res.status(409).json({
      message:"user already exist"
    })
  }
const hashPass=await bcrypt.hash(password,10);

const newUser=await userModel.create({
  fullName:{
    firstName,
    lastName
  },
  userName,
  email,
  mobNo:{
    country,
    number
  },
password:hashPass,
role
})
const accessToken=jwt.sign({id:newUser._id,userName:newUser.userName,fullName:newUser.fullName,email:newUser.email,mobNo:newUser.mobNo,role:newUser.role},config.JWT_SECRET_KEY,{expiresIn:"1h"});
res.cookie("accessToken",accessToken,{
  httpOnly:true,
  secure:true,
  sameSite:"strict",
  maxAge:10*60*60*1000 // 10 hours
})
return res.status(201).json({
  message:"user registered successfully",
  user:newUser,
  accessToken
})
}catch(err){
   return res.status(500).json({
    message:"internal server error during Registration",
    error:err
   })
}

};
const loginUser=async (req,res)=>{
  const {userName,email,mobNo = {},password,role}=req.body;
  const {number}=mobNo;
try{
  const user=await userModel.findOne({
    $or:[{userName},{email},{ "mobNo.number": number }]
  }).select("+password");
  if(!user){
    return res.status(404).json({
      message:"user not found"
    })
  }
  const isMatch=await bcrypt.compare(password,user.password);
  if(!isMatch){
    return res.status(401).json({
      message:"invalid credentials password incorrect"
    })
  }
  const accessToken=jwt.sign({id:user._id,userName:user.userName,fullName:user.fullName,email:user.email,mobNo:user.mobNo,role:user.role},config.JWT_SECRET_KEY,{expiresIn:"1h"});
  res.cookie("accessToken",accessToken,{
    httpOnly:true,
    secure:true,
    sameSite:"strict",
    maxAge:10*60*60*1000 // 10 hours
  })
  return res.status(200).json({
    message:"user logged in successfully",
    user,
    accessToken
  })
}catch(err){
  return res.status(500).json({
    message:"internal server error during login",
    error:err
  })
}   
}   

const getCurrentUser=async (req,res)=>{
  return res.status(200).json({
    message: "user fetched successfully",
    user: req.user,
  });
}
const logOutCurrentUser=async(req,res)=>{
const accessToken=req.cookies.accessToken;
if(!accessToken){
  return res.status(401).json({
    message: "authentication token missing"
  });
}
  await redis.set(`blacklisted:${accessToken}`, "true", { EX: 24 * 60 * 60 });
  res.clearCookie("accessToken",{
    httpOnly:true,
    secure:true,
    sameSite:"strict"
  });
  return res.status(200).json({
    message: "user logged out successfully"
  })
}
const updateCurrentUser=async(req,res)=>{
  const userId=req.user.id;
  const updateFields = {};

  if (req.body.fullName?.firstName !== undefined) {
    updateFields["fullName.firstName"] = req.body.fullName.firstName;
  }
  if (req.body.fullName?.lastName !== undefined) {
    updateFields["fullName.lastName"] = req.body.fullName.lastName;
  }
  if (req.body.userName !== undefined) {
    updateFields.userName = req.body.userName;
  }
  if (req.body.email !== undefined) {
    updateFields.email = req.body.email;
  }
  if (req.body.mobNo?.country !== undefined) {
    updateFields["mobNo.country"] = req.body.mobNo.country;
  }
  if (req.body.mobNo?.number !== undefined) {
    updateFields["mobNo.number"] = req.body.mobNo.number;
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({
      message:"no valid fields provided for update"
    })
  }

  try{
    const updatedUser=await userModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { returnDocument:"after", runValidators:true }
    );
    if(!updatedUser){
      return res.status(404).json({
        message:"user not found"
      })
    }
    return res.status(200).json({
      message:"user updated successfully",
      user:updatedUser
    })
  }catch(err){
    if (err.code === 11000) {
      return res.status(409).json({
        message:"user already exist"
      })
    }

    return res.status(500).json({
      message:"internal server error during updating user",
      error:err
    })
  }
}



export default {registerUser, loginUser, getCurrentUser,logOutCurrentUser, updateCurrentUser}
