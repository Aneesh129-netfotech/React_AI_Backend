import mongoose from 'mongoose'

// const db=async()=>{
//     try{
//         await mongoose.connect(process.env.MONGO_URL)
//         console.log('MongoDb is connected')
//     }catch(error){
//         console.log('MongoDb is not connected',error)
//     }
// }

const db= async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB is connected');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}

export default db