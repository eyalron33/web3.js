import EventEmitter from 'eventemitter3';
import isFunction from 'lodash/isFunction';

class AbstractSubscription extends EventEmitter {
  constructor(type, method, options, utils, formatters, moduleInstance) {
    super();
    this.type = type;
    this.method = method;
    this.options = options || null;
    this.utils = utils;
    this.formatters = formatters;
    this.moduleInstance = moduleInstance;
    this.id = null;
  }
  beforeSubscription(moduleInstance) {}
  onNewSubscriptionItem(subscriptionItem) {
    return subscriptionItem;
  }
  subscribe(callback) {
    this.beforeSubscription(this.moduleInstance);
    let subscriptionParameters = [];
    if (this.options !== null) {
      subscriptionParameters = [this.options];
    }
    this.moduleInstance.currentProvider.subscribe(this.type, this.method, subscriptionParameters).then(subscriptionId => {
      this.id = subscriptionId;
      this.moduleInstance.currentProvider.on(this.id, response => {
        const formattedOutput = this.onNewSubscriptionItem(response.result);
        this.emit('data', formattedOutput);
        if (isFunction(callback)) {
          callback(false, formattedOutput);
        }
      });
    }).catch(error => {
      this.emit('error', error);
      if (isFunction(callback)) {
        callback(error, null);
      }
    });
    return this;
  }
  unsubscribe(callback) {
    return this.moduleInstance.currentProvider.unsubscribe(this.id, this.type.slice(0, 3) + '_unsubscribe').then(response => {
      if (!response) {
        const error = new Error('Error on unsubscribe!');
        if (isFunction(callback)) {
          callback(error, null);
        }
        throw error;
      }
      this.id = null;
      this.removeAllListeners('data');
      if (isFunction(callback)) {
        callback(false, true);
      }
      return true;
    });
  }
}

class LogSubscription extends AbstractSubscription {
  constructor(options, utils, formatters, moduleInstance, getPastLogsMethod) {
    super('eth_subscribe', 'logs', options, utils, formatters, moduleInstance);
    this.getPastLogsMethod = getPastLogsMethod;
  }
  subscribe(callback) {
    if (this.options.fromBlock && this.options.fromBlock !== 'latest' || this.options.fromBlock === 0) {
      this.getPastLogsMethod.parameters = [this.formatters.inputLogFormatter(this.options)];
      this.getPastLogsMethod.execute().then(logs => {
        logs.forEach(log => {
          const formattedLog = this.onNewSubscriptionItem(log);
          if (isFunction(callback)) {
            callback(false, formattedLog);
          }
          this.emit('data', formattedLog);
        });
        delete this.options.fromBlock;
        super.subscribe(callback);
      }).catch(error => {
        if (isFunction(callback)) {
          callback(error, null);
        }
        this.emit('error', error);
      });
      return this;
    }
    super.subscribe(callback);
    return this;
  }
  onNewSubscriptionItem(subscriptionItem) {
    return this.formatters.outputLogFormatter(subscriptionItem);
  }
}

class NewHeadsSubscription extends AbstractSubscription {
  constructor(utils, formatters, moduleInstance) {
    super('eth_subscribe', 'newHeads', null, utils, formatters, moduleInstance);
  }
  onNewSubscriptionItem(subscriptionItem) {
    return this.formatters.outputBlockFormatter(subscriptionItem);
  }
}

class NewPendingTransactionsSubscription extends AbstractSubscription {
  constructor(utils, formatters, moduleInstance) {
    super('eth_subscribe', 'newPendingTransactions', null, utils, formatters, moduleInstance);
  }
}

class SyncingSubscription extends AbstractSubscription {
  constructor(utils, formatters, moduleInstance) {
    super('eth_subscribe', 'syncing', null, utils, formatters, moduleInstance);
    this.isSyncing = null;
  }
  onNewSubscriptionItem(subscriptionItem) {
    const isSyncing = subscriptionItem.result.syncing;
    if (this.isSyncing === null) {
      this.isSyncing = isSyncing;
      this.emit('changed', this.isSyncing);
    }
    if (this.isSyncing === true && isSyncing === false) {
      this.isSyncing = isSyncing;
      this.emit('changed', this.isSyncing);
    }
    if (this.isSyncing === false && isSyncing === true) {
      this.isSyncing = isSyncing;
      this.emit('changed', this.isSyncing);
    }
    return this.formatters.outputSyncingFormatter(subscriptionItem);
  }
}

class MessagesSubscription extends AbstractSubscription {
  constructor(options, utils, formatters, moduleInstance) {
    super('shh_subscribe', 'messages', options, utils, formatters, moduleInstance);
  }
}

export { AbstractSubscription, LogSubscription, NewHeadsSubscription, NewPendingTransactionsSubscription, SyncingSubscription, MessagesSubscription };
