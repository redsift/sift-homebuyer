/**
 * Monthly Price Distribution
 *
 * Copyright (c) 2016 Redsift Limited
 */
export function plotMonthDistro(values, bWidth, bHeight) {
  // TODO: implement update flow. For now, just remove and redraw
  d3.select('#monthdistro-svg').remove();
  if (!values || values.length <= 1) {
    return;
  }
  // A formatter for counts.
  let formatCount = d3.format(',.0f');

  let wscale = 1;
  if(bWidth > 230) {
    wscale = bWidth / 230;
  }
  let hscale = 1;
  if(bHeight > 260) {
    hscale = bHeight / 260;
  }
  let margin = { top: 20 * hscale, right: 30 * wscale, bottom: 20 * hscale, left: 20 * wscale };
  let height = 180 * hscale - margin.top - margin.bottom;
  let width = bWidth - margin.left - margin.right;
  let x = d3.scale.linear()
    .domain([values[0], values[values.length - 1]])
    .range([0, width]);
  let data = d3.layout.histogram()(values);
  let y = d3.scale.linear()
    .domain([0, d3.max(data, (d) => { return d.y; })])
    .range([height, 0]);
  let xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .ticks(5);
  xAxis.tickFormat((d) => {
    return '£' + d / 1000 + 'K';
  });
  let yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(0);
  let svg = d3.select('#monthdistro').append('svg')
    .attr('id', 'monthdistro-svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  let bars = svg.selectAll('.mdbar')
    .data(data)
    .enter().append('g')
    .attr('class', 'mdbar')
    .attr('transform', (d) => { return 'translate(' + x(d.x) + ',' + y(d.y) + ')'; });
  bars.append('rect')
    .attr('x', 1)
    .attr('width', (d) => {
      return x(data[0].dx + values[0]) - 1;
    })
    .attr('height', (d) => {
      if (d.y) {
        return height - y(d.y);
      }
      else {
        return 0;
      }
    });
  bars.append('text')
    .attr('dy', '.75em')
    .attr('y', 6)
    .attr('x', x(data[0].dx + values[0]) / 2)
    .attr('text-anchor', 'middle')
    .text((d) => { return formatCount(d.y); });
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)
  // Create Y axis
  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -6)
    .attr('x', -6)
    .style('text-anchor', 'end')
    .text('# Properties');
}