const express = require('express');
const cors = require('cors');
const {Pool} = require('pg');
//const helmet = require('helmet');
//const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT||5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

pool.connect((err,client,release)=>{
    if(err){
        console.error('Error acquiring client',err.stack);
    }
    console.log('Connected to PostreSQL database');
    release();
})


app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})

