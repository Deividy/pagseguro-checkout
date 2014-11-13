var querystring = require('querystring');
var https = require('https');
var V = require('argument-validator');

module.exports = function (email, token, options) {
    options = options || { };
    options.email = email;
    options.token = token;

    return new PagseguroCheckout(options);
};

var paymentUrl = "https://pagseguro.uol.com.br/v2/checkout/payment.html";

var defaultOptions = {
    maxUses: 1,
    maxAge: 1800,
    currency: 'BRL',
    extraAmount:  null,
    redirectUrl: null,
    notificationUrl: null,
    reference: null,
    sender: null,
    shipping: null,
    receiver: null
};

function PagseguroCheckout (opts) {
    V.keysWithString(opts, [ 'email', 'token' ], 'options');

    this.checkout = {};

    this.email = opts.email;
    this.token = opts.token;
    this.items = opts.items || [ ];

    // here we build the acessors, for every option we have a cool chaining
    // method that can be used to retrieve the value or set it.
    // e.g:
    // var maxUses = this.maxUses();
    // this.maxUses(5).maxAge(100);
    for (var key in defaultOptions) {
        (function(key) {
            this[key] = function(v) {
                return this._getOrSetCheckoutProperty(key, v);
            }
            this.checkout[key] = opts[key] || defaultOptions[key];
        }).call(this, key);
    }
};

PagseguroCheckout.prototype = {
    constructor: PagseguroCheckout.constructor,

    add: function (item) {
        V.keys(item, [ 'id', 'amount' ], 'item');
        V.keysWithString(item, [ 'description' ], 'item');
        V.keysWithNumber(item, [ 'quantity', 'weight' ], 'item');

        // ensure always two decimal points for amount
        item.amount = Number(item.amount).toFixed(2);

        this.items.push(item);
        return this;
    },

    xml: function () {
        var xml = [ '<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>' ];
        var checkout = [];

        for (var key in this.checkout) {
            var value = this.checkout[key];

            if (value == null) continue;
            if (V.isObject(value)) value = objectToXml(value);

            checkout.push(keyValueToXml(key, value));
        }

        var items = [ ];
        for (var i = 0; i < this.items.length; i++) {
            items.push(keyValueToXml('item', objectToXml(this.items[i])));
        }

        checkout.push(keyValueToXml("items", items.join("")));
        xml.push(keyValueToXml("checkout", checkout.join("")));

        return xml.join("");
    },

    // if found any errors it will return
    // callback(errorMessages|rawResponse, responseObject)
    // otherwise: callback(null, { code, url })
    request: function (callback) {
        V.instanceOf(Function, callback, 'callback');
        if (this.items.length == 0) {
            return callback("Items must have at least one item.");
        }

        var qs = querystring.stringify({ email: this.email, token: this.token });
        var body = this.xml();
        var options = {
            host: "ws.pagseguro.uol.com.br",
            path: "/v2/checkout?" + qs,
            port: 443,
            method: "POST",
            headers: {
                'Cookie': "cookie",
                'Content-Type': 'application/xml; charset=UTF-8',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        var req = https.request(options, function (res) {
            var xml = '';
            res.on('data', function (chunk) { xml += chunk; });
            res.on("end", function() { onRequestDone(xml, res, callback); });
        });

        req.on('error', callback).write(body);
        req.end();
    },

    _getOrSetCheckoutProperty: function (attr, value) {
        V.string(attr, 'attr');

        if (value !== undefined) {
            this.checkout[attr] = value;
            return this;
        }

        return this.checkout[attr];
    }
};

var keyValueToXml = function (key, value) {
    V.string(key, 'key');
    return "<" + key + ">" + value + "</" + key + ">";
};

var objectToXml = function (obj) {
    V.object(obj, 'obj');

    var xml = [ ];
    for (var key in obj) {
        var value = obj[key];
        if (V.isObject(value)) value = objectToXml(value);

        xml.push(keyValueToXml(key, value));
    }

    return xml.join("");
};                     

// I'm aware of what can happen if we try to parse the XML/HTML with regex
// (you should be aware too :)) http://stackoverflow.com/a/1732454/1617888
// BUT, we just need to get some simple data from the response XML
// we just need to get the checkout code OR the error messages, so these
// regex can help us to do a good job here.
var regex = {
    checkoutCode: /<checkout><code>([\w\W]+)<\/code>/,
    errors: /<errors>([\w\W]+)<\/errors>/,
    codes: /<code>([\d]+)<\/code>/g,
    messages: /<message>([\s\S]*?)<\/message>/g
};

var onRequestDone = function (xml, res, callback) {
    V.string(xml, 'xml');
    V.object(res, 'response object');
    V.instanceOf(Function, callback, 'callback');

    var code = xml.match(regex.checkoutCode);
    if (code && code[1]) {
        var url = paymentUrl + "?" + querystring.stringify({ code: code[1] });
        return callback(null, { code: code[1], url: url });
    }

    var errors = xml.match(regex.errors);

    // not found any <errors>*</errors> and not found checkout code, 
    // in that case we return the original xml and the response object
    if (!errors) return callback(xml, res);

    errors = errors[1];

    // We need this for regex with global flag
    // and we need /g to get all error messages/codes
    // http://stackoverflow.com/a/1520853/1617888
    regex.codes.lastIndex = 0;
    regex.messages.lastIndex = 0;

    var codes = errors.match(regex.codes);
    var messages = errors.match(regex.messages);

    // unable to find an error message/code OR 
    // we found more/less code than messages
    // In this (odd)case we return to the caller
    // the full xml and response object
    // although, thats a very weird case, and so far I have not saw that
    if (codes.length == 0 || codes.length !== messages.length) {
        return callback(xml, res);
    }

    errors = [];
    for (var i = 0; i < codes.length; i++) {
        errors.push({
            code: codes[i].replace(/<\/?code>/g, ''),
            message: messages[i].replace(/<\/?message>/g, '')
        });
    }

    callback(errors, res);
};
