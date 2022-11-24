const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.tkcvter.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.listen(port, () => {
    console.log(`server is up and running on port ${port}`);
});

// app.put('/user/:email', async (req, res) => {
//     const email = req.params.email;
//     const user = req.body;
//     const filter = { email: email };
//     const options = { upsert: true };
//     const updatedDoc = {
//       $set: user,
//     }
//     const result = await usersCollection.updateOne(filter, updatedDoc, options);
//     console.log(result);

//     // generate jwt token
//     const token = jwt.sign(user, process.env.ACCESS_TOKEN_AIRCNC, { expiresIn: '2d' })

//     res.send({ result, token });
//   });