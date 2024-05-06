//const path = require('path');
const mysql = require('mysql2');
//const http = require("http");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    database:"DB",
    password: "password",
    multipleStatements: true
});

// Varuns database with minor changes
const initScript =
	`
	CREATE DATABASE IF NOT EXISTS DB;
	USE DB;

	DROP TABLE IF EXISTS User, Admin, Seller, Helpdesk, Patron, Flag, Ticket, Orders, Payment, Menu_Item;

	CREATE TABLE IF NOT EXISTS User (
	    user_id INT AUTO_INCREMENT PRIMARY KEY,
	    username VARCHAR(50) NOT NULL,
	    email VARCHAR(50) NOT NULL,
	    password VARCHAR(255) NOT NULL,
	    status VARCHAR(50) NOT NULL,
	    role INT NOT NULL,
	    CONSTRAINT unique_username UNIQUE (username),
	    CONSTRAINT unique_email UNIQUE (email)
	);

	CREATE TABLE IF NOT EXISTS Admin (
	    admin_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);

	CREATE TABLE IF NOT EXISTS Seller (
	    seller_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    name VARCHAR(50) NOT NULL,
	    description VARCHAR(255),
	    category VARCHAR(50),
	    street_address VARCHAR(255),
	    state VARCHAR(10),
	    city VARCHAR(255),
	    zip_code VARCHAR(50),
	    FOREIGN KEY (user_id) REFERENCES User(user_id),
		FULLTEXT(name, description)
	);

	CREATE TABLE IF NOT EXISTS Helpdesk (
	    helpdesk_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);

	CREATE TABLE IF NOT EXISTS Patron (
	    patron_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);

	CREATE TABLE IF NOT EXISTS Flag (
	    flag_id INT AUTO_INCREMENT PRIMARY KEY,
	    comment TEXT,
	    user_id INT,
	    status VARCHAR(50),
	    acknowledged BOOLEAN,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);

	CREATE TABLE IF NOT EXISTS Ticket (
	    Ticket_id INT AUTO_INCREMENT PRIMARY KEY,
	    User_id INT,
	    Role INT,
	    Ticket_Category VARCHAR(50),
	    Time TIME,
	    STATUS VARCHAR(10),
	    Flag_status BOOLEAN,
	    Description TEXT,
	    FOREIGN KEY (User_id) REFERENCES User(user_id)
	);

	CREATE TABLE IF NOT EXISTS Orders (
	    order_id INT AUTO_INCREMENT PRIMARY KEY,
	    customer INT,
	    seller INT,
	    items TEXT,
	    status VARCHAR(50),
	    total_price FLOAT,
	    FOREIGN KEY (customer) REFERENCES User(user_id),
	    FOREIGN KEY (seller) REFERENCES User(user_id)
	);

	CREATE TABLE IF NOT EXISTS Payment (
	    payment_id INT AUTO_INCREMENT PRIMARY KEY,
	    seller_account INT,
	    patron_account INT,
	    FOREIGN KEY (seller_account) REFERENCES Seller(seller_id),
	    FOREIGN KEY (patron_account) REFERENCES Patron(patron_id)
	);

	CREATE TABLE IF NOT EXISTS Menu_Item (
	    menu_item_id VARCHAR(50) PRIMARY KEY,
	    seller_id INT,
	    name VARCHAR(50),
	    description VARCHAR(255),
	    price FLOAT,
	    available BOOLEAN,
		tagArray VARCHAR(50),
	    FOREIGN KEY (seller_id) REFERENCES Seller(seller_id),
		FULLTEXT(name, description)
	);
	`
;

const categoryTables = 
	`
	DROP TABLE IF EXISTS Tags, EntityTags;

	CREATE TABLE IF NOT EXISTS Tags (
		tagID INTEGER PRIMARY KEY,
		name VARCHAR(255) UNIQUE NOT NULL
	);

	CREATE TABLE IF NOT EXISTS EntityTags (
		entityID INTEGER NOT NULL,
		entityType VARCHAR(50) NOT NULL,
		tagID INTEGER NOT NULL,
		FOREIGN KEY (tagID) REFERENCES Tags(tagID),
		PRIMARY KEY (entityID, entityType, tagID),
		CHECK (entityType IN ('Seller', 'MenuItem'))
	);

	INSERT INTO Tags (tagID, name) VALUES 
		(1, 'Chinese'), 
		(2, 'Middle Eastern'), 
		(3, 'Japanese'), 
		(4, 'Indian'), 
		(5, 'Pakistani');

	INSERT INTO Tags (tagID, name) VALUES 
		(1001, 'Halal'),
		(1002, 'Kosher'),
		(1003, 'Vegetarian'),
		(1004, 'Vegan');

	INSERT INTO Tags (tagID, name) VALUES 
		(2001, 'Fast food'),
		(2002, 'Gourmet'),
		(2003, 'Casual dining'),
		(2004, 'Fine dining'),
		(2005, 'Quick service'),
		(2006, 'Cafe/bistro'),
		(2007, 'Buffet'),
		(2008, 'Food truck/Street food'),
		(2009, 'Family style'),
		(2010, 'Pub/tavern/bar'),
		(2011, 'Deli');
		
	INSERT INTO Tags (tagID, name) VALUES 
		(3001, 'Gluten-Free'),
		(3002, 'Organic'),
		(3003, 'Non-GMO'),
		(3004, 'Low-Carb'),
		(3005, 'Sugar-Free');
	
	INSERT INTO Tags (tagID, name) VALUES 
		(4001, 'Appetizers'),
		(4002, 'Entrees'),
		(4003, 'Desserts'),
		(4004, 'Beverages');
	
	INSERT INTO Tags (tagID, name) VALUES 
		(5001, 'Breakfast'),
		(5002, 'Brunch'),
		(5003, 'Lunch'),
		(5004, 'Dinner'),
		(5005, 'Snack');

	`
;

const testingData = 
	`
	INSERT INTO User (user_id, username, email, password, status, role) VALUES 
		(1, 'John Doe', 'johndoe@yahoo.com', 'secure_password', 'active', 1),
		(2, 'Omar Hamoudeh', 'omarHam@gmail.com', 'unsecure_password', 'active', 1),
		(3, 'Ivan Marsic', 'ivanMarsic@aol.com', 'verysecure_password', 'deactive', 1),
		(4, 'Jane Doe', 'janedoe@hotmail.com', 'password123', 'active', 1),
		(5, 'Chef Alex', 'alexCooks@gmail.com', 'mypassword', 'active', 1),
		(6, 'Foodie Sam', 'samTastes@rutgers.edu', 'testpassword', 'active', 1),
		(7, 'Gina Rivera', 'ginaR@foodmail.com', 'gina_secure123', 'active', 1),
		(8, 'Luca Martini', 'lucaM@italianfood.com', 'luca_pass456', 'active', 1),
		(9, 'Suki Tanaka', 'sukiT@sushimail.com', 'suki789_secure', 'active', 1),
		(10, 'Eli Thompson', 'eliT@bbqmaster.com', 'eli_password999', 'active', 1);


	INSERT INTO Seller (user_id, name, description, category, street_address, state, city, zip_code) VALUES 
		(1, 'Tasty Treats', 'A cozy bakery offering a variety of bread and pastries', '[2, 1004, 2005, 2009, 3001, 3002]', '1234 Cake Lane', 'NJ', 'Sweetstown', '12345'),
		(2, 'Omars Halal Arabic Food', 'Middle Eastern cuisines with a focus on Halal ingredients', '[2, 1001, 2002, 2004, 3002]', '4321 Cake Lanes', 'NJ', 'HalalTown', '07652'),
		(3, 'Rutgers Smoothies', 'Fresh smoothies with Kosher and Vegan options', '[3, 1002, 1004, 2011, 3002, 3005]', 'Rutgers University', 'NJ', 'KosherTown', '11234'),
		(4, 'Global Delights', 'Offering dishes from around the world with organic ingredients', '[1, 3, 3002]', '5678 Global Ave', 'TX', 'WorldCity', '67890'),
		(5, 'The Healthy Option', 'Health-centric meals, both vegetarian and vegan-friendly', '[1003, 1004, 2006, 3002, 3003]', '9012 Health St', 'NJ', 'FitTown', '54321'),
		(6, 'Morning Brew', 'Coffee and breakfast options, featuring organic coffee and snacks', '[5, 2006, 2005, 5001, 3002, 4004]', '3456 Sunrise Rd', 'NY', 'MorningVille', '12389'),
		(7, 'Gina’s Pizzeria', 'Traditional Italian pizza with a modern twist', '[4, 1003, 2003, 3002]', '1010 Pizza Ct', 'NJ', 'Pizzatown', '07601'),
		(8, 'Martini’s Gelato', 'Authentic Italian gelato made fresh daily', '[4, 3002, 3005, 4003]', '2020 Cream St', 'NY', 'Dessertville', '11215'),
		(9, 'Suki’s Sushi Bar', 'Exquisite sushi and Japanese dishes', '[3, 2004, 3002]', '3030 Sushi Blvd', 'CA', 'Fishcity', '90001'),
		(10, 'Eli’s BBQ Shack', 'Southern style barbecue with all the fixings', '[2, 2009, 5004]', '4040 BBQ Rd', 'TX', 'Meattown', '75001');
	
		

	INSERT INTO Menu_Item (menu_item_id, seller_id, name, description, price, available, tagArray) VALUES 
		(1, 1, 'Vegan Burger', 'A delicious plant-based burger with all the fixings', 9.99, TRUE, '[1004, 2005]'),
		(2, 1, 'Falafel Wrap', 'Crispy falafel with fresh veggies wrapped in a soft tortilla', 6.99, TRUE, '[2, 1001, 1004, 2005]'),
		(3, 1, 'Chocolate Chip Cookie', 'A classic treat with a chewy center', 2.99, TRUE, '[5, 3005, 4003]'),
		(4, 1, 'Cinnamon Roll', 'Warm and gooey, topped with cream cheese frosting', 3.99, TRUE, '[5, 4003]'),
		(5, 1, 'Pumpkin Spice Latte', 'Seasonal favorite with real pumpkin and spices', 4.99, TRUE, '[4004, 5001]'),
		(6, 1, 'Bagel with Cream Cheese', 'New York-style bagel, served with cream cheese', 3.49, TRUE, '[5001, 2006]'),
		(7, 3, 'Quinoa Salad', 'A refreshing quinoa salad with mixed greens, cherry tomatoes, and avocado, dressed with lemon vinaigrette', 29.99, TRUE, '[1003, 3002, 2003]'),
		(8, 4, 'Sushi Platter', 'Assorted nigiri and maki rolls, serves two', 24.99, TRUE, '[3, 4002]'),
		(9, 5, 'Kale Caesar Salad', 'Kale, parmesan, croutons, and caesar dressing', 12.99, TRUE, '[1003, 2003]'),
		(10, 6, 'Avocado Toast', 'Fresh avocado spread on artisan toast, with a poached egg on top', 8.99, TRUE, '[5001, 3002, 2006]'),
		(11, 4, 'Butter Chicken', 'Classic Indian dish with tender chicken in a creamy tomato sauce', 16.99, TRUE, '[4, 2004]'),
		(12, 5, 'Smoothie Bowl', 'Acai berry smoothie bowl topped with granola, banana, and mixed berries', 10.99, TRUE, '[1004, 3002, 3005, 5005]'),
		(13, 6, 'Croissant', 'Buttery and flaky croissant, freshly baked', 3.99, TRUE, '[4001, 2006]'),
		(14, 2, 'Shawarma Plate', 'Grilled chicken shawarma served with rice, salad, and tahini sauce', 13.99, TRUE, '[2, 1001, 2004]'),
		(15, 3, 'Berry Blast Smoothie', 'A blend of blueberries, strawberries, and raspberries', 5.99, TRUE, '[1004, 3002, 5005]'),
		(16, 3, 'Mango Lassi', 'Refreshing yogurt-based mango drink', 4.99, TRUE, '[3, 4004, 5005]'),
		(17, 3, 'Greek Salad', 'Classic salad with feta cheese, olives, and cucumber', 8.99, TRUE, '[1003, 2003]'),
		(18, 3, 'Avocado Bagel', 'Whole grain bagel with smashed avocado', 6.99, TRUE, '[1003, 3002, 2006]'),
		(19, 4, 'Thai Green Curry', 'Spicy and aromatic Thai curry with coconut milk', 13.99, TRUE, '[1, 1003, 2004]'),
		(20, 4, 'Italian Pasta', 'Pasta with a rich tomato basil sauce', 12.99, TRUE, '[4, 1003, 2004]'),
		(21, 4, 'French Onion Soup', 'Rich and comforting onion soup topped with a cheese crouton', 7.99, TRUE, '[2006, 3004, 2004]'),
		(22, 4, 'Argentinian Empanadas', 'Crispy pastry filled with seasoned beef', 9.99, TRUE, '[2, 2009]'),
		(23, 5, 'Acai Berry Smoothie', 'Nutrient-packed smoothie with acai berries', 6.99, TRUE, '[1004, 3002, 5005]'),
		(24, 5, 'Vegetable Stir Fry', 'Fresh veggies stir-fried with a light soy sauce', 11.99, TRUE, '[1003, 3001, 2003]'),
		(25, 5, 'Chia Seed Pudding', 'Chia seeds soaked in almond milk, topped with fresh fruit', 7.99, TRUE, '[1004, 3001, 5005]'),
		(26, 5, 'Quinoa Veggie Burger', 'A hearty veggie burger made with quinoa and black beans', 10.99, TRUE, '[1003, 3002, 2003]'),
		(27, 6, 'Espresso', 'Strong and rich coffee', 2.99, TRUE, '[4004, 5001]'),
		(28, 6, 'Pancakes with Maple Syrup', 'Fluffy pancakes served with butter and maple syrup', 7.99, TRUE, '[5001, 4001, 2006]'),
		(29, 6, 'Breakfast Burrito', 'A hearty burrito filled with eggs, cheese, and sausage', 8.99, TRUE, '[5001, 1001, 2005]'),
		(30, 6, 'Granola Yogurt Parfait', 'Layers of yogurt, granola, and fresh berries', 6.49, TRUE, '[5001, 3002, 3001, 5005]'),
		(31, 1, 'Vegan Chocolate Croissant', 'A rich and flaky croissant made entirely from vegan ingredients.', 4.50, TRUE, '[1004, 4001, 3002]'),
		(32, 1, 'Gluten-Free Sourdough Loaf', 'Freshly baked sourdough loaf, perfect for those with a gluten intolerance.', 6.00, TRUE, '[3001, 2005]'),
		(33, 1, 'Organic Vegan Bagel', 'An organic bagel available with a variety of vegan-friendly spreads.', 3.00, TRUE, '[1004, 3002, 4001]'),
		(34, 2, 'Halal Beef Shawarma', 'Authentic Middle Eastern shawarma, made with all halal beef.', 8.00, TRUE, '[2, 1001, 2004]'),
		(35, 2, 'Halal Lamb Kebab', 'Grilled lamb kebabs seasoned with traditional spices.', 10.00, TRUE, '[2, 1001, 2002]'),
		(36, 3, 'Vegan Berry Smoothie', 'A refreshing smoothie made with organic berries and vegan protein.', 5.50, TRUE, '[1002, 1004, 3002]'),
		(37, 3, 'Kosher Energy Juice', 'Energizing juice blend, certified kosher.', 4.50, TRUE, '[1002, 3002, 4004]'),
		(38, 4, 'Multicultural Tapas Platter', 'A platter featuring small bites from around the world, perfect for sharing.', 12.00, TRUE, '[1, 3, 3002]'),
		(39, 4, 'Organic Mushroom Risotto', 'Creamy risotto made with organic mushrooms and fresh herbs.', 11.00, TRUE, '[3002, 2004]'),
		(40, 5, 'Non-GMO Veggie Pizza', 'A delicious pizza topped with non-GMO vegetables on a gluten-free crust.', 9.99, TRUE, '[1003, 1004, 3003, 3001]'),
		(41, 5, 'Vegan Caesar Salad', 'Classic Caesar salad, made completely vegan.', 7.99, TRUE, '[1004, 3003]'),
		(42, 6, 'Organic Coffee', 'Rich and flavorful organic coffee, brewed to perfection.', 2.99, TRUE, '[5001, 4004, 3002]'),
		(43, 6, 'Breakfast Oatmeal', 'Warm oatmeal with organic fruits and nuts.', 4.99, TRUE, '[5001, 1004, 3002, 3001]'),
		(44, 6, 'Vegan Breakfast Sandwich', 'A hearty breakfast sandwich made with vegan sausage and organic vegetables.', 5.99, TRUE, '[5001, 1004, 3002]'),
		(45, 7, 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomatoes, and basil.', 12.00, TRUE, '[4, 1003, 3002]'),
		(46, 7, 'Pepperoni Pizza', 'Spicy pepperoni with a rich tomato sauce and mozzarella cheese.', 13.50, TRUE, '[4]'),
		(47, 7, 'Vegan Pesto Pizza', 'Dairy-free pesto sauce with sun-dried tomatoes and arugula.', 14.00, TRUE, '[4, 1004, 3002]'),
		(48, 7, 'Four Cheese Pizza', 'A blend of four cheeses on a classic pizza crust.', 13.00, TRUE, '[4, 1003]'),
		(49, 7, 'Calzone', 'Folded pizza with ham, ricotta, and mozzarella.', 10.00, TRUE, '[4]'),
		(50, 7, 'Garlic Knots', 'Knots of pizza dough baked with garlic and olive oil.', 5.00, TRUE, '[4, 3002]'),
		(51, 7, 'Caprese Salad', 'Fresh mozzarella, tomatoes, and basil drizzled with balsamic.', 9.00, TRUE, '[4, 1003, 3002]'),
		(52, 7, 'Tiramisu', 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone.', 7.50, TRUE, '[4, 4003]'),
	
		-- Continuation of Menu Items for Martini’s Gelato
		(53, 8, 'Chocolate Gelato', 'Rich and creamy chocolate gelato made with organic cocoa.', 6.50, TRUE, '[4, 3002, 3005, 4003]'),
		(54, 8, 'Vanilla Bean Gelato', 'Smooth gelato made with real vanilla beans.', 6.00, TRUE, '[4, 3002, 3005, 4003]'),
		(55, 8, 'Strawberry Gelato', 'Fresh strawberry gelato made with organic strawberries.', 6.50, TRUE, '[4, 3002, 3005, 4003]'),
		(56, 8, 'Pistachio Gelato', 'Gelato made with roasted pistachios and a hint of almond.', 7.00, TRUE, '[4, 3002, 4003]'),
		(57, 8, 'Lemon Sorbet', 'Refreshing and tangy lemon sorbet, sugar-free and delightful.', 5.00, TRUE, '[4, 3005, 4003]'),
		(58, 8, 'Mango Sorbet', 'Exotic mango sorbet made from fresh mangos.', 5.50, TRUE, '[4, 3002, 4003]'),
		(59, 8, 'Affogato', 'Espresso poured over vanilla gelato.', 6.00, TRUE, '[4, 4004]'),
		(60, 8, 'Biscotti', 'Crunchy almond biscotti, perfect with any gelato.', 3.00, TRUE, '[4, 3002]'),
	
		-- Continuation of Menu Items for Suki’s Sushi Bar
		(61, 9, 'California Roll', 'Crab, avocado, and cucumber sushi roll.', 8.00, TRUE, '[3, 2004]'),
		(62, 9, 'Tuna Sashimi', 'Fresh slices of tuna served with wasabi and soy sauce.', 12.00, TRUE, '[3, 3002]'),
		(63, 9, 'Salmon Nigiri', 'Sushi rice topped with a slice of fresh salmon.', 10.00, TRUE, '[3, 3002]'),
		(64, 9, 'Dragon Roll', 'Eel, cucumber, and avocado roll topped with spicy mayo.', 13.00, TRUE, '[3]'),
		(65, 9, 'Miso Soup', 'Traditional Japanese soup with seaweed, tofu, and green onion.', 4.50, TRUE, '[3, 3002]'),
		(66, 9, 'Edamame', 'Steamed young soybeans lightly salted.', 4.00, TRUE, '[3, 3002]'),
		(67, 9, 'Tempura Shrimp', 'Crispy battered shrimp served with dipping sauce.', 9.00, TRUE, '[3]'),
		(68, 9, 'Green Tea Ice Cream', 'Creamy green tea flavored ice cream.', 5.00, TRUE, '[3, 4003]'),
	
		-- Continuation of Menu Items for Eli’s BBQ Shack
		(69, 10, 'Pulled Pork Sandwich', 'Slow-cooked pork, shredded and served on a bun with coleslaw.', 11.00, TRUE, '[2, 2009, 5004]'),
		(70, 10, 'Brisket', 'Smoked beef brisket served with BBQ sauce and pickles.', 15.00, TRUE, '[2, 5004]'),
		(71, 10, 'Smoked Chicken', 'Whole chicken smoked to perfection with a spice rub.', 14.00, TRUE, '[2, 5004]'),
		(72, 10, 'Baby Back Ribs', 'Tender ribs with a sweet and tangy BBQ glaze.', 16.00, TRUE, '[2, 5004]'),
		(73, 10, 'Mac and Cheese', 'Creamy macaroni and cheese topped with breadcrumbs.', 7.00, TRUE, '[2]'),
		(74, 10, 'Cornbread', 'Sweet and buttery cornbread.', 3.00, TRUE, '[2]'),
		(75, 10, 'Baked Beans', 'Beans slow-cooked with bacon and molasses.', 5.00, TRUE, '[2]'),
		(76, 10, 'Coleslaw', 'Crisp coleslaw with a creamy dressing.', 3.50, TRUE, '[2]');
		
	`
;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////   INITILIZES TABLES IN DATASET   /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
db.query(initScript, function(error){
	if(error){throw error}
});

db.query(categoryTables, function(error){
	if(error){throw error}
});

db.query(testingData, function(error){
	if(error){throw error}
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////   ASSIGNS TAGS FOR SELLERS AND MENU ITEMS  ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
db.query('SELECT * FROM Seller', function(error, results){
	if(error){throw error}
	else{
		assignSellerTags(results);
	}
});

db.query('SELECT * FROM Menu_Item', function(error, results){
	if(error){throw error}
	else{
		assignMenuTags(results);
	}
});

// Input array of JSON objects (Menu_Items Table)
function assignMenuTags(array){
	for(let i = 0; i < array.length; i++){
		
		let tagArray = JSON.parse(array[i].tagArray);
		
		for(let j = 0; j < tagArray.length; j++){
			let insertQuery = `INSERT INTO EntityTags (entityID, entityType, tagID) VALUES (?, 'MenuItem', ?);`
			
			db.query(insertQuery, [array[i].menu_item_id, tagArray[j]], (err) => {
				if (err) {console.log('Error', err);}
			});
		}
	}
}

// Input array of JSON objects (Sellers Table)
function assignSellerTags(array){
	for(let i = 0; i < array.length; i++){
		
		let tagArray = JSON.parse(array[i].category);
		
		for(let j = 0; j < tagArray.length; j++){
			let insertQuery = `INSERT INTO EntityTags (entityID, entityType, tagID) VALUES (?, 'Seller', ?);`
			
			db.query(insertQuery, [array[i].seller_id, tagArray[j]], (err) => {
				if (err) {console.log('Error', err);}
			});
		}
	}
}


module.exports = db;
