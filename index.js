const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); //jwt token er jonno 1
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 8000;
const app = express();


//middleware
app.use(cors());
app.use(express.json());

function verifyJWT (req, res, next) {

    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1]; //amra authHeader er modde (Bearer token numbar ta ase ) bearer er pore ekta space ase tai split er vitore ekta ' ' disi jate space er ager r porer ongso arrar er 2ta index e vag hoye jay
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        console.log(decoded); //https://jwt.io/ er maddome decode pai jar maddome amra ekta array pai jar modde {loggin email, r token er start time r kobe ses hobe token er meyad sei time ta pai} 
        req.decoded = decoded; // ei function er vitore req je peramitar ase tar modde decoded ta pathaye disce
        next();//next ta hosse holo jothy kno error na khay ba function er vitorer sotto gulo thik kore kaj kore tahole e function ta ses hoye porer kaj korbe mane je khan thake function ta call hoyse sei khaner kaj suru korbe
    })// token ta veryfy korar jonno
    // console.log('inside verifyJWT',authHeader);
    
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zowrr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');
        const orderCollection = client.db('geniusCar').collection('order');
        
        //Auth
        app.post('/login',async (req, res) => {
            const user = req.body;
            console.log(user);
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn : '1d'
            });
            res.send({accessToken});
        })

        //SERVICES API
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);

        })

        //post
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })

        //delete
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await serviceCollection.deleteOne(query);
            res.send(result);

        })


        //order Collection API

        app.get('/order', verifyJWT, async (req, res) => {
            // const email = req.query //(req.query) query er vitor ki ase seta check kortece
            // console.log(email); //{ email: 'bsmrstunaimuddin@gmail.com' } eita astese

            const decodedEmail = req.decoded.email;
            const email = req.query.email //(req.query.email) query er vitor je email er maan  ase seta nisce
            console.log(email); 

           if(email === decodedEmail){
            const query = {email: email}; //database e email ekta fild ase, sei email fild e amader req.query te asa email ta ke bosaye find korbo 
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
           }
           else{
            res.status(404).send({message: 'forbidden access'});
           }
        })


        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

    }
    finally{

    }

}

run().catch(console.dir);

app.get('/hero', (req, res) => {
    res.send('Hero meets hero ku')
})

app.get('/', (req, res) => {
    res.send('Running Genius Server');
})

app.listen(port, () => {
    console.log('Listen on port ' + port);
})