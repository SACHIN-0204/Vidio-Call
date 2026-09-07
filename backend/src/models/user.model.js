import mongoose, { Schema } from "mongoose";

const userScheme = new Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        token: { type: String },
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
        verificationTokenExpiry: { type: Date }
    }
)

const User = mongoose.model("User", userScheme);

export { User };