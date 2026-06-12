const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())

const uri = process.env.MONGO_URL

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//this is server running inings
app.get('/', (req, res) => {
  res.send('Hello World!')
})


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //data base connect 
     const database = client.db("jobs-portal");
    const jobCollection = database.collection("recruter-jobs");

   //recruter job post 
  app.post('/api/jobs',async(req,res)=>{
    const jbody=req.body
    const result = await jobCollection.insertOne(jbody)
    res.send(result)
  })
  // recruter job post 
  app.get('/api/jobs',async(req,res)=>{
    const query={}
    if(req.query.companyId){
      req.query=req.query.companyId
    }
    if(req.query.status){
      req.query=req.query.status
    }
    const cursor = jobCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => {
  console.log(`server is running on port ${port}`)
})