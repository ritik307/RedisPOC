const express = require("express");
const cors = require("cors");
const axios = require("axios"); 
const Redis = require("redis");

const redisClient = Redis.createClient();

const app = express();

app.use(express.urlencoded({extended:true}));
app.use(cors());

app.get("/test",(req,res)=>{
    res.send("Hello world");
})

app.get("/photos",async (req,res)=>{
    const albumId = req.query.albumId
    const photos = await getOrSetCache(`photos?albumId=${albumId}`,async ()=>{
        const {data} = await axios.get(`https://jsonplaceholder.typicode.com/photos`,{
            params : {albumId}
        })
        return data;
    })
    res.status(200).json(photos);
})

app.get("/photos/:id",async (req,res)=>{
    const photo = await getOrSetCache(`photos:${req.params.id}`,async ()=>{
        const {data} = await axios.get(`https://jsonplaceholder.typicode.com/photos`,{
            params : {albumId}
        })
        return data;
    })
    res.status(200).json(photo);
})


function getOrSetCache(key,cb){
    return new Promise((resolve,reject)=>{
        redisClient.get(key,async(err,data)=>{
            if(err)
                return reject(err);
            if(data != null)
                return resolve(JSON.parse(data));

            const freshData = await cb();
            redisClient.setex(key,DEFAULT_EXPIRATION,JSON.stringify(freshData))
            resolve(freshData);
        })
    })
}
app.listen(80,()=>{
    console.log("app is running");
})