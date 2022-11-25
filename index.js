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

const run = async () => {
    try {
        const usersCollection = client.db('reused_project').collection('users');
        const productsCollection = client.db('reused_project').collection('products');
        const bookingsCollection = client.db('reused_project').collection('bookings');

        app.post('/bookings', async(req, res) => {
            const bookingData = req.body;
            const result = await bookingsCollection.insertOne(bookingData);
            res.send(result);
        })

        app.get('/category', async (req, res) => {
            const filter = {};
            const categories = await productsCollection.find(filter).toArray();
            res.send(categories);
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { categoryId: id };
            const categoryItems = await productsCollection.findOne(filter);
            res.send(categoryItems);
        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);

            // generate jwt token
            const token = jwt.sign(user, process.env.RMI_TOKEN, { expiresIn: '2d' });

            res.send({ result, token });
        });
    }
    finally {

    }
}

run().catch(error => {
    console.log(error.message);
})

app.get('/', (req, res) => {
    res.send('Mobile Island server is running');
});

app.listen(port, () => {
    console.log(`server is up and running on port ${port}`);
});