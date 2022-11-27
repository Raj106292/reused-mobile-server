const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.tkcvter.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.RMI_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
};

const run = async () => {
    try {
        const usersCollection = client.db('reused_project').collection('users');
        const productsCollection = client.db('reused_project').collection('products');
        const bookingsCollection = client.db('reused_project').collection('bookings');

        const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.status !== 'seller') {
                return res.status(403).send('unauthorized access');
            };
            next();
        }

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bookingsCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/bookings', verifyJWT, async (req, res) => {
            const userEmail = req.query.email;

            const decodedEmail = req.decoded.email;
            if (userEmail !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            };

            const filter = { email: userEmail };
            const result = await bookingsCollection.find(filter).toArray();
            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const bookingData = req.body;
            const result = await bookingsCollection.insertOne(bookingData);
            res.send(result);
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.status === 'seller' });
        })

        app.get('/products/:email', verifyJWT, verifySeller, async (req, res) => {
            const email = req.params.email;
            const result = await productsCollection.aggregate([
                {
                    $match: {
                        "product.sellerEmail": email,
                    }
                },
                {
                    $project: {
                        product: {
                            $filter: {
                                input: "$product",
                                as: "product",
                                cond: { $eq: ["$$product.sellerEmail", email] }
                            }
                        },
                        "_id": 1
                    }
                },
                {
                    $unwind: "$product"
                },
                {
                    "$replaceRoot": {
                        "newRoot": "$product"
                    }
                }
            ]).toArray();
            res.send(result);
        })

        app.patch('/new-product', async(req, res) => {
            const brandValue = req.query.brands;
            const productData = req.body;
            const filter = {brand: brandValue};
            const result = await productsCollection.updateOne(filter, {$push: { product: productData}})
            res.send(result);
        })

        app.patch('/products', async (req, res) => {
            const model = req.body;
            const filter = {'product.model': model.name}
            const updatedDoc = {
                $set: {
                    'product.$.status': 'stock out'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc);
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

        app.get('/user', async (req, res) => {
            const email = req.query.email
            const filter = { email: email };
            const result = await usersCollection.findOne(filter);
            res.send(result);
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