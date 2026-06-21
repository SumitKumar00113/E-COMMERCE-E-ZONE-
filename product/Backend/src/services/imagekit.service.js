import ImageKit from "@imagekit/nodejs";
import config from "../configs/auth.config.js";
import { v4 as uuidv4 } from "uuid";

const imagekit = new ImageKit({
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

const uploadImage = async ({ buffer, filename, folder = "/products" }) => {
const response = await imagekit.files.upload({
  file: buffer.toString("base64"),
  fileName: `${uuidv4()}-${filename}`,
  folder,
});
  return {
    url: response.url,
    alt: filename,
    thumbnail: response.thumbnailUrl || response.url,
    id: response.fileId,
  };
};

export default { uploadImage };
