import addressModel from "../models/address.model.js";

const createAddress = async (req, res) => {
  try {
    const addressPayload = req.body?.addresses ?? req.body;
    const addressData = req.user?.id
      ? { ...addressPayload, user: req.user.id }
      : addressPayload;

    const address = await addressModel.create(addressData);

    res.status(201).json({
      message:"address create successfully",
      success: true,
      data: address,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAddress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const address = await addressModel.find({ user: userId });

    if (address.length === 0) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address fetched successfully",
      data: address,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};
const updateAddress=async(req,res)=>{
  try{

  }catch(err){
    
  }
}

export default { createAddress,getAddress};
