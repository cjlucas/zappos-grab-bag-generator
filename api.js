var request = require('request');

const API_INFO = {
  baseUrl: 'http://api.zappos.com',
  key: null
}

// Store all valid price values so they can then be used to filter by price
// See: getZapposPriceFacetValues, findPricesInRange
const PRICES = [];

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

  console.log("calling " + url);
  request.get(opts, function(err, res, body) {
    if (err) return console.log(err);
    callback(body);
  });
}

function getZapposPriceFacetValues(callback) {
  var query = {
    facets: ['price'],
    excludes: ['results']
  };
  callApi('/Search', query, function(res) {
    res.facets[0].values.forEach(function(value) {
      PRICES.push(value.name);
    });

    // sort low-to-high
    PRICES.sort(function(a, b) {
      return parseFloat(a) > parseFloat(b);
    });

    callback();
  });
}

module.exports.cacheZapposPrices = getZapposPriceFacetValues;

function findPricesInRange(start, end) {
  end = end == null ? parseFloat(PRICES[PRICES.length - 1]) : end;

  return PRICES.filter(function(price) {
    var priceFloat = parseFloat(price);
    return priceFloat >= start && priceFloat <= end;
  });
}

// Public

function findProducts(gender, categories, priceRange, limit, callback) {
  var query = {
    limit: 100,
    // // add a touch of randomization
    // page: Math.floor(Math.random() * 10),
    includes: ['categoryFacet'],
    filters: {
      gender: gender,
      category: categories,
      price: findPricesInRange(priceRange[0], priceRange[1]).sort()
    }
  };

  callApi('/Search', query, function(res) {
    var products = res.results;
    // cleanup results
    products.forEach(function(product) {
      // convert price to number
      product.price = parseFloat(product.price.match(/\$([\d\.]*)/)[1]);

      // convet percent off to number
      product.percentOff = parseFloat(product.percentOff.match(/(\d*)\%/)[1]);

      // simplify attributes
      product.category = product.categoryFacet;
      delete products.categoryFacet;
    });
    callback(products);
  });
}


module.exports.findProducts = findProducts;

