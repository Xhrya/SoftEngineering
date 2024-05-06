const url_lib = require('url');
const path = require('path');

const db = require(path.join(__dirname, "../tools/db.js"));

function parseCSVMenu_tools(res, file, sellerID){

	const Fs = require('fs');
	const CsvReadableStream = require('csv-reader');

	let inputStream = Fs.createReadStream(file, 'utf8');

	let numRows = 0;

	inputStream
		.pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, delimiter: ',', skipEmptyLines: true }))
		.on('data', function (row) {

			if (numRows < 2) {
				numRows += 1;
			}
			else {

				let tags;
				let q1 = `select tagID from Tags where name in ('${row[4]}', '${row[5]}',  '${row[6]}',  '${row[7]}',  '${row[8]}',  '${row[9]}') order by tag_id;`;

				db.all(q1, (err, results) => {
					if (err) throw err;
					else {
						tags = `'[`;
						for (let i = 0; i < results.length; i++) {
							if (i > 0) {
								tags += ',';
							}
							tags += results[i].tag_id;
						}

						tags += `]'`;
					}
					let available = row[3] === 'TRUE' ? 1 : 0;
					let q = `INSERT INTO Menu_Item VALUES (default, 1, '${row[0]}', '${row[1]}', '${row[2]}', ${available}, ${tags})`;

					db.run(q, (err, results) => {
						if (err) {
							let obj = { error: err };
							res.statusCode = 500;
							res.end("Inserting Menu Items Error: " + JSON.stringify(obj));	
									
						}else{
							let obj = { success: true };
							res.statusCode = 200;
							res.end(JSON.stringify(obj));
							
						}
					})
				})


			}

		})
		.on('end', function () {
		});

}

module.exports = {parseCSVMenu_tools};
