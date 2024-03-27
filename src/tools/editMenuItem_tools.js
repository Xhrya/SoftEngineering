const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });
const db = require(path.join(__dirname, "../tools/db.js"));

function editMenuItem_tools(res, data, sellerID){

    body = JSON.parse(data);


    let tags;
			let q1 = `select tag_id from Tags where name in ('${body.Cuisine}', '${body["Dietary Restriction"]}',  '${body["Service Type"]}',  '${body["Special Tags"]}',  '${body["Food Category"]}',  '${body["Meal Type"]}') order by tag_id;`;

			db.query(q1,(err, results)=> {
                if (err) throw err;

				if(err)
				{
					res.writeHead(500, { 'Content-Type': 'text/plain' });
					res.end('Server error');
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
				let q = `UPDATE Menu_Item SET price = '${body.Price}', description = '${body.Description}', available = ${body.Available}, tagArray = ${tags} where name = '${body.Name}' and seller_id = '${sellerID}'`;

				db.query(q, (err, results) => {
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
			})


}

module.exports = {editMenuItem_tools};
