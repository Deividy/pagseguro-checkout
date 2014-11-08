var pagseguro = require('../pagseguro-checkout');
var p;

describe('Pagseguro checkout', function () {
    it("initialize", function () {
        p = pagseguro("deividyz@gmail.com", "bogustoken");

        assertKeys = {
            email: "deividyz@gmail.com",
            token: "bogustoken",
            items: [ ],
            maxUses: 1,
            maxAge: 1800,
            currency: 'BRL',
            extraAmount: undefined,
            redirectURL: undefined,
            notificationURL: undefined,
            checkout: { }
        };

        for (var key in assertKeys) {
            if (p[key] == null) {
                (p[key] == assertKeys[key]).should.be.eql(true)
            } else {
                p[key].should.be.eql(assertKeys[key]);
            }
        }
    });

    it("initialize with custom config", function () {
        cfg = { 
            maxUses: 1,
            maxAge: 2500,
            currency: 'BRL'
        };

        p = pagseguro("contato@solnaweb.com.br", "bogustoken", cfg);

        for (var key in cfg) {
            p[key].should.be.eql(cfg[key]);
        }
    });

    it("try to request code without items", function (done) {
        p.request(function(err) {
            err.should.match(/Items must have at least one item/);
            done()
        });
    });

    it("add item", function () {
        var item = {
            id: 1,
            description: "Test",
            quantity: 1,
            weight: 100,
            amount: 10
        };

        p.add(item);

        p.items[0].should.be.eql(item);
    });


    it("simple xml", function () {
        var xml = [
            '<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>',
            '<checkout>',
                '<maxUses>1</maxUses>',
                '<maxAge>2500</maxAge>',
                '<currency>BRL</currency>',
                '<items>',
                    '<item>',
                        '<id>1</id>',
                        '<description>Test</description>',
                        '<quantity>1</quantity>',
                        '<weight>100</weight>',
                        '<amount>10.00</amount>',
                    '</item>',
                '</items>',
            '</checkout>'
        ].join('');
        p.xml().should.be.eql(xml);
    });

    it('build full xml', function () {
        p = pagseguro("deividyz@gmail.com", "bogustoken");

        p.sender({
            name: "Jose Comprador",
            email: "comprador@uol.com.br",
            phone: {
                areaCode: 11,
                number: 56273440
            }
        });

        p.shipping({
            type: 1,
            address: {
                street: "Av. Brig. Faria Lima",
                number: 1384,
                complement: "5o andar",
                district: "Jardim Paulistano",
                postalCode: 13467460,
                city: "Sao Paulo",
                state: "SP",
                country: "BRA"
            }
        });

        for (var i = 1; i < 5; i++) {
            p.add({
                id: i,
                description: "Test " + i,
                quantity: i * 2,
                weight: i * 10,
                amount: (i * 50 / 10)
            });
        }   

        expected = [
            '<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>',
            '<checkout>',
                '<maxUses>1</maxUses>',
                '<maxAge>1800</maxAge>',
                '<currency>BRL</currency>',
                '<sender>',
                    '<name>Jose Comprador</name>',
                    '<email>comprador@uol.com.br</email>',
                    '<phone>',
                        '<areaCode>11</areaCode>',
                        '<number>56273440</number>',
                    '</phone>',
                '</sender>',
                '<shipping>',
                    '<type>1</type>',
                    '<address>',
                        '<street>Av. Brig. Faria Lima</street>',
                        '<number>1384</number>',
                        '<complement>5o andar</complement>',
                        '<district>Jardim Paulistano</district>',
                        '<postalCode>13467460</postalCode>',
                        '<city>Sao Paulo</city>',
                        '<state>SP</state>',
                        '<country>BRA</country>',
                    '</address>',
                '</shipping>',
                '<items>',
                    '<item>',
                        '<id>1</id>',
                        '<description>Test 1</description>',
                        '<quantity>2</quantity>',
                        '<weight>10</weight>',
                        '<amount>5.00</amount>',
                    '</item>',
                    '<item>',
                        '<id>2</id>',
                        '<description>Test 2</description>',
                        '<quantity>4</quantity>',
                        '<weight>20</weight>',
                        '<amount>10.00</amount>',
                    '</item>',
                    '<item>',
                        '<id>3</id>',
                        '<description>Test 3</description>',
                        '<quantity>6</quantity>',
                        '<weight>30</weight>',
                        '<amount>15.00</amount>',
                    '</item>',
                    '<item>',
                        '<id>4</id>',
                        '<description>Test 4</description>',
                        '<quantity>8</quantity>',
                        '<weight>40</weight>',
                        '<amount>20.00</amount>',
                    '</item>',
                '</items>',
            '</checkout>'
        ].join('')

        p.xml().should.be.eql(expected);
    });

    it('request receives Unauthorized', function (done) {
        p.request(function(err, res) {
            err.should.be.eql("Unauthorized");
            done();
        });
    });
});
