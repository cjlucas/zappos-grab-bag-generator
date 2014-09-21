This is a web app written using Node.js.

A few notes:
  - Calls to the Zappos API are logged to stdout.
  - A single API call occurs when the server is started in order
    to fetch the prices data set. Each grab bag generation performs
    n API calls, where n is the number of items selected
  - A price deviation mechanism is used when selecting products
    for the grab bag. The deviation approaches 1% as each product
    is selected. This allows a more diverse selection of products
    while still achieving a final total very close to the target price.
  - The final totals are on average +/- 1% of the requested target price.

Install:

`npm install`

Run:

`API_KEY=zappos_api_key node app.js [port]`

This app is also running on Heroku [here.](http://zappos-grab-bag-creator.herokuapp.com/)