/**
 * sift-homebuyer: View
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import tingle from 'tingle.js';
import moment from 'moment/moment';
import { plotMonthlyMean } from './mean.js';
import { plotMonthDistro } from './distro.js';
import { select } from 'd3-selection';
import { html as lines } from '@redsift/d3-rs-lines';
import { html as bars } from '@redsift/d3-rs-bars';
import { presentation10 } from '@redsift/d3-rs-theme';
import '@redsift/ui-rs-hero';

export default class HomebuyerSiftView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be reflown during transitions
    this._currentData = null;
    this._currentSizeClass = null;

    this.controller.subscribe('storageupdate', this.onStorageUpdate.bind(this));
    this.controller.subscribe('monthLoaded', this.onMonthLoaded.bind(this));

    this.registerOnLoadHandler(this.onLoad.bind(this));
    this.registerOnResizeHandler(this.onResize.bind(this));
  }

  presentView(value) {
    if (value.sizeClass) {
      this._currentSizeClass = value.sizeClass.current;
    }
    if (value.data) {
      this._currentData = value.data;
    }
    if (value.data.indexes) {
      this.updateIndexes(null, value.data.indexes);
    }
    let block = document.querySelector('.block');
    plotMonthDistro(value.data.monthdistro, block.clientWidth, block.clientHeight);
    plotMonthlyMean(value.data.monthlymean, block.clientWidth, block.clientHeight, (key) => {
      this.publish('loadMonth', { key: key });
    });
    this.plotMonthlyVolume(value.data.monthlyvolume, block.clientWidth, block.clientHeight);
    let b = d3.select('#mabar-' + value.data.month);
    b.classed('interactive', false);
    b.classed('selected', true);
    if (!this._currentSizeClass.width || !this._currentSizeClass.height) {
      this.showBlocks(['one', 'two', 'three', 'four']);
    }
    else if (this._currentSizeClass.width <= 230 && this._currentSizeClass.height <= 230) {
      this.showBlocks(['one']);
    }
    else if (this._currentSizeClass.width >= 230 && this._currentSizeClass.height <= 230) {
      this.showBlocks(['one', 'two']);
    }
    else {
      this.showBlocks(['one', 'two', 'three', 'four']);
    }
  }

  willPresentView(value) {}

  showBlocks(ids) {
    let blocks = document.getElementsByClassName('block');
    for (let i = 0; i < blocks.length; i++) {
      if (ids.indexOf(blocks[i].id) !== -1) {
        blocks[i].style.display = '';
      }
      else {
        blocks[i].style.display = 'none';
      }
    }
  }

  updateIndexes(month, indexes) {
    if (!month) {
      document.getElementById('monthtotal').textContent = '£' + indexes.AVG.toLocaleString();
      document.getElementById('statssubtitle').textContent = 'this month';
    }
    else {
      document.getElementById('statssubtitle').textContent = 'on ' + moment.utc(parseInt(month)).format('MMM YY');
    }
    document.getElementById('average').textContent = '£' + indexes.AVG.toLocaleString();
    document.getElementById('number').textContent = indexes.NUM;
    document.getElementById('min').textContent = '£' + indexes.MIN.toLocaleString();
    document.getElementById('max').textContent = '£' + indexes.MAX.toLocaleString();
  }

  onMonthLoaded(value) {
    this.updateIndexes(value.month, value.indexes);
    let block = document.querySelector('.block');
    plotMonthDistro(value.monthdistro, block.clientWidth, block.clientHeight);
  }

  plotMonthlyVolume(data, bWidth, bHeight) {
    let wscale = 1;
    if (bWidth > 230) {
      wscale = bWidth / 230;
    }
    let hscale = 1;
    if (bHeight > 260) {
      hscale = bHeight / 260;
    }
    let margin = { left: 10 * wscale, top: 20 * hscale, right: 10 * wscale, bottom: 10 * hscale };
    let width = bWidth - margin.left - margin.right;
    let height = 220 * hscale - margin.top - margin.bottom;

    if (!this._volume) {
      // Create a base one if one doesn't already exist
      this._volume = lines('volume')
        .tickCountIndex('utcMonth')
        .labelTime('multi')
        .fill([
          presentation10.standard[presentation10.names.green],
          presentation10.standard[presentation10.names.red]])
        .animation('value')
        .niceIndex(false)
        .curve('curveLinear')
        .symbol(['symbolSquare', 'symbolSquare'])
        .tickDisplayIndex((d) => {
          return moment.utc(d).format('MMM');
        })
        .tipHtml((d, i, s) => {
          let tip = (s === 0) ? 'New:' : 'Reduced:';
          return tip + d[1];
        });
    }
    select('#monthlyvolume').datum(data).call(this._volume.width(width).height(height).margin(margin));
  }

  onStorageUpdate(data) {
    this.presentView({ data: data });
  }

  onResize() {
    this.presentView({ data: this._currentData });
  }

  onLoad() {
    document.getElementById('help').addEventListener('click', function (ev) {
      ev.preventDefault();
      let help = new tingle.modal();
      help.setContent(
        '<h2>The Homebuyer Sift</h2>' +
        '<p>Why wait for the newspaper to tell you where the property market is heading when the answer could be in your inbox?</p>' +
        '<p>This Sift creates your own personalized property price dashboard, based on Rightmove and Zoopla email alerts, so you can follow what is really happening with the market.</p>' +
        '<h2>Getting started</h2>' +
        '<p>If you don\'t yet have property price alerts configured you can follow these links to create them:</p>' +
        '<ul>' +
          '<li><a href="http://www.rightmove.co.uk/this-site/setup-alert.html" target="_blank">Rightmove</a></li>' +
          '<li><a href="http://www.zoopla.co.uk/help/#help-5" target="_blank">Zoopla</a>' +
        '</ul>' +
        '<p>The more granular your alerts are, the better, so we recommend you to subscribe for daily email alerts.</p>' +
        '<p>Now, have a little patience and over the next few days watch your property price dashboard start to take shape. The longer your let this Sift run, the more insights you will get, and eventually your dashboard will look like this:</p>' +
        '<img src="assets/screenshot-1.png" style="width: 100%;" />' +
        '<h2>Contextual index</h2>' +
        '<p>Information about your latest average asking price, current volume of new properties and maximums and minimums are also displayed inline with your property alerts:</p>' +
        '<img src="assets/screenshot-2.png" style="width: 100%;"/>' +
        '<h2>Improve this Sift</h2>' +
        '<p>Found an issue with this Sift or have a suggestion? Report it <a href="https://github.com/redsift/sift-homebuyer/issues" target="_blank">here</a> or, if you have no idea what Github is, you can send an email to <a href="mailto:sift-homebuyer@redsift.com">sift-homebuyer@redsift.com</a></p>' +
        '<p>Are you a developer? Want to contribute? We love pull requests.</p>' +
        '<p>Want to customize this Sift for your own functionality? <a href="https://redsift.com" target="_blank">Sign up</a> for free and become a Red Sift developer, <a href="https://github.com/redsift/sift-homebuyer" target="_blank">fork this Sift</a> (or create a new one), run it and share it with the world.</p>');
      help.open();
    });
  }
}

registerSiftView(new HomebuyerSiftView(window));
