var async = require('async')
var express = require('express');

var api = require('./api');
api.setApiKey(process.env.API_KEY)

PORT = 4592;

var app = express();

// views

app.set('views', './views');
app.set('view engine', 'jade');

// middleware

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// routes

app.get('/', function(req, res) {
	var targetPrices = [];

	// allow user to specifiy target prices between $100-1$000 in $50 increments 
	for (var i = 100; i <= 1000; i += 50) {
		targetPrices.push(i);
	}

	var locals = {
		minNumItems: 1,
		maxNumItems: 20,
		prices: targetPrices
	};
	res.render('index', locals);
});

app.post('/build', function(req, res) {
	var gender = req.param('gender');
	var numItems = req.param('numItems');
	var totalAmount = req.param('targetPrice');

	var tasks = [];
	// Allow prices to deviate a certain percentage from the average price.
	const INITIAL_DEVIATION = .90; // 60%
	const FINAL_DEVIATION   = .01; // 1%
	var deviation = INITIAL_DEVIATION;

	// Create an api call task for each item
	for (var i = 0; i < numItems; i++) {
		deviation -= (INITIAL_DEVIATION - FINAL_DEVIATION) / numItems;
		var task = findProductTask(totalAmount, numItems, deviation);
		tasks.push(task);
	}

	async.waterfall(tasks, function(err, products) {
		var totalCost = 0;
		products.forEach(function(product) { totalCost += product.price });
		res.render('grab_bag', {products: products, total: totalCost});
	});

});

// initialization

console.log('Caching Zappos prices. Hang on...')
api.cacheZapposPrices(function() {
	app.listen(PORT);
	console.log('Done caching. Listening on 0.0.0.0:' + PORT);
});


// helpers

function findProductTask(totalAmountAvailable, totalItems, deviation) {
	return function(arg1, arg2) {
		var chosenProducts;
		var callback;
		if (typeof arg1 === 'function') {
			callback = arg1;
			chosenProducts = [];
		} else {
			chosenProducts = arg1;
			callback = arg2;
		}

		var amountRemaining = totalAmountAvailable;
		chosenProducts.forEach(function(product) { amountRemaining -= product.price } )

		var itemsRemaining = totalItems - chosenProducts.length;


		var avg = amountRemaining / itemsRemaining;
		var avgDeviation = avg * deviation;
		targetPriceRange = [avg - avgDeviation, avg + avgDeviation];
		console.log(targetPriceRange);

		api.findProducts(targetPriceRange, 100 /* limit */, function(err, products) {
			if (err) return callback(err, chosenProducts);
			if (products.length == 0) {
				var err = new Error('no products found');
				return callback(err, chosenProducts)
			}

			// select a random product
			var product = products[Math.floor(Math.random() * products.length)];
			chosenProducts.push(product);
			callback(null, chosenProducts);
		});
	}
};