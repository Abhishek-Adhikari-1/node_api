import mongoose from "mongoose";

const connectDB = () => {
	mongoose
		.connect(process.env.MONGO_URI, {
			dbName: "backend_api",
		})
		.then((c) => {
			console.log(`Database is connected to ${c}`);
		})
		.catch((error) => {
			console.log(error);
		});
};

export default connectDB;