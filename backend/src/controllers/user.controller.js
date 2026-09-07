import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt, { hash } from "bcrypt"

import crypto from "crypto"
import { Meeting } from "../models/meeting.model.js";
import { sendVerificationEmail } from "../utils/mailer.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const login = async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide" })
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }

        if (!user.isVerified) {
            return res.status(httpStatus.FORBIDDEN).json({ message: "Please verify your email before logging in. Check your inbox for the verification link." })
        }

        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token })
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
        }

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` })
    }
}


const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ message: "Please provide name, email, and password" });
    }

    if (!EMAIL_REGEX.test(username)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword,
            isVerified: false,
            verificationToken: verificationToken,
            verificationTokenExpiry: verificationTokenExpiry
        });

        await newUser.save();

        try {
            await sendVerificationEmail(username, verificationToken);
        } catch (mailErr) {
            console.log("Failed to send verification email:", mailErr);
            // User is still created; they can request this to be resent later.
            // We don't fail the whole registration just because the email didn't send.
        }

        res.status(httpStatus.CREATED).json({ message: "Registered! Please check your email to verify your account before logging in." })

    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }

}


const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Invalid or already-used verification link" });
        }

        if (user.verificationTokenExpiry < new Date()) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "This verification link has expired. Please register again or request a new link." });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        return res.status(httpStatus.OK).json({ message: "Email verified successfully! You can now log in." });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}


const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        const meetings = await Meeting.find({ user_id: user.username })
        res.json(meetings)
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}


export { login, register, verifyEmail, getUserHistory, addToHistory }