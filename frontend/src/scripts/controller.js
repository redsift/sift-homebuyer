/**
 * sift-homebuyer: Controller
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';
import moment from 'moment/moment';

export default class HomebuyerController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    // Bind this to the methods so they can be used in callbacks
    this.onStorageUpdate = this.onStorageUpdate.bind(this);
    this.onLoadMonth = this.onLoadMonth.bind(this);
  }

  // TODO: link to docs
  loadView(state) {
    var thisMonth = moment().utc().startOf('month').valueOf().toString();
    var data = Promise.all([this._getIndexes(thisMonth), this._getMonthDistro(thisMonth), this._getMonthlyMean(), this._getMonthlyVolume()]).then((v) => {
      return { month: thisMonth, indexes: v[0], monthdistro: v[1], monthlymean: v[2], monthlyvolume: v[3] };
    });
    this.view.subscribe('loadMonth', this.onLoadMonth);
    this.storage.subscribe(['indexes', 'monthdistro', 'monthlymean'], this.onStorageUpdate);
    return { html: 'view.html', data: data };
  }

  onStorageUpdate(value) {
    var thisMonth = moment().utc().startOf('month').valueOf().toString();
    Promise.all([this._getIndexes(thisMonth), this._getMonthDistro(thisMonth), this._getMonthlyMean(), this._getMonthlyVolume()]).then((v) => {
      this.publish('storageupdate', { month: thisMonth, indexes: v[0], monthdistro: v[1], monthlymean: v[2], monthlyvolume: v[3] });
    }).catch((err) => {
      console.error('sift-homebuyer: onStorageUpdate: error: ', err);
    });
  }

  onLoadMonth(value) {
    Promise.all([this._getIndexes(value.key), this._getMonthDistro(value.key)]).then((v) => {
      this.publish('monthLoaded', { month: value.key, indexes: v[0], monthdistro: v[1] });
    });
  }

  _getIndexes(month) {
    return this.storage.get({
      bucket: 'indexes',
      keys: [month + '/AVG', month + '/NUM', month + '/MIN', month + '/MAX']
    }).then((values) => {
      var ret = {};
      values.forEach((v) => {
        if (v.value) {
          ret[v.key.split('/')[1]] = parseInt(v.value);
        }
        else {
          ret[v.key.split('/')[1]] = 0;
        }
      });
      return ret;
    });
  }

  _getMonthDistro(month) {
    return this.storage.get({
      bucket: 'monthdistro',
      keys: [month]
    }).then((values) => {
      if (values[0].value) {
        return JSON.parse(values[0].value);
      }
      else {
        return null;
      }
    });
  }

  _getMonthlyMean() {
    var mk = this._getMonthlyKeys(9);
    return this.storage.get({
      bucket: 'monthlymean',
      keys: mk
    }).then((values) => {
      return values;
    });
  }

  _getMonthlyVolume() {
    var mk = this._getMonthlyKeys(9);
    return this.storage.get({
      bucket: 'monthlyvolume',
      keys: mk
    }).then((values) => {
      return values.map(function (v) {
        return {l: parseInt(v.key), v: v.value?JSON.parse(v.value):[0,0]};
      });
    });
  }

  _getMonthlyKeys(num) {
    var chartKeys = [];
    for (var i = 0; i < num; i += 1) {
      chartKeys.unshift(moment().utc().subtract(i, 'months').startOf('month').valueOf().toString());
    }
    return chartKeys;
  }
}

registerSiftController(new HomebuyerController());
