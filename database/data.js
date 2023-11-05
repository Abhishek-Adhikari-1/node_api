import mongoose from "mongoose";

const connectDB = () => {
	mongoose
		.connect(process.env.MONGO_URI, {
			dbName: "backend_api",
		})
		.then(() => {
			console.log("Database is connected.");
		})
		.catch((error) => {
			console.log(error);
		});
};

export default connectDB;