const express = require('express');
const bodyParser = require('body-parser');
const HttpError = require('./models/http-error')
const mongoose = require('mongoose')
require('dotenv').config()

const port = process.env.PORT || 5000;
const uri = process.env.URI;

const app = express();

const genericRoutes = require('./routes/generic-routes')
const adminsRoutes = require('./routes/admins-routes');
// const instructorsRoutes = require('./routes/instructors-routes');
// const learnersRoutes = require('./routes/learners-routes');


app.use(bodyParser.json());


app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    )
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    next();
})

app.use('/api', genericRoutes)
app.use('/api/admin', adminsRoutes);
// app.use('/api/instructor', instructorsRoutes);
// app.use('/api/learner', learnersRoutes)


app.use((req, res, next)=>{
    const error = new HttpError('Could not find this Route', 404);
    throw error;
})

app.use((error, req, res, next)=>{
    if(req.file){
        fs.unlink(req.file.path, (err)=>{
            console.log(err);
        });
    }
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'An Unknown error occured !'});
})


mongoose.connect(uri).then(()=>{
    app.listen(port, ()=>{
        console.log("Server Running on PORT 5000");
    })
}).catch(err=>{
    console.log(err);
});

