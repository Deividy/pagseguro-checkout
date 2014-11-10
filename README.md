Pagseguro Checkout [![Build Status](https://travis-ci.org/Deividy/pagseguro-checkout.png?branch=master)](https://travis-ci.org/Deividy/pagseguro-checkout)
===============

Simples e pequeno modulo para consumo da API de checkout do Pagseguro.
https://pagseguro.uol.com.br/v2/guia-de-integracao/api-de-pagamentos.html

---

# Get it

```
npm install pagseguro-checkout
```

## Starting

```javascript
var pagseguro = require('pagseguro-checkout');

var p = pagseguro("my@email.me", "mytoken");
```

## Adicionando um produto

```javascript
p.add({
    id: 1,
    description: "Test",
    weight: 50,
    amount: 15.25
});
```

## Setando um comprador

```javascript
p.sender({
    name: "Jose Comprador",
    email: "comprador@uol.com.br",
    phone: {
        areaCode: 11,
        number: 56273440
    }
});
```

## Setando os dados de envio

```javascript
p.shipping({
    type: 1,
    address: {
        street: "Av. Brig. Faria Lima",
        number: 1384,
        complement: "5o andar",
        district: "Jardim Paulistano",
        postalCode: 01452002,
        city: "Sao Paulo",
        state: "SP",
        country: "BRA"
    }
})
```

## Setando custom params

```javascript
p.reference('MyId')
    .redirectUrl('http://mywebpagepagseguro.me')
    .extraAmount('10.00')
    .notificationUrl('http://mywebpagepagseguro.me');
```

## Pegando a URL de checkout

```javascript
p.request(function (err, res) {
    if (err) throw new Error(err);

    console.log(res);
    console.log(res.code);
    console.log(res.url);
});
```

## Dependency
- [argument-validator](https://github.com/Deividy/argument-validator)
