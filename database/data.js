import mongoose from "mongoose";

const connectDB = () => {
	mongoose
		.connect(process.env.MONGO_URI, {
			dbName: process.env.DBNAME,
		})
		.then((c) => {
			console.log(`Database is connected to ${c.connection.name}`);
		})
		.catch((error) => {
			console.log(error);
		});
};

export default connectDB;