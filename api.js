var request = require('request');

const API_INFO = {
  baseUrl: 'http://api.zappos.com',
  key: null
}

// Store all valid price values so they can then be used to filter by price
// See: getZapposPriceFacetValues, findPricesInRange
const PRICES = [];

// max number of prices that can be specified in prices filter
const MAX_PRICE_RANGE_LENGTH = 50;

function setApiKey(apiKey) {
  API_INFO.key = apiKey;
}

module.exports.setApiKey = setApiKey;

function buildApiUrl(endpoint, queryObject) {
  if (API_INFO.baseUrl == null || API_INFO.key == null)
    throw new Error('API info not set');

  queryObject.key = API_INFO.key;

  var url = API_INFO.baseUrl;
  url += endpoint;
  url += '?'
  url += buildQueryString(queryObject);
  return url;
}

function buildQueryString(object) {
  var query = "";
  Object.keys(object).forEach(function(_key) {
    var value = object[_key]
    query += '&'
    query += _key
    query += '='
    query += typeof value === 'string' || typeof value === 'number'
              ? value
              : JSON.stringify(value)
  });

  return query.substr(1); // strip initial &
}

function callApi(endpoint, queryObject, callback) {
  var url = buildApiUrl(endpoint, queryObject);
  var opts = {
    url: url,
    json: true
  };

  console.log("\033[34mAPI:\033[0m " + url);
  request.get(opts, function(err, res, body) {
    if (err) return callback(err);
    callback(null, body);
  });
}

function getZapposPriceFacetValues(callback) {
  var query = {
    facets: ['price'],
    excludes: ['results']
  };
  callApi('/Search', query, function(err, res) {
    res.facets[0].values.forEach(function(value) {
      PRICES.push(value.name);
    });

    // sort low-to-high
    PRICES.sort(floatComp);

    callback();
  });
}

module.exports.cacheZapposPrices = getZapposPriceFacetValues;

function floatComp(a, b) {
  return parseFloat(a) - parseFloat(b);
}

function findPricesInRange(start, end) {
  end = end == null ? parseFloat(PRICES[PRICES.length - 1]) : end;

  return PRICES.filter(function(price) {
    var priceFloat = parseFloat(price);
    return priceFloat >= start && priceFloat <= end;
  });
}

// evenly remove items from an array. returns a new array of size newSize
function shrinkArray(array, newSize) {
  if (array.length <= newSize) return array;

  var factor = array.length / newSize;
  var ret = [];

  for (var i = 1; i <= newSize; i++) {
    var index = Math.round(i * factor) - 1;
    if (ret.length == 0 
      || ret[ret.length - 1] != array[index]) {
      ret.push(array[index]);
    }
  }

  return ret;
}

// Public

function findProducts(priceRange, limit, callback) {
  var priceRange = findPricesInRange(priceRange[0], priceRange[1]).sort(floatComp);
  if (priceRange.length == 0) {
    var error = new Error('No products in that price range');
    return callback(error, null);
  }

  priceRange = shrinkArray(priceRange, MAX_PRICE_RANGE_LENGTH);

  var query = {
    limit: 100,
    // // add a touch of randomization
    // page: Math.floor(Math.random() * 10),
    includes: ['categoryFacet'],
    filters: {
      price: priceRange
    }
  };

  callApi('/Search', query, function(err, res) {
    if (err) return callback(err);

    var products = res.results;
    // cleanup results
    products.forEach(function(product) {
      // convert price to number
      product.price = product.price.replace(',', '');
      product.price = parseFloat(product.price.match(/\$([\d\.]*)/)[1]);

      // convet percent off to number
      product.percentOff = parseFloat(product.percentOff.match(/(\d*)\%/)[1]);

      // simplify attributes
      product.category = product.categoryFacet;
      delete products.categoryFacet;
    });
    callback(null, products);
  });
}


module.exports.findProducts = findProducts;

