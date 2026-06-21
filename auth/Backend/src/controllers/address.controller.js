import userModel from "../models/user.model.js";


const getUserAddress = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have user authentication and the user ID is available in req.user

     const userAddress = await userModel.findById(userId).select("address");

        if (!userAddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json(userAddress);
    } catch (error) {
        console.error("Error fetching user address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const addUserAddress = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have user authentication and the user ID is available in req.user
        const { area, city, state, country, pincode, mobileNo, isDefault } = req.body;

        const newAddress = {
            area,
            city,
            state,
            country,
            pincode,
            mobileNo,
            isDefault
        };

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.address.push({ addresses: newAddress });
        await user.save();

        res.status(201).json({ message: "Address added successfully", address: newAddress });
    } catch (error) {
        console.error("Error adding user address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};  
const updateUserAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;
        const { area, city, state, country, pincode, mobileNo, isDefault } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const addressIndex = user.address.findIndex((address) => address._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: "Address not found" });
        }

        user.address[addressIndex].addresses.area = area || user.address[addressIndex].addresses.area;
        user.address[addressIndex].addresses.city = city || user.address[addressIndex].addresses.city;
        user.address[addressIndex].addresses.state = state || user.address[addressIndex].addresses.state;
        user.address[addressIndex].addresses.country = country || user.address[addressIndex].addresses.country;                         
        user.address[addressIndex].addresses.pincode = pincode || user.address[addressIndex].addresses.pincode;
        user.address[addressIndex].addresses.mobileNo = mobileNo || user.address[addressIndex].addresses.mobileNo;
        user.address[addressIndex].addresses.isDefault = isDefault !== undefined ? isDefault : user.address[addressIndex].addresses.isDefault;

        await user.save();

        res.status(200).json({ message: "Address updated successfully", address: user.address[addressIndex] });
    } catch (error) {
        console.error("Error updating user address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export default {
    getUserAddress,addUserAddress,updateUserAddress
};      
