import Message from "../Models/MessageSchema.js";

export const saveMessage = async (req, res) => {

    const { name, email, message } = req.body;

    if(!name || !email || !message)
        return res.status(400).json({ message: "Missing required fields"});
    try{
        const savedMessage = await Message.create({
            name: name,
            email: email,
            message: message,
        });
        res.status(201).json({ 
            name: savedMessage.name,
            email: savedMessage.email,
            message: savedMessage.message
        }
        
        );
    }catch(error) {
        res.status(500).json({ message: "Error saving message" });
    }
}