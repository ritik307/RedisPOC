const express = require("express");
const cors = require("cors");
const axios = require("axios"); 
const {createClient} = require("redis");

const redisClient = createClient({
    legacyMode: true
});
// await redisClient.connect();

const app = express();

app.use(express.urlencoded({extended:true}));
app.use(cors());

const DEFAULT_EXPIRATION = 3600;

app.get("/test",(req,res)=>{
    res.send("Hello world");
})

app.get("/photos",async (req,res)=>{
    console.log("here");
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


async function getOrSetCache(key,cb){
    console.log("--key:",key);
    return new Promise(async (resolve,reject)=>{
        console.log("here2");
        
        redisClient.get(key,async(err,data)=>{
            if(err){
                return reject(err);
            }
                
            if(data != null){
                console.log("CACHE HIT");
                return resolve(JSON.parse(data));
            }
            console.log("CACHE MISS");
            const freshData = await cb();
            redisClient.setex(key,DEFAULT_EXPIRATION,JSON.stringify(freshData))
            resolve(freshData);
        })
    })
}
app.listen(8080,async ()=>{
    await redisClient.connect();
    console.log("app is running");
})