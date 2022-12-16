import express from 'express';
import path from 'path';
import fs from 'fs';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import fetch from 'node-fetch';
import { compare } from 'audio-compare';
import _ from 'lodash';
import { fileURLToPath } from 'url';
import { config } from './config.js';
//import indexRouter from './routes/index.js';
console.log(config);

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

        let result = await compare({
            source,
            dest: path.join(mastersRoot, file),
        });

        switch (file) {
            case 'law.wav':
                result.title = 'Deep Purple - Smoke On The Water';
                result.uuid = '12bd766f-dd62-4d50-87b2-da2f9753e4f5';
                break;
            case 'smellsliketeenspirit.wav':
                result.title = 'Nirvana - Smells Like Teen Spirit';
                result.uuid = 'd1cf3051-69fd-4976-afaf-237b67777b9a';
                break;
            case 'test.wav':
                result.title = 'The Kinks - You Really Got Me';
                result.uuid = '8966a2ac-1a12-403f-bf88-5798fc3d5016';
                break;
            case 'twinkle.wav':
                result.title = 'Queen - Killer Queen';
                result.uuid = 'ca276436-962e-4ce0-b4b9-33589d359f1c';
                break;
        }

        masters.push(result);
    }

    res.send({
        status: true,
        message: 'Compared files',
        data: {
            files: masters,
        }
    });
});

app.get('/vote', async (req, res) => {
    const songId = req.query.songid || '';

    if (!(songId.length > 0)){
        res.status(500).send(new Error('You must supply a songid'));
    }

    const body = {
        "feedback_uuid": config.pollId,
        "votings": [
            {
                "feedback_question_uuid": config.questionId,
                "feedback_question_option_uuid": songId,
                "is_anonymous": false
            }
        ],
        "is_anonymous": false
    };

    console.log('body', JSON.stringify(body, null, 4));

    const url = `${config.host}/events/${config.eventId}/polls/${config.pollId}/vote`;
    console.log(url);

    const response = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': config.token,
            'User-Agent': 'PostmanRuntime/7.29.2',
            'Accept': '*/*',
        }
    });

    const data = await response.json();
    res.send(data);
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