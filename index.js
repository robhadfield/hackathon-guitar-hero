import express from 'express';
import path from 'path';
import fs from 'fs';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { compare } from 'audio-compare';
import _ from 'lodash';
import { fileURLToPath } from 'url';
//import indexRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadFolder = path.join(__dirname, 'public/uploads/');

const app = express();

// enable files upload
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 10 * 1024 * 1024 * 1024 //10MB max file(s) size
    },
}));

// add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

// static files
app.use(express.static(__dirname + '/public'));

// upload single file
// https://attacomsian.com/blog/uploading-files-nodejs-express
app.post('/upload-music', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "music") to retrieve the uploaded file
            let music = req.files.music;
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            music.mv(path.join(uploadFolder, music.name));

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: music.name,
                    mimetype: music.mimetype,
                    size: music.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/compare-files', async (req, res) => {

    const source = req.query.file ? path.join(uploadFolder, req.query.file) : '';

    // Files
    const mastersRoot = path.join(__dirname, 'masters');

    let masters = [];
    for await (const file of fs.readdirSync(mastersRoot)) {
        masters.push(await compare({
            source,
            dest: path.join(mastersRoot, file),
        }));
    }

    res.send({
        status: true,
        message: 'Compared files',
        data: {
            files: masters,
        }
    });
});

// view engine and routing setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.use('/', indexRouter);

//make uploads directory static
app.use(express.static('uploads'));

//start app 
const port = process.env.PORT || 3001;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);