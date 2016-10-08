/**
 * Aggregates monthly stats for property alerts
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';
// Entry point for DAG node
module.exports = function (got) {
  const inData = got['in'];
  const query = got['query'];
  var min;
  var max;
  var number = 0;
  var average = 0;
  var allPrices = [];
  var reduced = 0;
  inData.data.forEach(function (datum) {
    var jvalue = JSON.parse(datum.value);
    jvalue.prices.forEach(function (p) {
      if (min === undefined || p < min) {
        min = p;
      }
      if (max === undefined || p > max) {
        max = p;
      }
      number++;
      average += p;
      allPrices.push(p);
    });
    reduced += jvalue.reduced;
  });
  average = Math.round(average / number);
  allPrices = allPrices.sort(function (a, b) { return a - b; });
  var stats = [];
  stats.push({ name: 'indexes', key: query[0] + '/MIN', value: min.toString() });
  stats.push({ name: 'indexes', key: query[0] + '/MAX', value: max.toString() });
  stats.push({ name: 'indexes', key: query[0] + '/AVG', value: average.toString() });
  stats.push({ name: 'indexes', key: query[0] + '/NUM', value: number.toString() });
  stats.push({ name: 'monthlymean', key: query[0], value: average.toString() });
  stats.push({ name: 'monthdistro', key: query[0], value: allPrices });
  stats.push({ name: 'monthlyvolume', key: query[0], value: [number, reduced] });
  return stats;
};

function sortedInsert(val, array) {
  if (array.length === 0 || val >= array[array.length - 1]) {
    array.push(val);
    return;
  }
  for (var i = 0; i < array.length; i++) {
    if (val >= array[i]) {
      array.splice(i, 0, val);
      return;
    }
  }
}
