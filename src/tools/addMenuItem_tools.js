const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });
const db = require(path.join(__dirname, "../tools/db.js"));

function addMenuItem_tools(res, data, sellerID){

    
    body = JSON.parse(data);


    let tags;
			let q1 = `select tag_id from Tags where name in ('${body.Cuisine}', '${body["Dietary Restriction"]}',  '${body["Service Type"]}',  '${body["Special Tags"]}',  '${body["Food Category"]}',  '${body["Meal Type"]}') order by tag_id;`;

			db.query(q1,(err, results)=> {
                if(err)
				{
					res.writeHead(500, { 'Content-Type': 'text/plain' });
					res.end(err.toString());
				}
				else {
					tags = `'[`;
					for (let i = 0; i < results.length; i++)
					{
						if (i > 0)
						{
							tags += ',';
						}
						tags += results[i].tag_id;
                    }
					
					tags += `]'`;
				}
				let q = `INSERT INTO Menu_Item VALUES (default, '${sellerID}', '${body.Name}', '${body.Description}', '${body.Price}', ${body.Available}, ${tags})`;
				db.query(q, (err, results) => {
					if (err) {
                        let obj = { error: err };
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end(JSON.stringify(obj));
					}
                    else{
                        let obj = { success: true };
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end(JSON.stringify(obj));
                    }
				})
			})

}

module.exports = {addMenuItem_tools};
