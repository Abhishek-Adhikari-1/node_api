import express from "express";
import { config } from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import User from "./models/user.js";
import connectDB from "./database/data.js";

config({
	path: "./database/config.env",
});
const port = process.env.PORT;
const serviceExtension = process.env.SERVICE_EXT;
const mailId = process.env.MAIL_ID;
const mailPass = process.env.MAIL_PASS;
const origin = process.env.ORIGIN;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", origin);
	next();
});
connectDB();
const transporter = nodemailer.createTransport({
	service: serviceExtension,
	auth: {
		user: mailId,
		pass: mailPass,
	},
});

function jsonResponse(res, status, message) {
	return res.json({
		success: status,
		message: message,
	});
}

//======================= API TO LOGIN =======================\\
app.post("/v1/api/user", async (req, res) => {
	if (req.headers.authorization.split(" ")[1] !== process.env.BEARER_KEY) {
		return jsonResponse(res, false, "Invalid request");
	}
	const email = req.body.email;
	const password = req.body.password;
	if (!email || !password) {
		return jsonResponse(res, false, "All fields are mandatory");
	}

	try {
		const queryUser = await User.findOne({ email });
		if (queryUser) {
			if (password === queryUser.password) {
				return jsonResponse(res, true, "Logged in successful");
			} else {
				return jsonResponse(res, false, "Incorrect password");
			}
		} else {
			return jsonResponse(res, false, "User not found");
		}
	} catch (error) {
		console.error(error);
		return jsonResponse(res, false, "Error finding the user");
	}
});

//======================= API TO REGISTER NEW USER =======================\\
app.post("/v1/api/create-user", async (req, res) => {
	if (req.headers.authorization.split(" ")[1] !== process.env.BEARER_KEY) {
		return jsonResponse(res, false, "Invalid request");
	}
	const { name, email, password } = req.body;
	const formattedName =
		name.trim().charAt(0).toUpperCase() +
		name.trim().slice(1).toLowerCase();
	const formattedEmail = email.trim().toLowerCase();
	const formattedPassword = password.trim();
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

	if (!formattedName || !formattedEmail || !formattedPassword) {
		return jsonResponse(res, false, "All fields are mandatory");
	}

	if (!emailRegex.test(formattedEmail)) {
		return jsonResponse(res, false, "Invalid email");
	}

	try {
		const existingUser = await User.findOne({ email: formattedEmail });
		if (existingUser) {
			return jsonResponse(res, false, "User already exists");
		}

		await User.create({
			name: formattedName,
			email: formattedEmail,
			password: formattedPassword,
		});
		return jsonResponse(res, true, "User successfully registered");
	} catch (error) {
		console.error(error);
		return jsonResponse(res, false, "Error creating the user");
	}
});

//======================= API TO FORGET PASSWORD =======================\\
app.post("/v1/api/forgot-password", async (req, res) => {
	if (req.headers.authorization.split(" ")[1] !== process.env.BEARER_KEY) {
		return jsonResponse(res, false, "Invalid request");
	}
	const email = req.body.email.trim().toLowerCase();
	const urlDy = req.body.url;

	if (!email) {
		return jsonResponse(res, false, "All fields are mandatory");
	}

	try {
		const queryUser = await User.findOne({ email });
		if (queryUser) {
			const code = Math.floor(10000 + Math.random() * 90000);
			const mailOptions = {
				from: mailId,
				to: email,
				subject: "Abhigo: Password Reset",
				html: `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						.button {
							background-color: #7b3dbd;
							border: none;
							color: #fff !important;
							padding: 10px 20px;
							text-align: center;
							text-decoration: none;
							display: inline-block;
							font-size: 16px;
							cursor: pointer;
							outline: none;
							border-radius: 8px;
							user-select: none !important;
						}
						.button:hover{
							background-color: #652acbce;
						}
						p{
							font-weight: 400;
							font-size: 18px;
						}
						u{
							color: blue;
						}
						@media (max-width: 450px){
							p{
								font-size: 15px;
							}
							h2{
								font-size: 1.75em;
							}
						}
					</style>
				</head>
				<body>
					<p>The password reset code you requested is:</p>
					<h2>${code}</h2>
					<p>To reset your password, please follow the instructions below.</p>
					<br />
					<p>For your security, <u>kindly do not share this password reset code with anyone else</u>.
					It is unique to your account and should remain confidential.
					<b>If you did not request this password reset, </b>please ignore this message.</p>
				</body>
				</html>
			`,
			};
			transporter.sendMail(mailOptions, async (error) => {
				if (error) {
					return jsonResponse(res, false, error);
				} else {
					queryUser.token = code;
					await queryUser.save();
					return jsonResponse(
						res,
						true,
						`Mail successfully sent to ${email}`
					);
				}
			});
		} else {
			return jsonResponse(res, false, "User not found");
		}
	} catch (error) {
		console.error(error);
		return jsonResponse(res, false, "Error finding the user");
	}
});

//======================= API TO RESET PASSWORD =======================\\
app.post("/v1/api/reset-password", async (req, res) => {
	if (req.headers.authorization.split(" ")[1] !== process.env.BEARER_KEY) {
		return jsonResponse(res, false, "Invalid request");
	}
	const token = req.body.token;
	const email = req.body.email;
	try {
		const user = await User.findOne({ email: email });
		if (!user) {
			return jsonResponse(res, false, "User not found");
		}
		if (user.token !== token) {
			return jsonResponse(res, false, "OTP is invalid or expired");
		}
		return jsonResponse(res, true, "Token is valid and User exists");
	} catch (error) {
		return jsonResponse(res, false, "Internal server error");
	}
});

//======================= API TO CHANGE PASSWORD =======================\\
app.post("/v1/api/change-password", async (req, res) => {
	if (req.headers.authorization.split(" ")[1] !== process.env.BEARER_KEY) {
		return jsonResponse(res, false, "Invalid request");
	}
	const password = req.body.password;
	const conPassword = req.body.conPassword;
	const token = req.body.token;
	const email = req.body.email;
	try {
		const user = await User.findOne({ email: email });
		if (!user) {
			return jsonResponse(res, false, "User not found");
		}
		if (!password || !conPassword) {
			return jsonResponse(res, false, "All fields are mandatory");
		}
		if (password !== conPassword) {
			return jsonResponse(res, false, "Passwords must be same");
		}
		if (user.token !== token) {
			return jsonResponse(res, false, "OTP is invalid or expired");
		}
		user.password = password;
		user.token = null;
		await user.save();
		return jsonResponse(res, true, "Password changed");
	} catch (error) {
		console.log(error);
		return jsonResponse(res, false, "Internal server error");
	}
});

app.listen(port, () => {
	console.log(`Listening to port ${port}...`);
});
