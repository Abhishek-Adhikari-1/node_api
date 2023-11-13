import mongoose from "mongoose";

const schema = new mongoose.Schema({
	name: String,
	email: String,
	password: String,
	token: Number,
});
const User = mongoose.model("Users", schema);

export default User;
