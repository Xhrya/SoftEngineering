const path = require('path');

const db = require(path.join(__dirname, "../tools/db.js"));

const router = (req, res) => {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        })
        req.on('end', () => {
            try{
                // JSON.parse() will throw error if parsing was unsuccessful that will be caught by catch stmt
                const parsedBody = JSON.parse(data);

                switch( parsedBody.action.toLowerCase() ){
                    // Returns array of JSON objects of all the restaurants names and descriptions
                    case 'restaurants':
                        let query1 = `SELECT name, description, category FROM Seller`;

                        db.all(query1, function(error, results){
                            if(error){
                                res.writeHead(500, {'Content-Type': 'application/json'});
                                res.end('Internal server error. Please try again later.');
                            }
                            else{
                                res.writeHead(200, {'content-type': 'application/json'});
                                res.end(JSON.stringify(results));
                            }
                        });

                        return;
                    
                    // Returns array of JSON objects of all the menu items names and descriptions
                    case 'menu':
                        let query2 = `SELECT name, description, tagArray FROM Menu_Item WHERE seller_id = ${parsedBody.restaurant}`;

                        db.all(query2, function(error, results){
                            if(error){
                                res.writeHead(400, {'Content-Type': 'plain/text'});
                                res.end('Bad Request');
                            }
                            else{
                                res.writeHead(200, {'content-type': 'application/json'});
                                res.end(JSON.stringify(results));
                            }
                        });

                        return;

                    // Search Engine
                    case 'search':
                        // Filters a specific menu given Sellers seller_id (restaurant key) and keyword to search (user input)
                        if( 'restaurant' in parsedBody ){

                            let query3 = `
                                SELECT name, description 
                                FROM Menu_Item WHERE seller_id = ${parsedBody.restaurant}
                                AND (
                                    MATCH(name, description) 
                                    AGAINST ('${parsedBody.keyword}' IN NATURAL LANGUAGE MODE)
                                    OR 
                                    MATCH(name, description) 
                                    AGAINST ('${parsedBody.keyword}*' IN BOOLEAN MODE)
                                )`;
                            
                            db.all(query3, function(error, results){
                                if(error){
                                    res.writeHead(400, {'Content-Type': 'plain/text'});
                                    res.end('Bad Request');
                                }
                                else{
                                    res.writeHead(200, {'content-type': 'application/json'});
                                    res.end(JSON.stringify(results));  
                                }
                            });

                        }
                        // Filters all restaurants given user inputted keyword
                        else{
                            let query3 = `
                                SELECT name, description 
                                FROM Seller WHERE 
                                MATCH(name, description) 
                                AGAINST ('${parsedBody.keyword}' IN NATURAL LANGUAGE MODE)
                                OR 
                                MATCH(name, description) 
                                AGAINST ('${parsedBody.keyword}*' IN BOOLEAN MODE)
                            `
                            
                            db.all(query3, function(error, results){
                                if(error){
                                    res.writeHead(400, {'Content-Type': 'plain/text'});
                                    res.end('Bad Request');
                                }
                                else{
                                    res.writeHead(200, {'content-type': 'application/json'});
                                    res.end(JSON.stringify(results));  
                                }
                            });
                        }

                        return;
                    
                    // Sort restaurants or restaurant menu by category
                    case 'sort':
                        if( 'restaurant' in parsedBody ){
                            let category = tagCategories[parsedBody.category];
                            // query4 will throw error if category is not in tagCategories
                            let query4 = `
                                SELECT mi.name AS MenuItemName, mi.description, t.name AS TagName
                                FROM Menu_Item mi
                                JOIN EntityTags et ON mi.menu_item_id = et.entityID AND et.entityType = 'MenuItem'
                                JOIN Tags t ON et.tagID = t.tagID
                                WHERE mi.seller_id = ${parsedBody.restaurant} 
                                AND t.tagID BETWEEN ${category.lowerBound} AND ${category.upperBound}
                                ORDER BY t.name, mi.name;
                            `

                            db.all(query4, function(error, results){
                                if(error){
                                    res.writeHead(400, {'content-type': 'plain/text'}); // Bad Request
                                    res.end('Bad Request');
                                }
                                else{
                                    // Function that groups restaurants by a category
                                    let groupedByCategory = results.reduce((acc, curr) => {
                                        let key = curr.TagName;
                                        if (!acc[key]) {
                                            acc[key] = [];
                                        }
                                        acc[key].push({ name: curr.MenuItemName, description: curr.description });
                                        return acc;
                                    }, {});
                                        
                                    res.writeHead(200, {'content-type': 'application/json'});
                                    res.end(JSON.stringify(groupedByCategory));
                                }
                            });
                        }
                        else{
                            let category = tagCategories[parsedBody.category];
                            let query4 = `
                                SELECT s.name AS RestaurantName, s.description, t.name AS TagName
                                FROM Seller s
                                JOIN EntityTags et ON s.seller_id = et.entityID AND et.entityType = 'Seller'
                                JOIN Tags t ON et.tagID = t.tagID
                                WHERE t.tagID BETWEEN ${category.lowerBound} AND ${category.upperBound}
                                ORDER BY t.name, s.name;
                            `
    
                            db.all(query4, function(error, results){
                                if(error){
                                    res.writeHead(400, {'content-type': 'plain/text'}); // Bad Request
                                    res.end('Bad Request');
                                }
                                else{
                                    // Function that groups restaurant menu by a category
                                    let groupedByCategory = results.reduce((acc, curr) => {
                                        let key = curr.TagName;
                                        if (!acc[key]) {
                                            acc[key] = [];
                                        }
                                        acc[key].push({ name: curr.RestaurantName, description: curr.description });
                                        return acc;
                                    }, {});
                                        
                                    res.writeHead(200, {'content-type': 'application/json'});
                                    res.end(JSON.stringify(groupedByCategory));
                                }
                            });
                        }

                        return;

                    // Sort restaurant menu by price high to low or low to high
                    case 'sortprice':
                        if( 'restaurant' in parsedBody ){
                            let query6 = `
                                SELECT 
                                    mi.menu_item_id,
                                    mi.name AS MenuItemName,
                                    mi.description,
                                    mi.price
                                FROM 
                                    Menu_Item mi
                                WHERE 
                                    mi.seller_id = ${parsedBody.restaurant}
                                ORDER BY 
                                    mi.price ${parsedBody.order}; -- Use DESC for highest price first
                        `

                        db.all(query6, function(error, results){
                            if(error){
                                res.writeHead(400, {'content-type': 'plain/text'}); // Bad Request
                                res.end('Bad Request');
                            }
                            else{
                                res.writeHead(200, {'content-type': 'application/json'});
                                res.end(JSON.stringify(results[0]));
                            }
                        });

                        }
                        else{
                            let query6 = `
                                SELECT 
                                    s.seller_id,
                                    s.name AS RestaurantName,
                                    s.description,
                                    COALESCE(avg_prices.avg_price, 0) AS AvgPrice -- Use COALESCE to handle restaurants with no menu items
                                FROM 
                                    Seller s
                                LEFT JOIN (
                                    SELECT 
                                        seller_id, 
                                        AVG(price) AS avg_price
                                    FROM 
                                        Menu_Item
                                    GROUP BY 
                                        seller_id
                                ) avg_prices ON s.seller_id = avg_prices.seller_id
                                ORDER BY 
                                    AvgPrice ${parsedBody.order}; -- Or DESC for highest prices first
                            `
    
                            db.all(query6, function(error, results){
                                if(error){
                                    res.writeHead(400, {'content-type': 'plain/text'}); // Bad Request
                                    res.end('Bad Request');
                                }
                                else{
                                        
                                    res.writeHead(200, {'content-type': 'application/json'});
                                    res.end(JSON.stringify(results[0]));
                                }
                            });
                        }

                        return;

                    default:
                        res.writeHead(400, {'content-type': 'plain/text'}); // Bad Request
                        res.end('Supported actions: [restaurants, menu, search, sort, sortprice]');
                }
            }
            catch(error){
                res.writeHead(400, {'content-type': 'plain/text'}); // Bad Request
                res.end('Invalid JSON Format/Input/s');
            }
        })
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
		res.end('Wrong method type');
    }
}

module.exports = router;