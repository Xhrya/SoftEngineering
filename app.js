const mysql = require("mysql2");
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const tagCategories = {
    "cuisine": { lowerBound: 1, upperBound: 999 },
    "dietRest": { lowerBound: 1000, upperBound: 1999 },
    "serviceType": { lowerBound: 2000, upperBound: 2999 },
    "specialTags": { lowerBound: 3000, upperBound: 3999 },
    "foodCat": { lowerBound: 4000, upperBound: 4999 },
    "mealType": { lowerBound: 5000, upperBound: 5999 }
    // Future categories can be added here (after being added to data base)
};

const dataBase = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "DB",
    password: "password",
    multipleStatements: true
});

const queryDatabase = (query, params = []) => {
    return new Promise((resolve, reject) => {
        dataBase.query(query, params, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;
    
    if (pathname === '/') serveStaticFiles(req, res, './resources/index.html')
    else if(pathname.startsWith('/menu.html')) serveStaticFiles(req, res, './resources/menu.html')
    else if(pathname.startsWith('/indexStyle.css')) serveStaticFiles(req, res, './resources/indexStyle.css')
    else if(pathname.startsWith('/menuStyle.css')) serveStaticFiles(req, res, './resources/menuStyle.css')
    else if (req.method === 'GET') {
        // Handle all GET requests
        try {
            const result = await handleAction(req);
            if (typeof result === 'object') { // Make sure it's an object
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(result));
            } else {
                sendResponse(res, 200, result);
            }
        } catch (error) {
            sendResponse(res, error.statusCode || 400, error.message);
        }
    } else {
        // If not GET, return method not allowed
        sendResponse(res, 405, 'Supported Methods: GET');
    }
});

function serveStaticFiles(req, res, pathname) {
    const filePath = path.join(__dirname, pathname);
    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found');
            return;
        }
        if (stats.isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                // Add other MIME types as needed
            };
            res.writeHead(200, {'Content-Type': mimeType[ext] || 'text/plain'});
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(403, {'Content-Type': 'text/plain'});
            res.end('Access Denied');
        }
    });
};

const handleAction = async (req) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    try{
        if (pathname === '/restaurants' && !query.search && !query.sort) return await getRestaurants(parsedUrl);
        else if (pathname.startsWith('/restaurants/') && pathname.endsWith('/menu') && !query.search && !query.sort) return await getMenu(parsedUrl);
        else if (pathname === '/restaurants' && query.search) return await searchRestaurants(parsedUrl);
        else if (pathname.startsWith('/restaurants/') && pathname.endsWith('/menu') && query.search) return await searchMenu(parsedUrl);
        else if (pathname === '/restaurants' && query.sort === 'category') return await sortRestaurantsCategory(parsedUrl);
        else if (pathname.startsWith('/restaurants/') && pathname.endsWith('/menu') && query.sort === 'category') return await sortMenuCategory(parsedUrl);
        else if (pathname === '/restaurants' && query.sort === 'price') return await sortRestaurantsPrice(parsedUrl);
        else if (pathname.startsWith('/restaurants/') && pathname.endsWith('/menu') && query.sort === 'price') return await sortMenuPrice(parsedUrl);
        else throw { statusCode: 400, message: 'Resource not found' }
    } catch (error) { throw { statusCode: 400, message: 'Bad Request' } }

};

const helpSearchAlgo = async (queryDB) => {

    let queryDB2 = `SELECT * FROM Tags`;

    try {
        const results = await queryDatabase(queryDB);
        const tags = await queryDatabase(queryDB2);
        
        // Create a mapping object from the tags array for quick lookup
        const tagMapping = tags.reduce((acc, tag) => {
            acc[tag.tagID] = tag.name;
            return acc;
        }, {});

        // Transform the category string to an array of tag names
        const transformedResults = results.map(seller => {
            const categoryIds = JSON.parse(seller.category);
            const categoryNames = categoryIds.map(id => tagMapping[id]);
            return {
                ...seller,
                category: categoryNames
            };
        });

        return transformedResults;
    } catch (error) {
        console.error('Database query failed:', error);
        throw new Error('Failed to fetch restaurants');
    }
};

const getRestaurants = async (parsedUrl) => {
    const query = parsedUrl.query;
    const state = query.state ? ` WHERE state = '${query.state}'` : '';
    const queryDB = `SELECT * FROM Seller${state}`;

    const results = await helpSearchAlgo(queryDB);
    return results;
};


const getMenu = async (parsedUrl) => {
    const pathname = parsedUrl.pathname;
    const restaurant_id = pathname.split('/')[2];

    let queryDB = `SELECT * FROM Menu_Item WHERE seller_id = ${restaurant_id}`;

    let queryDB2 = `SELECT * FROM Tags`;

    try {
        const results = await queryDatabase(queryDB);
        const tags = await queryDatabase(queryDB2);
        
        // Create a mapping object from the tags array for quick lookup
        const tagMapping = tags.reduce((acc, tag) => {
            acc[tag.tagID] = tag.name;
            return acc;
        }, {});

        // Transform the category string to an array of tag names
        const transformedResults = results.map(Menu_Item => {
            const categoryIds = JSON.parse(Menu_Item.tagArray);
            const categoryNames = categoryIds.map(id => tagMapping[id]);
            return {
                ...Menu_Item,
                tagArray: categoryNames
            };
        });

        return transformedResults;
    } catch (error) {
        console.error('Database query failed:', error);
        throw new Error('Failed to fetch restaurants');
    }
};

const searchRestaurants = async (parsedUrl) => {
    const query = parsedUrl.query;
    const state = query.state ? `state = '${query.state}' AND ` : '';
            
    let queryDB = `
        SELECT * 
        FROM Seller WHERE 
        ${state}
        (MATCH(name, description) 
        AGAINST ('${query.search}' IN NATURAL LANGUAGE MODE)
        OR 
        MATCH(name, description) 
        AGAINST ('${query.search}*' IN BOOLEAN MODE))
    `
    const results = await helpSearchAlgo(queryDB);
    //const results = await queryDatabase(queryDB);

    return results;
};

const searchMenu = async (parsedUrl) => {
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const restaurant_id = pathname.split('/')[2];

    let queryDB = `
        SELECT * 
        FROM Menu_Item WHERE seller_id = ${restaurant_id}
        AND (
            MATCH(name, description) 
            AGAINST ('${query.search}' IN NATURAL LANGUAGE MODE)
            OR 
            MATCH(name, description) 
            AGAINST ('${query.search}*' IN BOOLEAN MODE)
        )
    `

    const results = await queryDatabase(queryDB);

    return results;
};

const sortRestaurantsCategory = async (parsedUrl) => {
    
    const query = parsedUrl.query;
    let category = tagCategories[query.category];
    const state = query.state ? `state = '${query.state}' AND` : '';

    let queryDB = `
        SELECT s.*, t.name AS TagName
        FROM Seller s
        JOIN EntityTags et ON s.seller_id = et.entityID AND et.entityType = 'Seller'
        JOIN Tags t ON et.tagID = t.tagID
        WHERE ${state} t.tagID BETWEEN ${category.lowerBound} AND ${category.upperBound}
        ORDER BY t.name, s.name;
    `

    const results = await helpSearchAlgo(queryDB);
    //console.log(results);

    // Function that groups restaurants by a category
    let groupedByCategory = results.reduce((acc, curr) => {
        let key = curr.TagName;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(curr);
        return acc;
    }, {});


    return groupedByCategory;
};

const sortMenuCategory = async (parsedUrl) => {
    
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const restaurant_id = pathname.split('/')[2];

    let category = tagCategories[query.category];

    let queryDB = `
        SELECT mi.*, t.name AS TagName
        FROM Menu_Item mi
        JOIN EntityTags et ON mi.menu_item_id = et.entityID AND et.entityType = 'MenuItem'
        JOIN Tags t ON et.tagID = t.tagID
        WHERE mi.seller_id = ${restaurant_id} 
        AND t.tagID BETWEEN ${category.lowerBound} AND ${category.upperBound}
        ORDER BY t.name, mi.name;
    `

    const results = await queryDatabase(queryDB);

    // Function that groups restaurants by a category
    let groupedByCategory = results.reduce((acc, curr) => {
        let key = curr.TagName;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(curr);
        return acc;
    }, {});


    return groupedByCategory;
};

const sortRestaurantsPrice = async (parsedUrl) => {
    
    const query = parsedUrl.query;
    let category = tagCategories[query.category];

    let queryDB = `
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
            AvgPrice ${query.order};
    `

    const results = await queryDatabase(queryDB);

    return results;
};

const sortMenuPrice = async (parsedUrl) => {

    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const restaurant_id = pathname.split('/')[2];

    let queryDB = `
        SELECT 
            mi.menu_item_id,
            mi.name AS MenuItemName,
            mi.description,
            mi.price
        FROM 
            Menu_Item mi
        WHERE 
            mi.seller_id = ${restaurant_id}
        ORDER BY 
            mi.price ${query.order}; -- Use DESC for highest price first
    `

    const results = await queryDatabase(queryDB);
    
    return results[0];
};

const sendResponse = (res, statusCode, message) => {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(message));
};

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = server;
