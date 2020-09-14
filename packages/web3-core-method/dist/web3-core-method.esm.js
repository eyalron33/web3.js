import EventEmitter from 'eventemitter3';
import { NewHeadsSubscription } from 'web3-core-subscriptions';
import isString from 'lodash/isString';
import cloneDeep from 'lodash/cloneDeep';
import { Observable } from 'rxjs';
import isFunction from 'lodash/isFunction';

class PromiEvent {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.eventEmitter = new EventEmitter();
    return new Proxy(this, {
      get: this.proxyHandler
    });
  }
  proxyHandler(target, name) {
    if (name === 'resolve' || name === 'reject') {
      return target[name];
    }
    if (name === 'then') {
      return target.promise.then.bind(target.promise);
    }
    if (name === 'catch') {
      return target.promise.catch.bind(target.promise);
    }
    if (target.eventEmitter[name]) {
      return target.eventEmitter[name];
    }
  }
}

class AbstractMethod {
  constructor(rpcMethod, parametersAmount, utils, formatters, moduleInstance) {
    this.utils = utils;
    this.formatters = formatters;
    this.moduleInstance = moduleInstance;
    this._arguments = {
      parameters: []
    };
    this._rpcMethod = rpcMethod;
    this._parametersAmount = parametersAmount;
  }
  beforeExecution(moduleInstance) {}
  afterExecution(response) {
    return response;
  }
  async execute() {
    this.beforeExecution(this.moduleInstance);
    if (this.parameters.length !== this.parametersAmount) {
      throw new Error(`Invalid Arguments length: expected: ${this.parametersAmount}, given: ${this.parameters.length}`);
    }
    try {
      let response = await this.moduleInstance.currentProvider.send(this.rpcMethod, this.parameters);
      if (response) {
        response = this.afterExecution(response);
      }
      if (this.callback) {
        this.callback(false, response);
      }
      return response;
    } catch (error) {
      if (this.callback) {
        this.callback(error, null);
      }
      throw error;
    }
  }
  set rpcMethod(value) {
    this._rpcMethod = value;
  }
  get rpcMethod() {
    return this._rpcMethod;
  }
  set parametersAmount(value) {
    this._parametersAmount = value;
  }
  get parametersAmount() {
    return this._parametersAmount;
  }
  get parameters() {
    return this._arguments.parameters;
  }
  set parameters(value) {
    this._arguments.parameters = value;
  }
  get callback() {
    return this._arguments.callback;
  }
  set callback(value) {
    this._arguments.callback = value;
  }
  setArguments(args) {
    let parameters = cloneDeep([...args]);
    let callback = null;
    if (parameters.length > this.parametersAmount) {
      if (!isFunction(parameters[parameters.length - 1])) {
        throw new TypeError("The latest parameter should be a function otherwise it can't be used as callback");
      }
      callback = parameters.pop();
    }
    this._arguments = {
      callback,
      parameters
    };
  }
  getArguments() {
    return this._arguments;
  }
  isHash(parameter) {
    return isString(parameter) && parameter.startsWith('0x');
  }
}

class AbstractGetBlockMethod extends AbstractMethod {
  constructor(rpcMethod, utils, formatters, moduleInstance) {
    super(rpcMethod, 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
    if (isFunction(this.parameters[1])) {
      this.callback = this.parameters[1];
      this.parameters[1] = false;
    } else {
      this.parameters[1] = !!this.parameters[1];
    }
  }
  afterExecution(response) {
    return this.formatters.outputBlockFormatter(response);
  }
}

class GetBlockByNumberMethod extends AbstractGetBlockMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getBlockByNumber', utils, formatters, moduleInstance);
  }
}

class GetTransactionReceiptMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getTransactionReceipt', 1, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    if (response !== null) {
      return this.formatters.outputTransactionReceiptFormatter(response);
    }
    return response;
  }
}

class TransactionObserver {
  constructor(provider, timeout, blockConfirmations, getTransactionReceiptMethod, getBlockByNumberMethod, newHeadsSubscription) {
    this.provider = provider;
    this.timeout = timeout;
    this.blockConfirmations = blockConfirmations;
    this.getTransactionReceiptMethod = getTransactionReceiptMethod;
    this.getBlockByNumberMethod = getBlockByNumberMethod;
    this.newHeadsSubscription = newHeadsSubscription;
    this.blockNumbers = [];
    this.lastBlock = false;
    this.confirmations = 0;
    this.confirmationChecks = 0;
    this.interval = false;
  }
  observe(transactionHash) {
    return Observable.create(observer => {
      if (this.isSocketBasedProvider()) {
        this.startSocketObserver(transactionHash, observer);
      } else {
        this.startHttpObserver(transactionHash, observer);
      }
    });
  }
  startSocketObserver(transactionHash, observer) {
    this.newHeadsSubscription.subscribe(async (error, newHead) => {
      try {
        if (observer.closed) {
          await this.newHeadsSubscription.unsubscribe();
          return;
        }
        if (error) {
          throw error;
        }
        this.getTransactionReceiptMethod.parameters = [transactionHash];
        const receipt = await this.getTransactionReceiptMethod.execute();
        if (!this.blockNumbers.includes(newHead.number)) {
          if (receipt) {
            this.confirmations++;
            this.emitNext(receipt, observer);
            if (this.isConfirmed()) {
              await this.newHeadsSubscription.unsubscribe();
              observer.complete();
            }
          }
          this.blockNumbers.push(newHead.number);
          this.confirmationChecks++;
          if (this.isTimeoutTimeExceeded()) {
            await this.newHeadsSubscription.unsubscribe();
            this.emitError(new Error('Timeout exceeded during the transaction confirmation process. Be aware the transaction could still get confirmed!'), receipt, observer);
          }
        }
      } catch (error2) {
        this.emitError(error2, false, observer);
      }
    });
  }
  startHttpObserver(transactionHash, observer) {
    const interval = setInterval(async () => {
      try {
        if (observer.closed) {
          clearInterval(interval);
          return;
        }
        this.getTransactionReceiptMethod.parameters = [transactionHash];
        const receipt = await this.getTransactionReceiptMethod.execute();
        if (receipt) {
          if (this.lastBlock) {
            const block = await this.getBlockByNumber(this.increaseBlockNumber(this.lastBlock.number));
            if (block && this.isValidConfirmation(block)) {
              this.lastBlock = block;
              this.confirmations++;
              this.emitNext(receipt, observer);
            }
          } else {
            this.lastBlock = await this.getBlockByNumber(receipt.blockNumber);
            this.confirmations++;
            this.emitNext(receipt, observer);
          }
          if (this.isConfirmed()) {
            clearInterval(interval);
            observer.complete();
          }
        }
        this.confirmationChecks++;
        if (this.isTimeoutTimeExceeded()) {
          clearInterval(interval);
          this.emitError(new Error('Timeout exceeded during the transaction confirmation process. Be aware the transaction could still get confirmed!'), receipt, observer);
        }
      } catch (error) {
        clearInterval(interval);
        this.emitError(error, false, observer);
      }
    }, 1000);
  }
  emitNext(receipt, observer) {
    observer.next({
      receipt,
      confirmations: this.confirmations
    });
  }
  emitError(error, receipt, observer) {
    observer.error({
      error,
      receipt,
      confirmations: this.confirmations,
      confirmationChecks: this.confirmationChecks
    });
  }
  getBlockByNumber(blockHash) {
    this.getBlockByNumberMethod.parameters = [blockHash];
    return this.getBlockByNumberMethod.execute();
  }
  isConfirmed() {
    return this.confirmations === this.blockConfirmations;
  }
  isValidConfirmation(block) {
    return this.lastBlock.hash === block.parentHash && this.lastBlock.number !== block.number;
  }
  isTimeoutTimeExceeded() {
    return this.confirmationChecks === this.timeout;
  }
  isSocketBasedProvider() {
    switch (this.provider.constructor.name) {
      case 'CustomProvider':
      case 'HttpProvider':
        return false;
      default:
        return true;
    }
  }
  increaseBlockNumber(blockNumber) {
    return '0x' + (parseInt(blockNumber, 16) + 1).toString(16);
  }
}

class GetTransactionCountMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getTransactionCount', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
    if (isFunction(this.parameters[1])) {
      this.callback = this.parameters[1];
      this.parameters[1] = moduleInstance.defaultBlock;
    }
    this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class AbstractObservedTransactionMethod extends AbstractMethod {
  constructor(rpcMethod, parametersAmount, utils, formatters, moduleInstance, transactionObserver) {
    super(rpcMethod, parametersAmount, utils, formatters, moduleInstance);
    this.transactionObserver = transactionObserver;
    this.promiEvent = new PromiEvent();
  }
  static get Type() {
    return 'observed-transaction-method';
  }
  execute() {
    this.beforeExecution(this.moduleInstance);
    this.moduleInstance.currentProvider.send(this.rpcMethod, this.parameters).then(transactionHash => {
      let confirmations, receipt;
      if (this.callback) {
        this.callback(false, transactionHash);
        return;
      }
      this.promiEvent.emit('transactionHash', transactionHash);
      const transactionConfirmationSubscription = this.transactionObserver.observe(transactionHash).subscribe(transactionConfirmation => {
        confirmations = transactionConfirmation.confirmations;
        receipt = transactionConfirmation.receipt;
        if (!receipt.status) {
          if (this.parameters[0].gas === receipt.gasUsed) {
            this.handleError(new Error(`Transaction ran out of gas. Please provide more gas:\n${JSON.stringify(receipt, null, 2)}`), receipt, confirmations);
            transactionConfirmationSubscription.unsubscribe();
            return;
          }
          this.handleError(new Error(`Transaction has been reverted by the EVM:\n${JSON.stringify(receipt, null, 2)}`), receipt, confirmations);
          transactionConfirmationSubscription.unsubscribe();
          return;
        }
        this.promiEvent.emit('confirmation', confirmations, this.afterExecution(receipt));
      }, error => {
        this.handleError(error, receipt, confirmations);
      }, () => {
        if (this.promiEvent.listenerCount('receipt') > 0) {
          this.promiEvent.emit('receipt', this.afterExecution(receipt));
          this.promiEvent.removeAllListeners();
          return;
        }
        this.promiEvent.resolve(this.afterExecution(receipt));
      });
    }).catch(error => {
      if (this.callback) {
        this.callback(error, null);
        return;
      }
      this.handleError(error, false, 0);
    });
    return this.promiEvent;
  }
  handleError(error, receipt, confirmations) {
    if (this.promiEvent.listenerCount('error') > 0) {
      this.promiEvent.emit('error', error, receipt, confirmations);
      this.promiEvent.removeAllListeners();
      return;
    }
    this.promiEvent.reject(error);
  }
}

class SendRawTransactionMethod extends AbstractObservedTransactionMethod {
  constructor(utils, formatters, moduleInstance, transactionObserver) {
    super('eth_sendRawTransaction', 1, utils, formatters, moduleInstance, transactionObserver);
  }
}

class ChainIdMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_chainId', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class AbstractMethodFactory {
  constructor(utils, formatters) {
    this.utils = utils;
    this.formatters = formatters;
    this._methods = null;
  }
  get methods() {
    if (this._methods) {
      return this._methods;
    }
    throw new Error('No methods defined for MethodFactory!');
  }
  set methods(value) {
    this._methods = value;
  }
  hasMethod(name) {
    return typeof this.methods[name] !== 'undefined';
  }
  createMethod(name, moduleInstance) {
    const method = this.methods[name];
    if (method.Type === 'observed-transaction-method') {
      return new method(this.utils, this.formatters, moduleInstance, this.createTransactionObserver(moduleInstance));
    }
    if (method.Type === 'eth-send-transaction-method') {
      const transactionObserver = this.createTransactionObserver(moduleInstance);
      return new method(this.utils, this.formatters, moduleInstance, transactionObserver, new ChainIdMethod(this.utils, this.formatters, moduleInstance), new GetTransactionCountMethod(this.utils, this.formatters, moduleInstance), new SendRawTransactionMethod(this.utils, this.formatters, moduleInstance, transactionObserver));
    }
    return new method(this.utils, this.formatters, moduleInstance);
  }
  getTimeout(moduleInstance) {
    let timeout = moduleInstance.transactionBlockTimeout;
    if (!moduleInstance.currentProvider.SOCKET_MESSAGE) {
      timeout = moduleInstance.transactionPollingTimeout;
    }
    return timeout;
  }
  createTransactionObserver(moduleInstance) {
    return new TransactionObserver(moduleInstance.currentProvider, this.getTimeout(moduleInstance), moduleInstance.transactionConfirmationBlocks, new GetTransactionReceiptMethod(this.utils, this.formatters, moduleInstance), new GetBlockByNumberMethod(this.utils, this.formatters, moduleInstance), new NewHeadsSubscription(this.utils, this.formatters, moduleInstance));
  }
}

class MethodProxy {
  constructor(target, methodFactory) {
    return new Proxy(target, {
      get: (target, name) => {
        if (methodFactory.hasMethod(name)) {
          if (typeof target[name] !== 'undefined') {
            throw new TypeError(`Duplicated method ${name}. This method is defined as RPC call and as Object method.`);
          }
          const method = methodFactory.createMethod(name, target);
          function anonymousFunction() {
            method.setArguments(arguments);
            return method.execute();
          }
          anonymousFunction.method = method;
          anonymousFunction.request = function () {
            method.setArguments(arguments);
            return method;
          };
          return anonymousFunction;
        }
        return target[name];
      }
    });
  }
}

class GetProtocolVersionMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_protocolVersion', 0, utils, formatters, moduleInstance);
  }
}

class VersionMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('net_version', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class ListeningMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('net_listening', 0, utils, formatters, moduleInstance);
  }
}

class PeerCountMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('net_peerCount', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class GetNodeInfoMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('web3_clientVersion', 0, utils, formatters, moduleInstance);
  }
}

class GetCoinbaseMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_coinbase', 0, utils, formatters, moduleInstance);
  }
}

class IsMiningMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_mining', 0, utils, formatters, moduleInstance);
  }
}

class GetHashrateMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_hashrate', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class IsSyncingMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_syncing', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    if (typeof response !== 'boolean') {
      return this.formatters.outputSyncingFormatter(response);
    }
    return response;
  }
}

class GetGasPriceMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_gasPrice', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.formatters.outputBigNumberFormatter(response);
  }
}

class SubmitWorkMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_submitWork', 3, utils, formatters, moduleInstance);
  }
}

class GetWorkMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getWork', 0, utils, formatters, moduleInstance);
  }
}

class GetAccountsMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_accounts', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return response.map(responseItem => {
      return this.utils.toChecksumAddress(responseItem);
    });
  }
}

class GetBalanceMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getBalance', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
    if (isFunction(this.parameters[1])) {
      this.callback = this.parameters[1];
      this.parameters[1] = moduleInstance.defaultBlock;
    }
    this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
  }
  afterExecution(response) {
    return this.formatters.outputBigNumberFormatter(response);
  }
}

class RequestAccountsMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_requestAccounts', 0, utils, formatters, moduleInstance);
  }
}

class AbstractGetUncleMethod extends AbstractMethod {
  constructor(rpcMethod, utils, formatters, moduleInstance) {
    super(rpcMethod, 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
    this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
  }
  afterExecution(response) {
    return this.formatters.outputBlockFormatter(response);
  }
}

class AbstractGetBlockTransactionCountMethod extends AbstractMethod {
  constructor(rpcMethod, utils, formatters, moduleInstance) {
    super(rpcMethod, 1, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class AbstractGetBlockUncleCountMethod extends AbstractMethod {
  constructor(rpcMethod, utils, formatters, moduleInstance) {
    super(rpcMethod, 1, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class GetBlockByHashMethod extends AbstractGetBlockMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getBlockByHash', utils, formatters, moduleInstance);
  }
}

class GetBlockNumberMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_blockNumber', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class GetBlockTransactionCountByHashMethod extends AbstractGetBlockTransactionCountMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getBlockTransactionCountByHash', utils, formatters, moduleInstance);
  }
}

class GetBlockTransactionCountByNumberMethod extends AbstractGetBlockTransactionCountMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getBlockTransactionCountByNumber', utils, formatters, moduleInstance);
  }
}

class GetBlockUncleCountByBlockHashMethod extends AbstractGetBlockUncleCountMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getUncleCountByBlockHash', utils, formatters, moduleInstance);
  }
}

class GetBlockUncleCountByBlockNumberMethod extends AbstractGetBlockUncleCountMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getUncleCountByBlockNumber', utils, formatters, moduleInstance);
  }
}

class GetUncleByBlockHashAndIndexMethod extends AbstractGetUncleMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getUncleByBlockHashAndIndex', utils, formatters, moduleInstance);
  }
}

class GetUncleByBlockNumberAndIndexMethod extends AbstractGetUncleMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getUncleByBlockNumberAndIndex', utils, formatters, moduleInstance);
  }
}

class AbstractGetTransactionFromBlockMethod extends AbstractMethod {
  constructor(rpcMethod, utils, formatters, moduleInstance) {
    super(rpcMethod, 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
    this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
  }
  afterExecution(response) {
    return this.formatters.outputTransactionFormatter(response);
  }
}

class SendTransactionMethod extends AbstractObservedTransactionMethod {
  constructor(utils, formatters, moduleInstance, transactionObserver) {
    super('eth_sendTransaction', 1, utils, formatters, moduleInstance, transactionObserver);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
  }
}

class EthSendTransactionMethod extends SendTransactionMethod {
  constructor(utils, formatters, moduleInstance, transactionObserver, chainIdMethod, getTransactionCountMethod, sendRawTransactionMethod) {
    super(utils, formatters, moduleInstance, transactionObserver);
    this.chainIdMethod = chainIdMethod;
    this.getTransactionCountMethod = getTransactionCountMethod;
    this.sendRawTransactionMethod = sendRawTransactionMethod;
  }
  static get Type() {
    return 'eth-send-transaction-method';
  }
  execute() {
    if (!this.parameters[0].gas && this.moduleInstance.defaultGas) {
      this.parameters[0]['gas'] = this.moduleInstance.defaultGas;
    }
    if (!this.parameters[0].gasPrice && this.parameters[0].gasPrice !== 0) {
      if (!this.moduleInstance.defaultGasPrice) {
        this.moduleInstance.currentProvider.send('eth_gasPrice', []).then(gasPrice => {
          this.parameters[0].gasPrice = gasPrice;
          this.execute();
        }).catch(error => {
          this.handleError(error, false, 0);
        });
        return this.promiEvent;
      }
      this.parameters[0]['gasPrice'] = this.moduleInstance.defaultGasPrice;
    }
    if (this.hasAccounts() && this.isDefaultSigner()) {
      if (this.moduleInstance.accounts.wallet[this.parameters[0].from]) {
        this.sendRawTransaction(this.moduleInstance.accounts.wallet[this.parameters[0].from].privateKey).catch(error => {
          this.handleError(error, false, 0);
        });
        return this.promiEvent;
      }
    }
    if (this.hasCustomSigner()) {
      this.sendRawTransaction().catch(error => {
        this.handleError(error, false, 0);
      });
      return this.promiEvent;
    }
    return super.execute();
  }
  async sendRawTransaction(privateKey = null) {
    if (!this.parameters[0].chainId) {
      this.parameters[0].chainId = await this.chainIdMethod.execute();
    }
    if (!this.parameters[0].nonce && this.parameters[0].nonce !== 0) {
      this.getTransactionCountMethod.parameters = [this.parameters[0].from];
      this.parameters[0].nonce = await this.getTransactionCountMethod.execute();
    }
    let transaction = this.formatters.inputCallFormatter(this.parameters[0], this.moduleInstance);
    transaction.to = transaction.to || '0x';
    transaction.data = transaction.data || '0x';
    transaction.value = transaction.value || '0x';
    transaction.chainId = this.utils.numberToHex(transaction.chainId);
    delete transaction.from;
    const response = await this.moduleInstance.transactionSigner.sign(transaction, privateKey);
    this.sendRawTransactionMethod.parameters = [response.rawTransaction];
    this.sendRawTransactionMethod.callback = this.callback;
    this.sendRawTransactionMethod.promiEvent = this.promiEvent;
    return this.sendRawTransactionMethod.execute();
  }
  isDefaultSigner() {
    return this.moduleInstance.transactionSigner.constructor.name === 'TransactionSigner';
  }
  hasAccounts() {
    return this.moduleInstance.accounts && this.moduleInstance.accounts.wallet.accountsIndex > 0;
  }
  hasCustomSigner() {
    return this.moduleInstance.transactionSigner.constructor.name !== 'TransactionSigner';
  }
}

class GetTransactionMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getTransactionByHash', 1, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.formatters.outputTransactionFormatter(response);
  }
}

class GetTransactionByBlockHashAndIndexMethod extends AbstractGetTransactionFromBlockMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getTransactionByBlockHashAndIndex', utils, formatters, moduleInstance);
  }
}

class GetTransactionByBlockNumberAndIndexMethod extends AbstractGetTransactionFromBlockMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getTransactionByBlockNumberAndIndex', utils, formatters, moduleInstance);
  }
}

class SignTransactionMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_signTransaction', 1, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
  }
}

class GetCodeMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getCode', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
    if (isFunction(this.parameters[1])) {
      this.callback = this.parameters[1];
      this.parameters[1] = moduleInstance.defaultBlock;
    }
    this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
  }
}

class SignMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_sign', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
    this.parameters[1] = this.formatters.inputAddressFormatter(this.parameters[1]);
    this.parameters.reverse();
  }
}

class CallMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_call', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputCallFormatter(this.parameters[0], moduleInstance);
    if (isFunction(this.parameters[1])) {
      this.callback = this.parameters[1];
      this.parameters[1] = moduleInstance.defaultBlock;
    }
    this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
  }
}

class GetStorageAtMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getStorageAt', 3, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
    this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
    if (isFunction(this.parameters[2])) {
      this.callback = this.parameters[2];
      this.parameters[2] = moduleInstance.defaultBlock;
    }
    this.parameters[2] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[2], moduleInstance);
  }
}

class EstimateGasMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_estimateGas', 1, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputCallFormatter(this.parameters[0], moduleInstance);
  }
  afterExecution(response) {
    return this.utils.hexToNumber(response);
  }
}

class GetPastLogsMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('eth_getLogs', 1, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputLogFormatter(this.parameters[0]);
  }
  afterExecution(response) {
    return response.map(responseItem => {
      return this.formatters.outputLogFormatter(responseItem);
    });
  }
}

class EcRecoverMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_ecRecover', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
  }
}

class ImportRawKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_importRawKey', 2, utils, formatters, moduleInstance);
  }
}

class ListAccountsMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_listAccounts', 0, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return response.map(responseItem => {
      return this.utils.toChecksumAddress(responseItem);
    });
  }
}

class LockAccountMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_lockAccount', 1, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
  }
}

class NewAccountMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_newAccount', 1, utils, formatters, moduleInstance);
  }
  afterExecution(response) {
    return this.utils.toChecksumAddress(response);
  }
}

class PersonalSendTransactionMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_sendTransaction', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
  }
}

class PersonalSignMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_sign', 3, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
    this.parameters[1] = this.formatters.inputAddressFormatter(this.parameters[1]);
    if (isFunction(this.parameters[2])) {
      this.callback = this.parameters[2];
      delete this.parameters[2];
    }
  }
}

class PersonalSignTransactionMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_signTransaction', 2, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
  }
}

class UnlockAccountMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('personal_unlockAccount', 3, utils, formatters, moduleInstance);
  }
  beforeExecution(moduleInstance) {
    this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
  }
}

class AddPrivateKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_addPrivateKey', 1, utils, formatters, moduleInstance);
  }
}

class AddSymKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_addSymKey', 1, utils, formatters, moduleInstance);
  }
}

class DeleteKeyPairMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_deleteKeyPair', 1, utils, formatters, moduleInstance);
  }
}

class DeleteMessageFilterMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_deleteMessageFilter', 1, utils, formatters, moduleInstance);
  }
}

class DeleteSymKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_deleteSymKey', 1, utils, formatters, moduleInstance);
  }
}

class GenerateSymKeyFromPasswordMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_generateSymKeyFromPassword', 1, utils, formatters, moduleInstance);
  }
}

class GetFilterMessagesMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_getFilterMessages', 1, utils, formatters, moduleInstance);
  }
}

class GetInfoMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_info', 0, utils, formatters, moduleInstance);
  }
}

class GetPrivateKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_getPrivateKey', 1, utils, formatters, moduleInstance);
  }
}

class GetPublicKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_getPublicKey', 1, utils, formatters, moduleInstance);
  }
}

class GetSymKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_getSymKey', 1, utils, formatters, moduleInstance);
  }
}

class HasKeyPairMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_hasKeyPair', 1, utils, formatters, moduleInstance);
  }
}

class HasSymKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_hasSymKey', 1, utils, formatters, moduleInstance);
  }
}

class MarkTrustedPeerMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_markTrustedPeer', 1, utils, formatters, moduleInstance);
  }
}

class NewKeyPairMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_newKeyPair', 0, utils, formatters, moduleInstance);
  }
}

class NewMessageFilterMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_newMessageFilter', 1, utils, formatters, moduleInstance);
  }
}

class NewSymKeyMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_newSymKey', 0, utils, formatters, moduleInstance);
  }
}

class PostMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_post', 1, utils, formatters, moduleInstance);
  }
}

class SetMaxMessageSizeMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_setMaxMessageSize', 1, utils, formatters, moduleInstance);
  }
}

class SetMinPoWMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_setMinPoW', 1, utils, formatters, moduleInstance);
  }
}

class ShhVersionMethod extends AbstractMethod {
  constructor(utils, formatters, moduleInstance) {
    super('shh_version', 0, utils, formatters, moduleInstance);
  }
}

export { PromiEvent, AbstractMethodFactory, AbstractMethod, MethodProxy, TransactionObserver, GetProtocolVersionMethod, VersionMethod, ListeningMethod, PeerCountMethod, ChainIdMethod, GetNodeInfoMethod, GetCoinbaseMethod, IsMiningMethod, GetHashrateMethod, IsSyncingMethod, GetGasPriceMethod, SubmitWorkMethod, GetWorkMethod, GetAccountsMethod, GetBalanceMethod, GetTransactionCountMethod, RequestAccountsMethod, AbstractGetBlockMethod, AbstractGetUncleMethod, AbstractGetBlockTransactionCountMethod, AbstractGetBlockUncleCountMethod, GetBlockByHashMethod, GetBlockByNumberMethod, GetBlockNumberMethod, GetBlockTransactionCountByHashMethod, GetBlockTransactionCountByNumberMethod, GetBlockUncleCountByBlockHashMethod, GetBlockUncleCountByBlockNumberMethod, GetUncleByBlockHashAndIndexMethod, GetUncleByBlockNumberAndIndexMethod, AbstractGetTransactionFromBlockMethod, AbstractObservedTransactionMethod, EthSendTransactionMethod, GetTransactionMethod, GetTransactionByBlockHashAndIndexMethod, GetTransactionByBlockNumberAndIndexMethod, GetTransactionReceiptMethod, SendRawTransactionMethod, SignTransactionMethod, SendTransactionMethod, GetCodeMethod, SignMethod, CallMethod, GetStorageAtMethod, EstimateGasMethod, GetPastLogsMethod, EcRecoverMethod, ImportRawKeyMethod, ListAccountsMethod, LockAccountMethod, NewAccountMethod, PersonalSendTransactionMethod, PersonalSignMethod, PersonalSignTransactionMethod, UnlockAccountMethod, AddPrivateKeyMethod, AddSymKeyMethod, DeleteKeyPairMethod, DeleteMessageFilterMethod, DeleteSymKeyMethod, GenerateSymKeyFromPasswordMethod, GetFilterMessagesMethod, GetInfoMethod, GetPrivateKeyMethod, GetPublicKeyMethod, GetSymKeyMethod, HasKeyPairMethod, HasSymKeyMethod, MarkTrustedPeerMethod, NewKeyPairMethod, NewMessageFilterMethod, NewSymKeyMethod, PostMethod, SetMaxMessageSizeMethod, SetMinPoWMethod, ShhVersionMethod };
