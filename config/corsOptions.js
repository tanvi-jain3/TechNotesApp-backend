const allowedOrigins=require('./allowedOrigins')

const corsOptions={
    origin: (origin, callback)=>{
        console.log(`Origin: ${origin}`); //Debugging log
        if(allowedOrigins.indexOf(origin) !== -1 || !origin){
            callback(null, true)
        } else{ 
            console.log(`Blocked: ${origin}`); //Debugging log
            callback(new Error('Not Allowed by CORS'))
        }//allow postman, etc to access REST API 
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports=corsOptions