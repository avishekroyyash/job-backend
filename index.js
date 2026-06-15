const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
     const companyCollection = database.collection("recruter-company");
    const userCollection = database.collection('user')
    const applicationCollection = database.collection('applications')
    const plansCollection = database.collection('plans')
    const subscriptionCollection = database.collection('subscription')

   //recruter job post 
  app.post('/api/jobs',async(req,res)=>{
    const jbody=req.body
    const newJob = {
      ...jbody,
      createdAt:new Date()
    }
    const result = await jobCollection.insertOne(newJob)
    res.send(result)
  })
  //all job seeker get the application 
  app.get('/api/applications',async(req,res)=>{
    const query={}
    // const c = req.query.applicantId
    // console.log(c,'this is req.query in server get ')
    if(req.query.applicantId){
      query.applicantId=req.query.applicantId
          // console.log(query.applicantId,'this is query.applicantId in server get ')
    }
    if(req.query.jobId){
      query.jobId = req.query.jobId
    }
    const cursor = applicationCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })

  // plans
  app.get('/api/plans',async(req,res)=>{
    const query = {}
    if(req.query.plan_id){
      query.id=req.query.plan_id
    }
    const plan = await plansCollection.findOne(query)
    res.send(plan)
  })
  //subscription post using metadata
  app.post('/api/subscription',async(req,res)=>{
    const metabody = req.body
    const subInfo ={
      ...metabody,
      createdAt: new Date()
    }
    const result = await subscriptionCollection.insertOne(subInfo)
    res.send(result)
    //update user plan like seeker_free to seeker_pro
    const filter = {email:metabody.email}
    const updateDocument = {
      $set:{
        plan:metabody.planId,
      }
    }
    const updateResult = await userCollection.updateOne(filter,updateDocument)
    res.send(updateResult)
  })


  //all job seeker application api
  app.post('/api/applications',async(req,res)=>{
    const appbody = req.body
    const newAplication = {
      ...appbody,
      createdAt: new Date()
    }
    const result = await applicationCollection.insertOne(newAplication)
    res.send(result)
  }) 




 // get user 
 app.get('/api/users',async(req,res)=>{
  const cursor = userCollection.find().skip(5)
  const result = await cursor.toArray()
  res.send(result)
 })
   // get all  company related info
  app.get('/api/companies',async(req,res)=>{
    const result = await companyCollection.find().toArray()
    res.send(result)
  })



  // recruter job post 
 app.get('/api/jobs', async (req, res) => {
  const query = {};
  if (req.query.companyId) {
    query.companyId = req.query.companyId;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  const result = await jobCollection.find(query).toArray();
  res.send(result);
});

// get a particular job by specific company id
app.get('/api/jobs/:id',async(req,res) => {
  const id =req.params.id
  const result = await jobCollection.findOne({_id: new ObjectId(id)})
  res.send(result)
})
    

  // recruter company related api
  app.post('/api/companies',async(req,res)=>{
    const company = req.body
    const newCompany ={
      ...company,
      createdAt: new Date()
    }
    const result = await companyCollection.insertOne(company)
    res.send(result)
  })
  //recruter company information of own 
  app.get('/api/my/companies',async(req,res)=>{
    const query={}
    if(req.query.recruiterId){
        query.recruiterId = req.query.recruiterId;

    }
    const result = await companyCollection.findOne(query)
    res.send(result || {})
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