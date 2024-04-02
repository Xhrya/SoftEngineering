const url_lib = require('url');
const mysql = require('mysql');
const path = require('path');

//Database
const formidable = require('formidable'); // For parsing form data
var fs = require('fs');

//All Menu API Tools
const parseCSVMenu_tools = require(path.join(__dirname, "../tools/parseCSVMenu_tools.js"));
const addMenuItem_tools = require(path.join(__dirname, "../tools/addMenuItem_tools.js"));
const editMenuItem_tools = require(path.join(__dirname, "../tools/editMenuItem_tools.js"));
const deleteMenuItem_tools = require(path.join(__dirname, "../tools/deleteMenuItem_tools.js"));


const router = async (req, res)  => {

    let urlParts = [];
    let segments = req.url.split('/');
    
    for (i = 0, num = segments.length; i < num; i++) {
        if (segments[i] !== "") { // check for trailing "/" or double "//"
            urlParts.push(segments[i]);
        }
    }

    let sellerID = urlParts[1]; // URL = /seller/{id}

    let menu_decision = urlParts[3]; // URL = /seller/{id}/menu/upload OR /seller/{id}/menu/add OR /seller/{id}/menu/edit OR /seller/{id}/menu/delete

    switch(menu_decision){
        case 'upload':
            if (req.method === 'POST') {
            // parse a file upload
            
            const form = new formidable.IncomingForm();
            let fields;
            let files;
            try {
                [fields, files] = await form.parse(req);
                let oldpath = files[''][0].filepath;

                let newpath = './menuuploads/' + files[''][0].originalFilename;
                fs.rename(oldpath, newpath, function (err) {
                  if (err) throw err; 
                  else{
                        parseCSVMenu_tools(res, newpath, sellerID);
                  }
                });
                
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("Not able to receive file: " + err.toString());
                console.log(err.toString());
                }
            return;
        }else{
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Wrong method type.');
        }
            break;
        case 'add':
            if (req.method === 'POST'){

                let data = '';
                req.on('data',(chunk) => {
                    data += chunk;
                })

                req.on('end', () => {
                    try{
                        addMenuItem_tools(res, data, sellerID);
                    }catch(err) {
                        //invalid JSON body
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end(err.toString());
                        console.log(err.toString());
                    }
                })

            } else {
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('Wrong method type.');
            }
            break;
        case 'edit':
            if (req.method === 'POST'){
                let data = '';
                req.on('data',(chunk) => {
                    data += chunk;
                })

                req.on('end', () => {
                    try{
                        editMenuItem_tools(res, data, sellerID);
                    }catch(err) {
                        //invalid JSON body
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Error parsing JSON data!');
                    }
                })
            } else {
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('Wrong method type.');
            }
            break;
        case 'delete':
            if (req.method === 'DELETE'){

                let data = '';
                req.on('data',(chunk) => {
                    data += chunk;
                })

                req.on('end', () => {
                    try{
                        deleteMenuItem_tools(res, data, sellerID);
                    }catch(err) {
                        //invalid JSON body
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Error parsing JSON data!');
                    }
                })
            } else {
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('Wrong method type.');
            } 
            break;
        default:
    }

}

module.exports = {router};