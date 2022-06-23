# Table of Contents

1. [General Info](#general-info)
2. [Technologies](#technologies)
3. [Installation](#installation)
4. [Collaboration](#collaboration)
5. [FAQs](#faqs)

# General Info

Name: **g3tools-product-api** (v0 initial version)

This is a Node/Express API application that fronts several Amazon API's (SP-API not MWS). Created in June 2022, this brings together into one custom API access to all product-related information with calls to the following Amazon SP-API's:

- CatalogItems
- Listings Restrictions
- Product Fees
- Product Pricing

To launch the application, issue the command `npm run serve` in a VSCode git Terminal.

## Technologies

A list of main technologies used within the project:

- [node](https://node.js): Version 14.17.3
- [npm](https://www.npmjs.com): Version 6.14.13
- [express](https://expressjs.com): Version 4.18.1
- [javascript](https://v8.dev/docs): Version 8 (ECMAScript)
- [MySQL](https://mysql.com): Version 5.7.25
- [RESTClient](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) for making API calls within VSCode without using POSTMan.

See [package.json](./package.json) for the complete list of dependencies used.

## Installation

The development machine must have the node and npm installed. It must also have the SSH key installed at ?? Issue the following to install the code:

```
$ git clone git@github.com:dgarvin57/g3tools-product-api.git
$ cd ../path/to/the/file
$ npm install
$ npm start
```

The production version will be running on Heroku.
