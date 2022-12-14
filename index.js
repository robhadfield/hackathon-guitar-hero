const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');

const app = express();

// enable files upload
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 2 * 1024 * 1024 * 1024 //2MB max file(s) size
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
            music.mv('./public/uploads/' + music.name);

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

// view engine and routing setup
const indexRouter = require('./routes/index');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use('/', indexRouter);

//make uploads directory static
app.use(express.static('uploads'));

//start app 
const port = process.env.PORT || 3001;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);