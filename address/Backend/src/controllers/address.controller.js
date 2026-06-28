import addressModel from "../models/address.model.js";

const createAddress = async (req, res) => {
  try {
    const addressPayload = req.body?.addresses ?? req.body;
    const addressData = req.user?.id
      ? { ...addressPayload, user: req.user.id }
      : addressPayload;

    const address = await addressModel.create(addressData);

    res.status(201).json({
      message: "address create successfully",
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
const updateAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const addressId = req.params?.addressId || req.body?.addressId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required",
      });
    }

    const { addressId: _addressId, ...updatePayload } = req.body || {};

    const address = await addressModel.findOneAndUpdate(
      {
        _id: addressId,
        user: userId,
      },
      updatePayload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const deleteAddress = async (req, res) => {
  try {
    const user = req.user;
    const addressId =
      req.params.addressId || req.body?.addressId || req.query?.addressId;

    if (!addressId) {
      return res.status(403).json({
        message: "address id is required",
      });
    }

    await addressModel.findOneAndDelete({
      _id: addressId,
      user: user?.id,
    });

    return res.status(200).json({
      message: "address delete successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

export default { createAddress, getAddress, updateAddress, deleteAddress };
