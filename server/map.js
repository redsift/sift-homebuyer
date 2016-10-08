/**
 * Parses incoming property alerts
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var moment = require('moment');

// Entry point for DAG node
module.exports = function(got) {
  const inData = got['in'];
  const AREA_REGEXP = /(\d*)\s*\w*\s*\w*\sfor sale in[:]?\s*(.*)/i;
  const PRICES_REGEXP = {
    ZOOPLA: /£(\d*,*\d*,*\d*)\s*[\d]*[\s\w-]*\sfor sale/gi,
    RIGHTMOVE: /Property \d*:[\s|\D]*&pound;(\d*,*\d*,*\d*)/g
  };
  const REDUCED_REGEXP = /(Reduced)/g;
  var ret = [];
  inData.data.map(function(datum){
    var jmapInfo = JSON.parse(datum.value);
    if(!jmapInfo.strippedHtmlBody && !jmapInfo.textBody) {
      console.error('sift-homebuyer: map.js: message has no body: ', datum.key);
      return;
    }
    var value = {};
    var re;
    var body;
    if(jmapInfo.from.email.indexOf('rightmove') !== -1) {
      value.service = 'rightmove';
      re = PRICES_REGEXP.RIGHTMOVE;
      body = jmapInfo.textBody || jmapInfo.strippedHtmlBody;
    }
    else if (jmapInfo.from.email.indexOf('zoopla') !== -1) {
      value.service = 'zoopla';
      re = PRICES_REGEXP.ZOOPLA;
      body = (jmapInfo.strippedHtmlBody || jmapInfo.textBody).replace(/[\r\n|\n|\r]/gm, '');
    }
    else {
      console.error('sift-homebuyer: map.js: unsupported service: ', jmapInfo.from.email);
      return;
    }
    var month = moment(jmapInfo.date).utc().startOf('month').valueOf();
    var key = month + '/' + datum.key;
    var ra = AREA_REGEXP.exec(jmapInfo.subject);
    if(ra) {
      value.num_properties = parseInt(ra[1]);
      value.area = ra[2];
    }
    var total = 0;
    var count = 0;
    var price;
    value.prices = [];
    while ((price = re.exec(body)) !== null) {
      var p = parseInt(price[1].replace(/,/g, ''));
      total += p;
      count += 1;
      value.prices.push(p);
    }
    // Calculates the number of properties advertised as "Reduced"
    var reduced = 0;
    while (REDUCED_REGEXP.exec(jmapInfo.strippedHtmlBody || jmapInfo.textBody) !== null) {
      reduced += 1;
    }
    value.reduced = reduced;
    if(value.num_properties > value.prices.length) {
      console.error('sift-homebuyer: map.js: could not parse all prices in this message: ', key);
    }
    else if (value.num_properties < value.prices.length) {
      console.error('sift-homebuyer: map.js: found more properties than it should in: ', key);
    }
    var average = 0;
    if(count > 0) {
        average = total/count;
    }
    if(value.prices.length > 0) {
        ret.push({name: 'alerts', key: key, value: value});
        // Stores the message in the _tid.list store
        ret.push({ name: 'tidList', key: datum.key, value: {list: {}, detail: {}}});
    }
    else {
        console.error('sift-homebuyer: map.js: could not parse any prices in this message: ', jmapInfo.id)
    }
  });
  console.log('sift-homebuyer: map.js: ret: ', JSON.stringify(ret));
  return ret;
};
