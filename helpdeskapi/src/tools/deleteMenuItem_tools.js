const path = require('path');
const db = require(path.join(__dirname, "../tools/db.js"));

function deleteMenuItem_tools(res, data, sellerID){

        let body = JSON.parse(data);

        let q = `DELETE FROM Menu_Item WHERE name = '${body.Name}' and seller_id = '${sellerID}'`;

        db.run(q, (err, results) => {
            if (err) {
                let obj = { error: err };
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(JSON.stringify(obj));
            }else{
                let obj = { "success true": results };
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(JSON.stringify(obj));
            }
        })

}

module.exports = {deleteMenuItem_tools};