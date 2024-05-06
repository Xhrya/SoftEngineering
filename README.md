## FILES OVERVIEW
app.js is the main folder.
db.js creates a local database with fabricated data for testing purposes.
./resources is where the html and css files are stored

## HOW TO RUN
run node app
open localhost:3000 on your web browser


## REQUEST ENDPOINTS
Get Restaurants List

    GET /restaurants

Get Menu List

    GET /restaurants/{seller_id}/menu

Search Restaurants

    GET /restaurants?search={keyword}

Search Restaurants By State

    GET /restaurants?state={state}

Search Menu

    GET /restaurants/{seller_id}/menu?search={keyword}

Sort Restaurants By Category

    GET /restaurants?sort=category&category={category}

Sort Menu By Category

    GET /restaurants/{seller_id}/menu?sort=category&category={category}

Sort Restaurants By Price

    GET /restaurants?sort=price&order={ASC|DESC}

Sort Menu By Price

    GET /restaurants/{seller_id}/menu?sort=price&order={ASC|DESC}
