var async = require('async')
var express = require('express');

var api = require('./api');
console.log(process.env);
api.setApiKey(process.env.API_KEY)

PORT = 4592;

PRIMARY_CATEGORIES = ['top', 'bottom', 'shoe'];
SECONDARY_CATEGORIES = ['underwear', 'sock', 'hat', 'belt'];

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
	var minNumItems = 3;
	var maxNumItems = PRIMARY_CATEGORIES.length + SECONDARY_CATEGORIES.length;
	var targetPrices = [];

	// allow user to specifiy target prices between $100-1$000 in $50 increments 
	for (var i = 100; i <= 1000; i += 50) {
		targetPrices.push(i);
	}

	var locals = {
		minNumItems: minNumItems,
		maxNumItems: maxNumItems,
		prices: targetPrices
	};
	res.render('index', locals);
});

app.post('/build', function(req, res) {
	var gender = req.param('gender');
	var numItems = req.param('numItems');
	var targetPrice = req.param('targetPrice');

	var avgPrice = targetPrice / numItems;

	var tasks = [];
	var primaryCategories = PRIMARY_CATEGORIES.slice();
	var secondaryCategories = SECONDARY_CATEGORIES.slice();
	for (var i = 0; i < numItems; i++) {
		var categories = primaryCategories.length > 0
			? primaryCategories
			: secondaryCategories;

		var category = randomCategory(categories);
		categories.splice(categories.indexOf(category), 1);

		var task = findProductTask(gender, category, targetPrice, avgPrice, .05);
		tasks.push(task);
	}

	async.waterfall(tasks, function(err, products) {
		var totalCost = 0;
		products.forEach(function(product) { totalCost += product.price });
		res.render('build', {products: products, total: totalCost});
	});

});

// initialization

console.log('Caching Zappos prices. Hang on...')
api.cacheZapposPrices(function() {
	app.listen(PORT);
	console.log('Done caching. Listening on 0.0.0.0:' + PORT);
});


// helpers

function randomCategory(categories) {
	var i = Math.floor(Math.random() * categories.length)
	return categories[i];
}

function findProductTask(gender, category, totalAvailable, targetPrice, deviation) {
	return function(arg1, arg2) {
		console.log(targetPrice + '!!!!!!!!!!!!!!!!');
		var wardrobe;
		var callback;
		if (typeof arg1 === 'function') {
			callback = arg1;
			wardrobe = [];
		} else {
			wardrobe = arg1;
			callback = arg2;
		}

		console.log(callback);
		console.log(wardrobe);

		// var amountLeft = totalAvailable;
		// products.forEach(function(product) { amountleft -= product.price });

		var priceDeviation = targetPrice * deviation;
		var targetPriceRange = [
			targetPrice - priceDeviation,
			targetPrice + priceDeviation
			];

		api.findProducts(gender, category, targetPriceRange, 100 /* limit */, function(products) {
			if (products.length == 0) throw new Error('no products found');
			// select a random product
			var product = products[Math.floor(Math.random() * products.length)];
			wardrobe.push(product);
			callback(null, wardrobe);
		});
	}
};