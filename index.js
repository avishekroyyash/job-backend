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

// apply jwt
const logger = (req,res,next)=>{
  console.log('logger middle ware ', req.params)
  next()
}




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
    const sessionCollection = database.collection('session')


    //token verification 
    const verifyToken =async(req,res,next) =>{
  //console.log('verify token headerx',req.headers)
  const authHeader = req?.headers?.authorization
  if(!authHeader){
    return res.status(401).send({message : 'unauthorized'})
  }
  const token = authHeader.split(' ')[1]
  if(!token){
    return res.status(401).send({message:'unauthrized access'})
  }
  const query = {token : token}
  const session = await sessionCollection.findOne(query)
  //console.log(session,'this is the user session ');
  const userId = session?.userId
  //console.log(userId,'this is user id');
  const userQuery = {
    _id : userId
  }
  const user = await userCollection.findOne(userQuery)
  //set data into req object
  req.user = user ;
  //console.log('find the user by the id from session',user);
  next()
}

// it must be later from verifyToken
const verifySeeker =async(req,res,next)=>{
  if(req?.user?.role !== 'seeker'){
    return res.status(403).send({message : 'forbidden seeker access'})
  }
  next()
}
const verifyRecruter = async(req,res,next)=>{
  if(req?.user?.role !== 'recruter'){
    return res.status(403).send({message : 'fobidden recruter access'})
  }
  next()
}

const verifyAdmin = async(req,res,next) =>{
  if(req?.user?.role !== 'admin'){
    return res.status(403).send({message : 'forbidden admin access'})
  }
  next()
}






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
  app.get('/api/applications',verifyToken,verifySeeker,async(req,res)=>{
    const query={}
    // const c = req.query.applicantId
    // console.log(c,'this is req.query in server get ')
    if(req.query.applicantId){
      query.applicantId=req.query.applicantId
          // console.log(query.applicantId,'this is query.applicantId in server get ')
        // cheack weathe  for asking user information
        if(req?.user?._id?.toString() !== req.query.applicantId)  {
          return res.status(403).send({message : 'forbidden access seeker'})
        } 
         // console.log(req.user , req.query.applicantId)


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
//  app.get('/api/users',async(req,res)=>{
//   const cursor = userCollection.find().skip(5)
//   const result = await cursor.toArray()
//   res.send(result)
//  })



   // get all  company related info
  // app.get('/api/companies',async(req,res)=>{
  //   const result = await companyCollection.find().toArray()
  //   res.send(result)
  // })
  
  // inefficient way to join collection or notpipeline 
  app.get('/api/companies',verifyToken,verifyAdmin, async(req,res)=>{
    const companies = await companyCollection.find().toArray()

    // apply loop to get one by one company from allcompanies
   
   for(const company of companies ){
    const filter = {
      companyId: company._id.toString()
    }
    const jobCount = await  jobCollection.countDocuments(filter)
    company.jobCount = jobCount
   }

    res.send(companies)
  })


  // efficient way to join collection or pipeline 
  app.get('/api/companies2',async(req,res)=>{
  const pipeline = [
    {
      $skip:4
    },
    {
      $limit:5
    }
  ]
  const cursor = companyCollection.aggregate(pipeline);
  const result = await cursor.toArray()
  res.send(result)
  })
 // this is the 2 of aggregiation pipe line 
 app.get('/api/starts',async(req,res)=>{
  const pipeline = [
    {
      $group :{
        _id:'$jobType',
        count:{
          $sum: 1
        }
      }
    },
    {
      $project:{
        jobType: '$_id',
        count:1,
        _id: 0
      }
    },
    {
      $sort:{
        count: 1
      }
    }
  ]
  const result = await jobCollection.aggregate(pipeline).toArray()
  res.send(result)
 })



  // recruter job post 
 app.get('/api/jobs', async (req, res) => {
  console.log('server side hit ', req.query);
  const query = {};
 //this is job filter related quary like search , catagory ,isRemote
 if(req.query.search){
    query.$or =[
    { jobTitle: { $regex: req.query.search, $options: 'i' } },
    { companyName: { $regex: req.query.search, $options: 'i' } },
    { location: { $regex: req.query.search, $options: 'i' } },
    ]
  }
if(req.query.jobType){
  query.jobType = req.query.jobType
 }

    if(req.query.isRemote){
    query.isRemote=req.query.isRemote
  }

  // company related search quary
    if (req.query.companyId) {
    query.companyId = req.query.companyId;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  //pagination related query
  if(req.query.page){
    const page = req.query.page
    const perPage = req.query.perPage || 10
    const skp= (page-1)*perPage
    const total= await jobCollection.countDocuments(query)
    const cursor =  jobCollection.find(query).skip(skp).limit(perPage)
    const jobs = await cursor.toArray(); 
   return res.send({total,jobs});
  }
     const cursor =  jobCollection.find(query)
    const result = await cursor.toArray(); 
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
    const result = await companyCollection.insertOne(newCompany)
    res.send(result)
  })



//company data do update admin thats make new update api
  app.patch('/api/companies/:id',verifyToken,verifyAdmin,async(req,res)=>{
   const id = req.params.id
   const cbody = req.body
   const filter = {_id: new ObjectId(id)}
   const updateData = {
    $set:{
     status: cbody.status
    }
   }
   const result = companyCollection.updateOne(filter,updateData)
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