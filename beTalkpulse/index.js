const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();
const userRoutes = require('./Routes/userRoutes.js');
const postRoutes = require('./Routes/postRoutes.js');


const app = express();
app.use(cors());
app.use(express.json());





app.get('/',(req,res)=>{
  res.send('Hey! Hi, 🙋‍♀️👋🙌🏽🙏🏽');
});

// Routes
app.use('/api/users', userRoutes);

app.use('/api/posts',postRoutes);

mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser: true, 
  useUnifiedTopology: true,
}).then(()=>{
    console.log("MongoDB Connected successfully!!");
    app.listen(8000, () => {
      console.log(`Server is running on port 8000`);
    });
})