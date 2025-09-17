const express = require('express');
const cors = require('cors');
const {Pool} = require('pg');
const helmet = require('helmet');
const morgan = require('morgan');
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
app.use(helmet());
app.use(morgan('combined'));
app.use(express.urlencoded({ extended: true }));

pool.connect((err,client,release)=>{
    if(err){
        console.error('Error acquiring client',err.stack);
    }
    console.log('Connected to PostgreSQL database');
    release();
})

app.get('/users',async(req,res)=>{
    try{
        const result = await pool.query('SELECT * FROM jeeadv_2025_seat_allotment');
        res.json({
            success:true,
            data:result.rows,
            count:result.rowCount
        });
    }catch(err){
        console.error('Error fetching users',err);
        res.status(500).json({
            success:false,
            error: 'Internal server error'
        })
    }
})

app.get('/iit/:iitId',async(req,res)=>{
    try{
        const {iitId} = req.params;
        const {branch , category } = req.query;
        let query= `SELECT * FROM jeeadv_2025_seat_allotment WHERE iit=$1`;
        let params=[iitId];
        let paramIndex=2;
        if(branch){
            query+=` AND branch=$${paramIndex}`;
            params.push(branch);
            paramIndex++;
        }
        if(category){
            let catColumn;
            switch(category.toUpperCase()){
                case 'EWS':
                    catColumn='ews_rank';
                    break;
                case 'OBC':
                    catColumn='obc_rank';
                    break;
                case 'SC':
                    catColumn='sc_rank';
                    break;
                case 'ST':
                    catColumn='st_rank';
                    break;
                default:
                     catColumn=category;
                     break;
            }
            query+= ` AND ${catColumn} IS NOT NULL`;
        }
        query +=  ' ORDER BY rank,ews_rank,obc_rank,sc_rank,st_rank';
        const result = await pool.query(query,params);
        res.json({
            success:true,
            data:result.rows,
            count:result.rowCount
        });
    }catch(err){
        console.error('Error fetching users',err);
        res.status(500).json({
            success:false,
            error: 'Internal server error'
        })
    }
})

app.get('/category/:category',async(req,res)=>{
    try{
        const {category} = req.params;
        const {iit , branch } = req.query;
        const validCategoryColumns = {
            'rank': 'rank',
            'ews': 'ews_rank',
            'obc': 'obc_rank',
            'sc': 'sc_rank',
            'st': 'st_rank',
            'open': 'rank' // Map common names to actual column names
        };
        const categoryColumn = validCategoryColumns[category.toLowerCase()];
        let query = `SELECT * FROM jeeadv_2025_seat_allotment WHERE ${categoryColumn} IS NOT NULL`;
        let params=[];
        let paramIndex=1;
        if(branch){
            query+=` AND branch=$${paramIndex}`;
            params.push(branch);
            paramIndex++;
        }
        if(iit){
            query+= ` AND iit=$${paramIndex}`;
            params.push(iit);
            paramIndex++;
        }
        query +=  ' ORDER BY rank,ews_rank,obc_rank,sc_rank,st_rank';
        const result = await pool.query(query,params);
        res.json({
            success:true,
            data:result.rows,
            count:result.rowCount
        })
    }catch(err){
        console.error('Error fetching users',err);
        res.status(500).json({
            success:false,
            error: 'Internal server error'
        })
    }
})



app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})
app.get('/users/:rank',async(req,res)=>{
    try{
        const { rank } =req.params;
        const result = await pool.query('SELECT * FROM jeeadv_2025_seat_allotment WHERE rank = $1',[rank]);
        if(result.rowCount===0){
            return res.status(404).json({
                success:false,
                error : "No record found"
            });
        }
        res.json({
            success:true,
            data:result.rows[0],
        })
    }catch(err){
        console.error('Error fetching users',err);
        res.status(500).json({
            success:false,
            error: 'Internal server error'
        })
    }
})



