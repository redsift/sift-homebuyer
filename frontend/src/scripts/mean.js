/**
 * Monthly Price Mean
 *
 * Copyright (c) 2016 Redsift Limited
 */
import moment from 'moment/moment';

export function plotMonthlyMean(data, bWidth, bHeight, monthLoader) {
  // TODO: implement update flow. For now, just redrawing
  d3.select('#monthlymean-svg').remove();
  if (!data) {
    return;
  }
  let wscale = 1;
  if(bWidth > 230) {
    wscale = bWidth / 230;
  }
  let hscale = 1;
  if(bHeight > 260) {
    hscale = bHeight / 260;
  }
  let margin = { top: 20 * hscale, right: 20 * wscale, bottom: 20 * hscale, left: 28 * wscale };
  let height = 200 * hscale - margin.top - margin.bottom;
  let width = bWidth - margin.left - margin.right;
  let x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
  let y = d3.scale.linear().range([height, 0]);
  x.domain(data.map((d) => { return d.key; }));
  y.domain([0.99 * d3.min(data, (d) => { return d.value }), d3.max(data, (d) => { return d.value; })]);
  let xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');
  xAxis.tickFormat((d) => {
    let date = moment.utc(parseInt(d));
    return date.format('MMM');
  });
  let yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(5);
  yAxis.tickFormat((d) => {
    return (d / 1000).toFixed(0);
  });
  let svg = d3.select('#monthlymean').append('svg')
    .attr('id', 'monthlymean-svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);
  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis);
  let bar = svg.selectAll('.mabar')
    .data(data)
    .enter().append('g')
    .attr('id', (d) => { return 'mabar-' + d.key })
    .attr('class', 'mabar interactive')
    .on('click', (d, i) => {
      let bs = d3.selectAll('.mabar');
      bs.classed('selected', false);
      bs.classed('interactive', true);
      let b = d3.select('#' + bs[0][i].id);
      b.classed('interactive', false);
      b.classed('selected', true);
      monthLoader(d.key);
    });
  bar.append('rect')
    .attr('x', (d) => { return x(d.key); })
    .attr('width', x.rangeBand())
    .attr('y', (d) => {
      if (d.value) {
        return y(d.value);
      }
      else {
        return 0;
      }
    })
    .attr('height', (d) => {
      if (d.value) {
        return height - y(d.value);
      }
      else {
        return 0;
      }
    });
  bar.append('text')
    .attr('dy', '.75em')
    .attr('y', (d) => {
      if (d.value) {
        return (y(d.value) + 6);
      }
      else {
        return 0;
      }
    })
    .attr('x', (d) => { return (x(d.key) + x.rangeBand() / 2); })
    .attr('text-anchor', 'middle')
    .text((d) => {
      return (d.value / 1000).toFixed(0);
    });
}
