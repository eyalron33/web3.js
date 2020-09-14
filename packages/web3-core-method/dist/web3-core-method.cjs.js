'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('eventemitter3'));
var web3CoreSubscriptions = require('web3-core-subscriptions');
var _toConsumableArray = _interopDefault(require('@babel/runtime/helpers/toConsumableArray'));
var isString = _interopDefault(require('lodash/isString'));
var cloneDeep = _interopDefault(require('lodash/cloneDeep'));
var rxjs = require('rxjs');
var _regeneratorRuntime = _interopDefault(require('@babel/runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('@babel/runtime/helpers/asyncToGenerator'));
var _get = _interopDefault(require('@babel/runtime/helpers/get'));
var isFunction = _interopDefault(require('lodash/isFunction'));
var _createClass = _interopDefault(require('@babel/runtime/helpers/createClass'));
var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));
var _possibleConstructorReturn = _interopDefault(require('@babel/runtime/helpers/possibleConstructorReturn'));
var _getPrototypeOf = _interopDefault(require('@babel/runtime/helpers/getPrototypeOf'));
var _inherits = _interopDefault(require('@babel/runtime/helpers/inherits'));

var PromiEvent =
function () {
  function PromiEvent() {
    var _this = this;
    _classCallCheck(this, PromiEvent);
    this.promise = new Promise(function (resolve, reject) {
      _this.resolve = resolve;
      _this.reject = reject;
    });
    this.eventEmitter = new EventEmitter();
    return new Proxy(this, {
      get: this.proxyHandler
    });
  }
  _createClass(PromiEvent, [{
    key: "proxyHandler",
    value: function proxyHandler(target, name) {
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
  }]);
  return PromiEvent;
}();

var AbstractMethod =
function () {
  function AbstractMethod(rpcMethod, parametersAmount, utils, formatters, moduleInstance) {
    _classCallCheck(this, AbstractMethod);
    this.utils = utils;
    this.formatters = formatters;
    this.moduleInstance = moduleInstance;
    this._arguments = {
      parameters: []
    };
    this._rpcMethod = rpcMethod;
    this._parametersAmount = parametersAmount;
  }
  _createClass(AbstractMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {}
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return response;
    }
  }, {
    key: "execute",
    value: function () {
      var _execute = _asyncToGenerator(
      _regeneratorRuntime.mark(function _callee() {
        var response;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.beforeExecution(this.moduleInstance);
                if (!(this.parameters.length !== this.parametersAmount)) {
                  _context.next = 3;
                  break;
                }
                throw new Error("Invalid Arguments length: expected: ".concat(this.parametersAmount, ", given: ").concat(this.parameters.length));
              case 3:
                _context.prev = 3;
                _context.next = 6;
                return this.moduleInstance.currentProvider.send(this.rpcMethod, this.parameters);
              case 6:
                response = _context.sent;
                if (response) {
                  response = this.afterExecution(response);
                }
                if (this.callback) {
                  this.callback(false, response);
                }
                return _context.abrupt("return", response);
              case 12:
                _context.prev = 12;
                _context.t0 = _context["catch"](3);
                if (this.callback) {
                  this.callback(_context.t0, null);
                }
                throw _context.t0;
              case 16:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 12]]);
      }));
      function execute() {
        return _execute.apply(this, arguments);
      }
      return execute;
    }()
  }, {
    key: "setArguments",
    value: function setArguments(args) {
      var parameters = cloneDeep(_toConsumableArray(args));
      var callback = null;
      if (parameters.length > this.parametersAmount) {
        if (!isFunction(parameters[parameters.length - 1])) {
          throw new TypeError("The latest parameter should be a function otherwise it can't be used as callback");
        }
        callback = parameters.pop();
      }
      this._arguments = {
        callback: callback,
        parameters: parameters
      };
    }
  }, {
    key: "getArguments",
    value: function getArguments() {
      return this._arguments;
    }
  }, {
    key: "isHash",
    value: function isHash(parameter) {
      return isString(parameter) && parameter.startsWith('0x');
    }
  }, {
    key: "rpcMethod",
    set: function set(value) {
      this._rpcMethod = value;
    }
    ,
    get: function get() {
      return this._rpcMethod;
    }
  }, {
    key: "parametersAmount",
    set: function set(value) {
      this._parametersAmount = value;
    }
    ,
    get: function get() {
      return this._parametersAmount;
    }
  }, {
    key: "parameters",
    get: function get() {
      return this._arguments.parameters;
    }
    ,
    set: function set(value) {
      this._arguments.parameters = value;
    }
  }, {
    key: "callback",
    get: function get() {
      return this._arguments.callback;
    }
    ,
    set: function set(value) {
      this._arguments.callback = value;
    }
  }]);
  return AbstractMethod;
}();

var AbstractGetBlockMethod =
function (_AbstractMethod) {
  _inherits(AbstractGetBlockMethod, _AbstractMethod);
  function AbstractGetBlockMethod(rpcMethod, utils, formatters, moduleInstance) {
    _classCallCheck(this, AbstractGetBlockMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(AbstractGetBlockMethod).call(this, rpcMethod, 2, utils, formatters, moduleInstance));
  }
  _createClass(AbstractGetBlockMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
      if (isFunction(this.parameters[1])) {
        this.callback = this.parameters[1];
        this.parameters[1] = false;
      } else {
        this.parameters[1] = !!this.parameters[1];
      }
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.formatters.outputBlockFormatter(response);
    }
  }]);
  return AbstractGetBlockMethod;
}(AbstractMethod);

var GetBlockByNumberMethod =
function (_AbstractGetBlockMeth) {
  _inherits(GetBlockByNumberMethod, _AbstractGetBlockMeth);
  function GetBlockByNumberMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBlockByNumberMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockByNumberMethod).call(this, 'eth_getBlockByNumber', utils, formatters, moduleInstance));
  }
  return GetBlockByNumberMethod;
}(AbstractGetBlockMethod);

var GetTransactionReceiptMethod =
function (_AbstractMethod) {
  _inherits(GetTransactionReceiptMethod, _AbstractMethod);
  function GetTransactionReceiptMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetTransactionReceiptMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionReceiptMethod).call(this, 'eth_getTransactionReceipt', 1, utils, formatters, moduleInstance));
  }
  _createClass(GetTransactionReceiptMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      if (response !== null) {
        return this.formatters.outputTransactionReceiptFormatter(response);
      }
      return response;
    }
  }]);
  return GetTransactionReceiptMethod;
}(AbstractMethod);

var TransactionObserver =
function () {
  function TransactionObserver(provider, timeout, blockConfirmations, getTransactionReceiptMethod, getBlockByNumberMethod, newHeadsSubscription) {
    _classCallCheck(this, TransactionObserver);
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
  _createClass(TransactionObserver, [{
    key: "observe",
    value: function observe(transactionHash) {
      var _this = this;
      return rxjs.Observable.create(function (observer) {
        if (_this.isSocketBasedProvider()) {
          _this.startSocketObserver(transactionHash, observer);
        } else {
          _this.startHttpObserver(transactionHash, observer);
        }
      });
    }
  }, {
    key: "startSocketObserver",
    value: function startSocketObserver(transactionHash, observer) {
      var _this2 = this;
      this.newHeadsSubscription.subscribe(
      function () {
        var _ref = _asyncToGenerator(
        _regeneratorRuntime.mark(function _callee(error, newHead) {
          var receipt;
          return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  if (!observer.closed) {
                    _context.next = 5;
                    break;
                  }
                  _context.next = 4;
                  return _this2.newHeadsSubscription.unsubscribe();
                case 4:
                  return _context.abrupt("return");
                case 5:
                  if (!error) {
                    _context.next = 7;
                    break;
                  }
                  throw error;
                case 7:
                  _this2.getTransactionReceiptMethod.parameters = [transactionHash];
                  _context.next = 10;
                  return _this2.getTransactionReceiptMethod.execute();
                case 10:
                  receipt = _context.sent;
                  if (_this2.blockNumbers.includes(newHead.number)) {
                    _context.next = 25;
                    break;
                  }
                  if (!receipt) {
                    _context.next = 19;
                    break;
                  }
                  _this2.confirmations++;
                  _this2.emitNext(receipt, observer);
                  if (!_this2.isConfirmed()) {
                    _context.next = 19;
                    break;
                  }
                  _context.next = 18;
                  return _this2.newHeadsSubscription.unsubscribe();
                case 18:
                  observer.complete();
                case 19:
                  _this2.blockNumbers.push(newHead.number);
                  _this2.confirmationChecks++;
                  if (!_this2.isTimeoutTimeExceeded()) {
                    _context.next = 25;
                    break;
                  }
                  _context.next = 24;
                  return _this2.newHeadsSubscription.unsubscribe();
                case 24:
                  _this2.emitError(new Error('Timeout exceeded during the transaction confirmation process. Be aware the transaction could still get confirmed!'), receipt, observer);
                case 25:
                  _context.next = 30;
                  break;
                case 27:
                  _context.prev = 27;
                  _context.t0 = _context["catch"](0);
                  _this2.emitError(_context.t0, false, observer);
                case 30:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, null, [[0, 27]]);
        }));
        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }());
    }
  }, {
    key: "startHttpObserver",
    value: function startHttpObserver(transactionHash, observer) {
      var _this3 = this;
      var interval = setInterval(
      _asyncToGenerator(
      _regeneratorRuntime.mark(function _callee2() {
        var receipt, block;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                if (!observer.closed) {
                  _context2.next = 4;
                  break;
                }
                clearInterval(interval);
                return _context2.abrupt("return");
              case 4:
                _this3.getTransactionReceiptMethod.parameters = [transactionHash];
                _context2.next = 7;
                return _this3.getTransactionReceiptMethod.execute();
              case 7:
                receipt = _context2.sent;
                if (!receipt) {
                  _context2.next = 22;
                  break;
                }
                if (!_this3.lastBlock) {
                  _context2.next = 16;
                  break;
                }
                _context2.next = 12;
                return _this3.getBlockByNumber(_this3.increaseBlockNumber(_this3.lastBlock.number));
              case 12:
                block = _context2.sent;
                if (block && _this3.isValidConfirmation(block)) {
                  _this3.lastBlock = block;
                  _this3.confirmations++;
                  _this3.emitNext(receipt, observer);
                }
                _context2.next = 21;
                break;
              case 16:
                _context2.next = 18;
                return _this3.getBlockByNumber(receipt.blockNumber);
              case 18:
                _this3.lastBlock = _context2.sent;
                _this3.confirmations++;
                _this3.emitNext(receipt, observer);
              case 21:
                if (_this3.isConfirmed()) {
                  clearInterval(interval);
                  observer.complete();
                }
              case 22:
                _this3.confirmationChecks++;
                if (_this3.isTimeoutTimeExceeded()) {
                  clearInterval(interval);
                  _this3.emitError(new Error('Timeout exceeded during the transaction confirmation process. Be aware the transaction could still get confirmed!'), receipt, observer);
                }
                _context2.next = 30;
                break;
              case 26:
                _context2.prev = 26;
                _context2.t0 = _context2["catch"](0);
                clearInterval(interval);
                _this3.emitError(_context2.t0, false, observer);
              case 30:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, null, [[0, 26]]);
      })), 1000);
    }
  }, {
    key: "emitNext",
    value: function emitNext(receipt, observer) {
      observer.next({
        receipt: receipt,
        confirmations: this.confirmations
      });
    }
  }, {
    key: "emitError",
    value: function emitError(error, receipt, observer) {
      observer.error({
        error: error,
        receipt: receipt,
        confirmations: this.confirmations,
        confirmationChecks: this.confirmationChecks
      });
    }
  }, {
    key: "getBlockByNumber",
    value: function getBlockByNumber(blockHash) {
      this.getBlockByNumberMethod.parameters = [blockHash];
      return this.getBlockByNumberMethod.execute();
    }
  }, {
    key: "isConfirmed",
    value: function isConfirmed() {
      return this.confirmations === this.blockConfirmations;
    }
  }, {
    key: "isValidConfirmation",
    value: function isValidConfirmation(block) {
      return this.lastBlock.hash === block.parentHash && this.lastBlock.number !== block.number;
    }
  }, {
    key: "isTimeoutTimeExceeded",
    value: function isTimeoutTimeExceeded() {
      return this.confirmationChecks === this.timeout;
    }
  }, {
    key: "isSocketBasedProvider",
    value: function isSocketBasedProvider() {
      switch (this.provider.constructor.name) {
        case 'CustomProvider':
        case 'HttpProvider':
          return false;
        default:
          return true;
      }
    }
  }, {
    key: "increaseBlockNumber",
    value: function increaseBlockNumber(blockNumber) {
      return '0x' + (parseInt(blockNumber, 16) + 1).toString(16);
    }
  }]);
  return TransactionObserver;
}();

var GetTransactionCountMethod =
function (_AbstractMethod) {
  _inherits(GetTransactionCountMethod, _AbstractMethod);
  function GetTransactionCountMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetTransactionCountMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionCountMethod).call(this, 'eth_getTransactionCount', 2, utils, formatters, moduleInstance));
  }
  _createClass(GetTransactionCountMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
      if (isFunction(this.parameters[1])) {
        this.callback = this.parameters[1];
        this.parameters[1] = moduleInstance.defaultBlock;
      }
      this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return GetTransactionCountMethod;
}(AbstractMethod);

var AbstractObservedTransactionMethod =
function (_AbstractMethod) {
  _inherits(AbstractObservedTransactionMethod, _AbstractMethod);
  function AbstractObservedTransactionMethod(rpcMethod, parametersAmount, utils, formatters, moduleInstance, transactionObserver) {
    var _this;
    _classCallCheck(this, AbstractObservedTransactionMethod);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(AbstractObservedTransactionMethod).call(this, rpcMethod, parametersAmount, utils, formatters, moduleInstance));
    _this.transactionObserver = transactionObserver;
    _this.promiEvent = new PromiEvent();
    return _this;
  }
  _createClass(AbstractObservedTransactionMethod, [{
    key: "execute",
    value: function execute() {
      var _this2 = this;
      this.beforeExecution(this.moduleInstance);
      this.moduleInstance.currentProvider.send(this.rpcMethod, this.parameters).then(function (transactionHash) {
        var confirmations, receipt;
        if (_this2.callback) {
          _this2.callback(false, transactionHash);
          return;
        }
        _this2.promiEvent.emit('transactionHash', transactionHash);
        var transactionConfirmationSubscription = _this2.transactionObserver.observe(transactionHash).subscribe(function (transactionConfirmation) {
          confirmations = transactionConfirmation.confirmations;
          receipt = transactionConfirmation.receipt;
          if (!receipt.status) {
            if (_this2.parameters[0].gas === receipt.gasUsed) {
              _this2.handleError(new Error("Transaction ran out of gas. Please provide more gas:\n".concat(JSON.stringify(receipt, null, 2))), receipt, confirmations);
              transactionConfirmationSubscription.unsubscribe();
              return;
            }
            _this2.handleError(new Error("Transaction has been reverted by the EVM:\n".concat(JSON.stringify(receipt, null, 2))), receipt, confirmations);
            transactionConfirmationSubscription.unsubscribe();
            return;
          }
          _this2.promiEvent.emit('confirmation', confirmations, _this2.afterExecution(receipt));
        }, function (error) {
          _this2.handleError(error, receipt, confirmations);
        }, function () {
          if (_this2.promiEvent.listenerCount('receipt') > 0) {
            _this2.promiEvent.emit('receipt', _this2.afterExecution(receipt));
            _this2.promiEvent.removeAllListeners();
            return;
          }
          _this2.promiEvent.resolve(_this2.afterExecution(receipt));
        });
      }).catch(function (error) {
        if (_this2.callback) {
          _this2.callback(error, null);
          return;
        }
        _this2.handleError(error, false, 0);
      });
      return this.promiEvent;
    }
  }, {
    key: "handleError",
    value: function handleError(error, receipt, confirmations) {
      if (this.promiEvent.listenerCount('error') > 0) {
        this.promiEvent.emit('error', error, receipt, confirmations);
        this.promiEvent.removeAllListeners();
        return;
      }
      this.promiEvent.reject(error);
    }
  }], [{
    key: "Type",
    get: function get() {
      return 'observed-transaction-method';
    }
  }]);
  return AbstractObservedTransactionMethod;
}(AbstractMethod);

var SendRawTransactionMethod =
function (_AbstractObservedTran) {
  _inherits(SendRawTransactionMethod, _AbstractObservedTran);
  function SendRawTransactionMethod(utils, formatters, moduleInstance, transactionObserver) {
    _classCallCheck(this, SendRawTransactionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(SendRawTransactionMethod).call(this, 'eth_sendRawTransaction', 1, utils, formatters, moduleInstance, transactionObserver));
  }
  return SendRawTransactionMethod;
}(AbstractObservedTransactionMethod);

var ChainIdMethod =
function (_AbstractMethod) {
  _inherits(ChainIdMethod, _AbstractMethod);
  function ChainIdMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, ChainIdMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(ChainIdMethod).call(this, 'eth_chainId', 0, utils, formatters, moduleInstance));
  }
  _createClass(ChainIdMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return ChainIdMethod;
}(AbstractMethod);

var AbstractMethodFactory =
function () {
  function AbstractMethodFactory(utils, formatters) {
    _classCallCheck(this, AbstractMethodFactory);
    this.utils = utils;
    this.formatters = formatters;
    this._methods = null;
  }
  _createClass(AbstractMethodFactory, [{
    key: "hasMethod",
    value: function hasMethod(name) {
      return typeof this.methods[name] !== 'undefined';
    }
  }, {
    key: "createMethod",
    value: function createMethod(name, moduleInstance) {
      var method = this.methods[name];
      if (method.Type === 'observed-transaction-method') {
        return new method(this.utils, this.formatters, moduleInstance, this.createTransactionObserver(moduleInstance));
      }
      if (method.Type === 'eth-send-transaction-method') {
        var transactionObserver = this.createTransactionObserver(moduleInstance);
        return new method(this.utils, this.formatters, moduleInstance, transactionObserver, new ChainIdMethod(this.utils, this.formatters, moduleInstance), new GetTransactionCountMethod(this.utils, this.formatters, moduleInstance), new SendRawTransactionMethod(this.utils, this.formatters, moduleInstance, transactionObserver));
      }
      return new method(this.utils, this.formatters, moduleInstance);
    }
  }, {
    key: "getTimeout",
    value: function getTimeout(moduleInstance) {
      var timeout = moduleInstance.transactionBlockTimeout;
      if (!moduleInstance.currentProvider.SOCKET_MESSAGE) {
        timeout = moduleInstance.transactionPollingTimeout;
      }
      return timeout;
    }
  }, {
    key: "createTransactionObserver",
    value: function createTransactionObserver(moduleInstance) {
      return new TransactionObserver(moduleInstance.currentProvider, this.getTimeout(moduleInstance), moduleInstance.transactionConfirmationBlocks, new GetTransactionReceiptMethod(this.utils, this.formatters, moduleInstance), new GetBlockByNumberMethod(this.utils, this.formatters, moduleInstance), new web3CoreSubscriptions.NewHeadsSubscription(this.utils, this.formatters, moduleInstance));
    }
  }, {
    key: "methods",
    get: function get() {
      if (this._methods) {
        return this._methods;
      }
      throw new Error('No methods defined for MethodFactory!');
    }
    ,
    set: function set(value) {
      this._methods = value;
    }
  }]);
  return AbstractMethodFactory;
}();

var MethodProxy =
function MethodProxy(target, methodFactory) {
  _classCallCheck(this, MethodProxy);
  return new Proxy(target, {
    get: function get(target, name) {
      if (methodFactory.hasMethod(name)) {
        var anonymousFunction = function anonymousFunction() {
          method.setArguments(arguments);
          return method.execute();
        };
        if (typeof target[name] !== 'undefined') {
          throw new TypeError("Duplicated method ".concat(name, ". This method is defined as RPC call and as Object method."));
        }
        var method = methodFactory.createMethod(name, target);
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
};

var GetProtocolVersionMethod =
function (_AbstractMethod) {
  _inherits(GetProtocolVersionMethod, _AbstractMethod);
  function GetProtocolVersionMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetProtocolVersionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetProtocolVersionMethod).call(this, 'eth_protocolVersion', 0, utils, formatters, moduleInstance));
  }
  return GetProtocolVersionMethod;
}(AbstractMethod);

var VersionMethod =
function (_AbstractMethod) {
  _inherits(VersionMethod, _AbstractMethod);
  function VersionMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, VersionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(VersionMethod).call(this, 'net_version', 0, utils, formatters, moduleInstance));
  }
  _createClass(VersionMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return VersionMethod;
}(AbstractMethod);

var ListeningMethod =
function (_AbstractMethod) {
  _inherits(ListeningMethod, _AbstractMethod);
  function ListeningMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, ListeningMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(ListeningMethod).call(this, 'net_listening', 0, utils, formatters, moduleInstance));
  }
  return ListeningMethod;
}(AbstractMethod);

var PeerCountMethod =
function (_AbstractMethod) {
  _inherits(PeerCountMethod, _AbstractMethod);
  function PeerCountMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, PeerCountMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(PeerCountMethod).call(this, 'net_peerCount', 0, utils, formatters, moduleInstance));
  }
  _createClass(PeerCountMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return PeerCountMethod;
}(AbstractMethod);

var GetNodeInfoMethod =
function (_AbstractMethod) {
  _inherits(GetNodeInfoMethod, _AbstractMethod);
  function GetNodeInfoMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetNodeInfoMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetNodeInfoMethod).call(this, 'web3_clientVersion', 0, utils, formatters, moduleInstance));
  }
  return GetNodeInfoMethod;
}(AbstractMethod);

var GetCoinbaseMethod =
function (_AbstractMethod) {
  _inherits(GetCoinbaseMethod, _AbstractMethod);
  function GetCoinbaseMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetCoinbaseMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetCoinbaseMethod).call(this, 'eth_coinbase', 0, utils, formatters, moduleInstance));
  }
  return GetCoinbaseMethod;
}(AbstractMethod);

var IsMiningMethod =
function (_AbstractMethod) {
  _inherits(IsMiningMethod, _AbstractMethod);
  function IsMiningMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, IsMiningMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(IsMiningMethod).call(this, 'eth_mining', 0, utils, formatters, moduleInstance));
  }
  return IsMiningMethod;
}(AbstractMethod);

var GetHashrateMethod =
function (_AbstractMethod) {
  _inherits(GetHashrateMethod, _AbstractMethod);
  function GetHashrateMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetHashrateMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetHashrateMethod).call(this, 'eth_hashrate', 0, utils, formatters, moduleInstance));
  }
  _createClass(GetHashrateMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return GetHashrateMethod;
}(AbstractMethod);

var IsSyncingMethod =
function (_AbstractMethod) {
  _inherits(IsSyncingMethod, _AbstractMethod);
  function IsSyncingMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, IsSyncingMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(IsSyncingMethod).call(this, 'eth_syncing', 0, utils, formatters, moduleInstance));
  }
  _createClass(IsSyncingMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      if (typeof response !== 'boolean') {
        return this.formatters.outputSyncingFormatter(response);
      }
      return response;
    }
  }]);
  return IsSyncingMethod;
}(AbstractMethod);

var GetGasPriceMethod =
function (_AbstractMethod) {
  _inherits(GetGasPriceMethod, _AbstractMethod);
  function GetGasPriceMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetGasPriceMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetGasPriceMethod).call(this, 'eth_gasPrice', 0, utils, formatters, moduleInstance));
  }
  _createClass(GetGasPriceMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.formatters.outputBigNumberFormatter(response);
    }
  }]);
  return GetGasPriceMethod;
}(AbstractMethod);

var SubmitWorkMethod =
function (_AbstractMethod) {
  _inherits(SubmitWorkMethod, _AbstractMethod);
  function SubmitWorkMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, SubmitWorkMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(SubmitWorkMethod).call(this, 'eth_submitWork', 3, utils, formatters, moduleInstance));
  }
  return SubmitWorkMethod;
}(AbstractMethod);

var GetWorkMethod =
function (_AbstractMethod) {
  _inherits(GetWorkMethod, _AbstractMethod);
  function GetWorkMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetWorkMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetWorkMethod).call(this, 'eth_getWork', 0, utils, formatters, moduleInstance));
  }
  return GetWorkMethod;
}(AbstractMethod);

var GetAccountsMethod =
function (_AbstractMethod) {
  _inherits(GetAccountsMethod, _AbstractMethod);
  function GetAccountsMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetAccountsMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetAccountsMethod).call(this, 'eth_accounts', 0, utils, formatters, moduleInstance));
  }
  _createClass(GetAccountsMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      var _this = this;
      return response.map(function (responseItem) {
        return _this.utils.toChecksumAddress(responseItem);
      });
    }
  }]);
  return GetAccountsMethod;
}(AbstractMethod);

var GetBalanceMethod =
function (_AbstractMethod) {
  _inherits(GetBalanceMethod, _AbstractMethod);
  function GetBalanceMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBalanceMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBalanceMethod).call(this, 'eth_getBalance', 2, utils, formatters, moduleInstance));
  }
  _createClass(GetBalanceMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
      if (isFunction(this.parameters[1])) {
        this.callback = this.parameters[1];
        this.parameters[1] = moduleInstance.defaultBlock;
      }
      this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.formatters.outputBigNumberFormatter(response);
    }
  }]);
  return GetBalanceMethod;
}(AbstractMethod);

var RequestAccountsMethod =
function (_AbstractMethod) {
  _inherits(RequestAccountsMethod, _AbstractMethod);
  function RequestAccountsMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, RequestAccountsMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(RequestAccountsMethod).call(this, 'eth_requestAccounts', 0, utils, formatters, moduleInstance));
  }
  return RequestAccountsMethod;
}(AbstractMethod);

var AbstractGetUncleMethod =
function (_AbstractMethod) {
  _inherits(AbstractGetUncleMethod, _AbstractMethod);
  function AbstractGetUncleMethod(rpcMethod, utils, formatters, moduleInstance) {
    _classCallCheck(this, AbstractGetUncleMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(AbstractGetUncleMethod).call(this, rpcMethod, 2, utils, formatters, moduleInstance));
  }
  _createClass(AbstractGetUncleMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
      this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.formatters.outputBlockFormatter(response);
    }
  }]);
  return AbstractGetUncleMethod;
}(AbstractMethod);

var AbstractGetBlockTransactionCountMethod =
function (_AbstractMethod) {
  _inherits(AbstractGetBlockTransactionCountMethod, _AbstractMethod);
  function AbstractGetBlockTransactionCountMethod(rpcMethod, utils, formatters, moduleInstance) {
    _classCallCheck(this, AbstractGetBlockTransactionCountMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(AbstractGetBlockTransactionCountMethod).call(this, rpcMethod, 1, utils, formatters, moduleInstance));
  }
  _createClass(AbstractGetBlockTransactionCountMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return AbstractGetBlockTransactionCountMethod;
}(AbstractMethod);

var AbstractGetBlockUncleCountMethod =
function (_AbstractMethod) {
  _inherits(AbstractGetBlockUncleCountMethod, _AbstractMethod);
  function AbstractGetBlockUncleCountMethod(rpcMethod, utils, formatters, moduleInstance) {
    _classCallCheck(this, AbstractGetBlockUncleCountMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(AbstractGetBlockUncleCountMethod).call(this, rpcMethod, 1, utils, formatters, moduleInstance));
  }
  _createClass(AbstractGetBlockUncleCountMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return AbstractGetBlockUncleCountMethod;
}(AbstractMethod);

var GetBlockByHashMethod =
function (_AbstractGetBlockMeth) {
  _inherits(GetBlockByHashMethod, _AbstractGetBlockMeth);
  function GetBlockByHashMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBlockByHashMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockByHashMethod).call(this, 'eth_getBlockByHash', utils, formatters, moduleInstance));
  }
  return GetBlockByHashMethod;
}(AbstractGetBlockMethod);

var GetBlockNumberMethod =
function (_AbstractMethod) {
  _inherits(GetBlockNumberMethod, _AbstractMethod);
  function GetBlockNumberMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBlockNumberMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockNumberMethod).call(this, 'eth_blockNumber', 0, utils, formatters, moduleInstance));
  }
  _createClass(GetBlockNumberMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return GetBlockNumberMethod;
}(AbstractMethod);

var GetBlockTransactionCountByHashMethod =
function (_AbstractGetBlockTran) {
  _inherits(GetBlockTransactionCountByHashMethod, _AbstractGetBlockTran);
  function GetBlockTransactionCountByHashMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBlockTransactionCountByHashMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockTransactionCountByHashMethod).call(this, 'eth_getBlockTransactionCountByHash', utils, formatters, moduleInstance));
  }
  return GetBlockTransactionCountByHashMethod;
}(AbstractGetBlockTransactionCountMethod);

var GetBlockTransactionCountByNumberMethod =
function (_AbstractGetBlockTran) {
  _inherits(GetBlockTransactionCountByNumberMethod, _AbstractGetBlockTran);
  function GetBlockTransactionCountByNumberMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBlockTransactionCountByNumberMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockTransactionCountByNumberMethod).call(this, 'eth_getBlockTransactionCountByNumber', utils, formatters, moduleInstance));
  }
  return GetBlockTransactionCountByNumberMethod;
}(AbstractGetBlockTransactionCountMethod);

var GetBlockUncleCountByBlockHashMethod =
function (_AbstractGetBlockUncl) {
  _inherits(GetBlockUncleCountByBlockHashMethod, _AbstractGetBlockUncl);
  function GetBlockUncleCountByBlockHashMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBlockUncleCountByBlockHashMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockUncleCountByBlockHashMethod).call(this, 'eth_getUncleCountByBlockHash', utils, formatters, moduleInstance));
  }
  return GetBlockUncleCountByBlockHashMethod;
}(AbstractGetBlockUncleCountMethod);

var GetBlockUncleCountByBlockNumberMethod =
function (_AbstractGetBlockUncl) {
  _inherits(GetBlockUncleCountByBlockNumberMethod, _AbstractGetBlockUncl);
  function GetBlockUncleCountByBlockNumberMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetBlockUncleCountByBlockNumberMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockUncleCountByBlockNumberMethod).call(this, 'eth_getUncleCountByBlockNumber', utils, formatters, moduleInstance));
  }
  return GetBlockUncleCountByBlockNumberMethod;
}(AbstractGetBlockUncleCountMethod);

var GetUncleByBlockHashAndIndexMethod =
function (_AbstractGetUncleMeth) {
  _inherits(GetUncleByBlockHashAndIndexMethod, _AbstractGetUncleMeth);
  function GetUncleByBlockHashAndIndexMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetUncleByBlockHashAndIndexMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetUncleByBlockHashAndIndexMethod).call(this, 'eth_getUncleByBlockHashAndIndex', utils, formatters, moduleInstance));
  }
  return GetUncleByBlockHashAndIndexMethod;
}(AbstractGetUncleMethod);

var GetUncleByBlockNumberAndIndexMethod =
function (_AbstractGetUncleMeth) {
  _inherits(GetUncleByBlockNumberAndIndexMethod, _AbstractGetUncleMeth);
  function GetUncleByBlockNumberAndIndexMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetUncleByBlockNumberAndIndexMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetUncleByBlockNumberAndIndexMethod).call(this, 'eth_getUncleByBlockNumberAndIndex', utils, formatters, moduleInstance));
  }
  return GetUncleByBlockNumberAndIndexMethod;
}(AbstractGetUncleMethod);

var AbstractGetTransactionFromBlockMethod =
function (_AbstractMethod) {
  _inherits(AbstractGetTransactionFromBlockMethod, _AbstractMethod);
  function AbstractGetTransactionFromBlockMethod(rpcMethod, utils, formatters, moduleInstance) {
    _classCallCheck(this, AbstractGetTransactionFromBlockMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(AbstractGetTransactionFromBlockMethod).call(this, rpcMethod, 2, utils, formatters, moduleInstance));
  }
  _createClass(AbstractGetTransactionFromBlockMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
      this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.formatters.outputTransactionFormatter(response);
    }
  }]);
  return AbstractGetTransactionFromBlockMethod;
}(AbstractMethod);

var SendTransactionMethod =
function (_AbstractObservedTran) {
  _inherits(SendTransactionMethod, _AbstractObservedTran);
  function SendTransactionMethod(utils, formatters, moduleInstance, transactionObserver) {
    _classCallCheck(this, SendTransactionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(SendTransactionMethod).call(this, 'eth_sendTransaction', 1, utils, formatters, moduleInstance, transactionObserver));
  }
  _createClass(SendTransactionMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
    }
  }]);
  return SendTransactionMethod;
}(AbstractObservedTransactionMethod);

var EthSendTransactionMethod =
function (_SendTransactionMetho) {
  _inherits(EthSendTransactionMethod, _SendTransactionMetho);
  function EthSendTransactionMethod(utils, formatters, moduleInstance, transactionObserver, chainIdMethod, getTransactionCountMethod, sendRawTransactionMethod) {
    var _this;
    _classCallCheck(this, EthSendTransactionMethod);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(EthSendTransactionMethod).call(this, utils, formatters, moduleInstance, transactionObserver));
    _this.chainIdMethod = chainIdMethod;
    _this.getTransactionCountMethod = getTransactionCountMethod;
    _this.sendRawTransactionMethod = sendRawTransactionMethod;
    return _this;
  }
  _createClass(EthSendTransactionMethod, [{
    key: "execute",
    value: function execute() {
      var _this2 = this;
      if (!this.parameters[0].gas && this.moduleInstance.defaultGas) {
        this.parameters[0]['gas'] = this.moduleInstance.defaultGas;
      }
      if (!this.parameters[0].gasPrice && this.parameters[0].gasPrice !== 0) {
        if (!this.moduleInstance.defaultGasPrice) {
          this.moduleInstance.currentProvider.send('eth_gasPrice', []).then(function (gasPrice) {
            _this2.parameters[0].gasPrice = gasPrice;
            _this2.execute();
          }).catch(function (error) {
            _this2.handleError(error, false, 0);
          });
          return this.promiEvent;
        }
        this.parameters[0]['gasPrice'] = this.moduleInstance.defaultGasPrice;
      }
      if (this.hasAccounts() && this.isDefaultSigner()) {
        if (this.moduleInstance.accounts.wallet[this.parameters[0].from]) {
          this.sendRawTransaction(this.moduleInstance.accounts.wallet[this.parameters[0].from].privateKey).catch(function (error) {
            _this2.handleError(error, false, 0);
          });
          return this.promiEvent;
        }
      }
      if (this.hasCustomSigner()) {
        this.sendRawTransaction().catch(function (error) {
          _this2.handleError(error, false, 0);
        });
        return this.promiEvent;
      }
      return _get(_getPrototypeOf(EthSendTransactionMethod.prototype), "execute", this).call(this);
    }
  }, {
    key: "sendRawTransaction",
    value: function () {
      var _sendRawTransaction = _asyncToGenerator(
      _regeneratorRuntime.mark(function _callee() {
        var privateKey,
            transaction,
            response,
            _args = arguments;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                privateKey = _args.length > 0 && _args[0] !== undefined ? _args[0] : null;
                if (this.parameters[0].chainId) {
                  _context.next = 5;
                  break;
                }
                _context.next = 4;
                return this.chainIdMethod.execute();
              case 4:
                this.parameters[0].chainId = _context.sent;
              case 5:
                if (!(!this.parameters[0].nonce && this.parameters[0].nonce !== 0)) {
                  _context.next = 10;
                  break;
                }
                this.getTransactionCountMethod.parameters = [this.parameters[0].from];
                _context.next = 9;
                return this.getTransactionCountMethod.execute();
              case 9:
                this.parameters[0].nonce = _context.sent;
              case 10:
                transaction = this.formatters.inputCallFormatter(this.parameters[0], this.moduleInstance);
                transaction.to = transaction.to || '0x';
                transaction.data = transaction.data || '0x';
                transaction.value = transaction.value || '0x';
                transaction.chainId = this.utils.numberToHex(transaction.chainId);
                delete transaction.from;
                _context.next = 18;
                return this.moduleInstance.transactionSigner.sign(transaction, privateKey);
              case 18:
                response = _context.sent;
                this.sendRawTransactionMethod.parameters = [response.rawTransaction];
                this.sendRawTransactionMethod.callback = this.callback;
                this.sendRawTransactionMethod.promiEvent = this.promiEvent;
                return _context.abrupt("return", this.sendRawTransactionMethod.execute());
              case 23:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function sendRawTransaction() {
        return _sendRawTransaction.apply(this, arguments);
      }
      return sendRawTransaction;
    }()
  }, {
    key: "isDefaultSigner",
    value: function isDefaultSigner() {
      return this.moduleInstance.transactionSigner.constructor.name === 'TransactionSigner';
    }
  }, {
    key: "hasAccounts",
    value: function hasAccounts() {
      return this.moduleInstance.accounts && this.moduleInstance.accounts.wallet.accountsIndex > 0;
    }
  }, {
    key: "hasCustomSigner",
    value: function hasCustomSigner() {
      return this.moduleInstance.transactionSigner.constructor.name !== 'TransactionSigner';
    }
  }], [{
    key: "Type",
    get: function get() {
      return 'eth-send-transaction-method';
    }
  }]);
  return EthSendTransactionMethod;
}(SendTransactionMethod);

var GetTransactionMethod =
function (_AbstractMethod) {
  _inherits(GetTransactionMethod, _AbstractMethod);
  function GetTransactionMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetTransactionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionMethod).call(this, 'eth_getTransactionByHash', 1, utils, formatters, moduleInstance));
  }
  _createClass(GetTransactionMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.formatters.outputTransactionFormatter(response);
    }
  }]);
  return GetTransactionMethod;
}(AbstractMethod);

var GetTransactionByBlockHashAndIndexMethod =
function (_AbstractGetTransacti) {
  _inherits(GetTransactionByBlockHashAndIndexMethod, _AbstractGetTransacti);
  function GetTransactionByBlockHashAndIndexMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetTransactionByBlockHashAndIndexMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionByBlockHashAndIndexMethod).call(this, 'eth_getTransactionByBlockHashAndIndex', utils, formatters, moduleInstance));
  }
  return GetTransactionByBlockHashAndIndexMethod;
}(AbstractGetTransactionFromBlockMethod);

var GetTransactionByBlockNumberAndIndexMethod =
function (_AbstractGetTransacti) {
  _inherits(GetTransactionByBlockNumberAndIndexMethod, _AbstractGetTransacti);
  function GetTransactionByBlockNumberAndIndexMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetTransactionByBlockNumberAndIndexMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionByBlockNumberAndIndexMethod).call(this, 'eth_getTransactionByBlockNumberAndIndex', utils, formatters, moduleInstance));
  }
  return GetTransactionByBlockNumberAndIndexMethod;
}(AbstractGetTransactionFromBlockMethod);

var SignTransactionMethod =
function (_AbstractMethod) {
  _inherits(SignTransactionMethod, _AbstractMethod);
  function SignTransactionMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, SignTransactionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(SignTransactionMethod).call(this, 'eth_signTransaction', 1, utils, formatters, moduleInstance));
  }
  _createClass(SignTransactionMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
    }
  }]);
  return SignTransactionMethod;
}(AbstractMethod);

var GetCodeMethod =
function (_AbstractMethod) {
  _inherits(GetCodeMethod, _AbstractMethod);
  function GetCodeMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetCodeMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetCodeMethod).call(this, 'eth_getCode', 2, utils, formatters, moduleInstance));
  }
  _createClass(GetCodeMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
      if (isFunction(this.parameters[1])) {
        this.callback = this.parameters[1];
        this.parameters[1] = moduleInstance.defaultBlock;
      }
      this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
    }
  }]);
  return GetCodeMethod;
}(AbstractMethod);

var SignMethod =
function (_AbstractMethod) {
  _inherits(SignMethod, _AbstractMethod);
  function SignMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, SignMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(SignMethod).call(this, 'eth_sign', 2, utils, formatters, moduleInstance));
  }
  _createClass(SignMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
      this.parameters[1] = this.formatters.inputAddressFormatter(this.parameters[1]);
      this.parameters.reverse();
    }
  }]);
  return SignMethod;
}(AbstractMethod);

var CallMethod =
function (_AbstractMethod) {
  _inherits(CallMethod, _AbstractMethod);
  function CallMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, CallMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(CallMethod).call(this, 'eth_call', 2, utils, formatters, moduleInstance));
  }
  _createClass(CallMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputCallFormatter(this.parameters[0], moduleInstance);
      if (isFunction(this.parameters[1])) {
        this.callback = this.parameters[1];
        this.parameters[1] = moduleInstance.defaultBlock;
      }
      this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
    }
  }]);
  return CallMethod;
}(AbstractMethod);

var GetStorageAtMethod =
function (_AbstractMethod) {
  _inherits(GetStorageAtMethod, _AbstractMethod);
  function GetStorageAtMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetStorageAtMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetStorageAtMethod).call(this, 'eth_getStorageAt', 3, utils, formatters, moduleInstance));
  }
  _createClass(GetStorageAtMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
      this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
      if (isFunction(this.parameters[2])) {
        this.callback = this.parameters[2];
        this.parameters[2] = moduleInstance.defaultBlock;
      }
      this.parameters[2] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[2], moduleInstance);
    }
  }]);
  return GetStorageAtMethod;
}(AbstractMethod);

var EstimateGasMethod =
function (_AbstractMethod) {
  _inherits(EstimateGasMethod, _AbstractMethod);
  function EstimateGasMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, EstimateGasMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(EstimateGasMethod).call(this, 'eth_estimateGas', 1, utils, formatters, moduleInstance));
  }
  _createClass(EstimateGasMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputCallFormatter(this.parameters[0], moduleInstance);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.hexToNumber(response);
    }
  }]);
  return EstimateGasMethod;
}(AbstractMethod);

var GetPastLogsMethod =
function (_AbstractMethod) {
  _inherits(GetPastLogsMethod, _AbstractMethod);
  function GetPastLogsMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetPastLogsMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetPastLogsMethod).call(this, 'eth_getLogs', 1, utils, formatters, moduleInstance));
  }
  _createClass(GetPastLogsMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputLogFormatter(this.parameters[0]);
    }
  }, {
    key: "afterExecution",
    value: function afterExecution(response) {
      var _this = this;
      return response.map(function (responseItem) {
        return _this.formatters.outputLogFormatter(responseItem);
      });
    }
  }]);
  return GetPastLogsMethod;
}(AbstractMethod);

var EcRecoverMethod =
function (_AbstractMethod) {
  _inherits(EcRecoverMethod, _AbstractMethod);
  function EcRecoverMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, EcRecoverMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(EcRecoverMethod).call(this, 'personal_ecRecover', 2, utils, formatters, moduleInstance));
  }
  _createClass(EcRecoverMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
    }
  }]);
  return EcRecoverMethod;
}(AbstractMethod);

var ImportRawKeyMethod =
function (_AbstractMethod) {
  _inherits(ImportRawKeyMethod, _AbstractMethod);
  function ImportRawKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, ImportRawKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(ImportRawKeyMethod).call(this, 'personal_importRawKey', 2, utils, formatters, moduleInstance));
  }
  return ImportRawKeyMethod;
}(AbstractMethod);

var ListAccountsMethod =
function (_AbstractMethod) {
  _inherits(ListAccountsMethod, _AbstractMethod);
  function ListAccountsMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, ListAccountsMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(ListAccountsMethod).call(this, 'personal_listAccounts', 0, utils, formatters, moduleInstance));
  }
  _createClass(ListAccountsMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      var _this = this;
      return response.map(function (responseItem) {
        return _this.utils.toChecksumAddress(responseItem);
      });
    }
  }]);
  return ListAccountsMethod;
}(AbstractMethod);

var LockAccountMethod =
function (_AbstractMethod) {
  _inherits(LockAccountMethod, _AbstractMethod);
  function LockAccountMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, LockAccountMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(LockAccountMethod).call(this, 'personal_lockAccount', 1, utils, formatters, moduleInstance));
  }
  _createClass(LockAccountMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
    }
  }]);
  return LockAccountMethod;
}(AbstractMethod);

var NewAccountMethod =
function (_AbstractMethod) {
  _inherits(NewAccountMethod, _AbstractMethod);
  function NewAccountMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, NewAccountMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(NewAccountMethod).call(this, 'personal_newAccount', 1, utils, formatters, moduleInstance));
  }
  _createClass(NewAccountMethod, [{
    key: "afterExecution",
    value: function afterExecution(response) {
      return this.utils.toChecksumAddress(response);
    }
  }]);
  return NewAccountMethod;
}(AbstractMethod);

var PersonalSendTransactionMethod =
function (_AbstractMethod) {
  _inherits(PersonalSendTransactionMethod, _AbstractMethod);
  function PersonalSendTransactionMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, PersonalSendTransactionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(PersonalSendTransactionMethod).call(this, 'personal_sendTransaction', 2, utils, formatters, moduleInstance));
  }
  _createClass(PersonalSendTransactionMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
    }
  }]);
  return PersonalSendTransactionMethod;
}(AbstractMethod);

var PersonalSignMethod =
function (_AbstractMethod) {
  _inherits(PersonalSignMethod, _AbstractMethod);
  function PersonalSignMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, PersonalSignMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(PersonalSignMethod).call(this, 'personal_sign', 3, utils, formatters, moduleInstance));
  }
  _createClass(PersonalSignMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
      this.parameters[1] = this.formatters.inputAddressFormatter(this.parameters[1]);
      if (isFunction(this.parameters[2])) {
        this.callback = this.parameters[2];
        delete this.parameters[2];
      }
    }
  }]);
  return PersonalSignMethod;
}(AbstractMethod);

var PersonalSignTransactionMethod =
function (_AbstractMethod) {
  _inherits(PersonalSignTransactionMethod, _AbstractMethod);
  function PersonalSignTransactionMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, PersonalSignTransactionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(PersonalSignTransactionMethod).call(this, 'personal_signTransaction', 2, utils, formatters, moduleInstance));
  }
  _createClass(PersonalSignTransactionMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
    }
  }]);
  return PersonalSignTransactionMethod;
}(AbstractMethod);

var UnlockAccountMethod =
function (_AbstractMethod) {
  _inherits(UnlockAccountMethod, _AbstractMethod);
  function UnlockAccountMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, UnlockAccountMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(UnlockAccountMethod).call(this, 'personal_unlockAccount', 3, utils, formatters, moduleInstance));
  }
  _createClass(UnlockAccountMethod, [{
    key: "beforeExecution",
    value: function beforeExecution(moduleInstance) {
      this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
    }
  }]);
  return UnlockAccountMethod;
}(AbstractMethod);

var AddPrivateKeyMethod =
function (_AbstractMethod) {
  _inherits(AddPrivateKeyMethod, _AbstractMethod);
  function AddPrivateKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, AddPrivateKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(AddPrivateKeyMethod).call(this, 'shh_addPrivateKey', 1, utils, formatters, moduleInstance));
  }
  return AddPrivateKeyMethod;
}(AbstractMethod);

var AddSymKeyMethod =
function (_AbstractMethod) {
  _inherits(AddSymKeyMethod, _AbstractMethod);
  function AddSymKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, AddSymKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(AddSymKeyMethod).call(this, 'shh_addSymKey', 1, utils, formatters, moduleInstance));
  }
  return AddSymKeyMethod;
}(AbstractMethod);

var DeleteKeyPairMethod =
function (_AbstractMethod) {
  _inherits(DeleteKeyPairMethod, _AbstractMethod);
  function DeleteKeyPairMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, DeleteKeyPairMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(DeleteKeyPairMethod).call(this, 'shh_deleteKeyPair', 1, utils, formatters, moduleInstance));
  }
  return DeleteKeyPairMethod;
}(AbstractMethod);

var DeleteMessageFilterMethod =
function (_AbstractMethod) {
  _inherits(DeleteMessageFilterMethod, _AbstractMethod);
  function DeleteMessageFilterMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, DeleteMessageFilterMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(DeleteMessageFilterMethod).call(this, 'shh_deleteMessageFilter', 1, utils, formatters, moduleInstance));
  }
  return DeleteMessageFilterMethod;
}(AbstractMethod);

var DeleteSymKeyMethod =
function (_AbstractMethod) {
  _inherits(DeleteSymKeyMethod, _AbstractMethod);
  function DeleteSymKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, DeleteSymKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(DeleteSymKeyMethod).call(this, 'shh_deleteSymKey', 1, utils, formatters, moduleInstance));
  }
  return DeleteSymKeyMethod;
}(AbstractMethod);

var GenerateSymKeyFromPasswordMethod =
function (_AbstractMethod) {
  _inherits(GenerateSymKeyFromPasswordMethod, _AbstractMethod);
  function GenerateSymKeyFromPasswordMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GenerateSymKeyFromPasswordMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GenerateSymKeyFromPasswordMethod).call(this, 'shh_generateSymKeyFromPassword', 1, utils, formatters, moduleInstance));
  }
  return GenerateSymKeyFromPasswordMethod;
}(AbstractMethod);

var GetFilterMessagesMethod =
function (_AbstractMethod) {
  _inherits(GetFilterMessagesMethod, _AbstractMethod);
  function GetFilterMessagesMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetFilterMessagesMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetFilterMessagesMethod).call(this, 'shh_getFilterMessages', 1, utils, formatters, moduleInstance));
  }
  return GetFilterMessagesMethod;
}(AbstractMethod);

var GetInfoMethod =
function (_AbstractMethod) {
  _inherits(GetInfoMethod, _AbstractMethod);
  function GetInfoMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetInfoMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetInfoMethod).call(this, 'shh_info', 0, utils, formatters, moduleInstance));
  }
  return GetInfoMethod;
}(AbstractMethod);

var GetPrivateKeyMethod =
function (_AbstractMethod) {
  _inherits(GetPrivateKeyMethod, _AbstractMethod);
  function GetPrivateKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetPrivateKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetPrivateKeyMethod).call(this, 'shh_getPrivateKey', 1, utils, formatters, moduleInstance));
  }
  return GetPrivateKeyMethod;
}(AbstractMethod);

var GetPublicKeyMethod =
function (_AbstractMethod) {
  _inherits(GetPublicKeyMethod, _AbstractMethod);
  function GetPublicKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetPublicKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetPublicKeyMethod).call(this, 'shh_getPublicKey', 1, utils, formatters, moduleInstance));
  }
  return GetPublicKeyMethod;
}(AbstractMethod);

var GetSymKeyMethod =
function (_AbstractMethod) {
  _inherits(GetSymKeyMethod, _AbstractMethod);
  function GetSymKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, GetSymKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(GetSymKeyMethod).call(this, 'shh_getSymKey', 1, utils, formatters, moduleInstance));
  }
  return GetSymKeyMethod;
}(AbstractMethod);

var HasKeyPairMethod =
function (_AbstractMethod) {
  _inherits(HasKeyPairMethod, _AbstractMethod);
  function HasKeyPairMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, HasKeyPairMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(HasKeyPairMethod).call(this, 'shh_hasKeyPair', 1, utils, formatters, moduleInstance));
  }
  return HasKeyPairMethod;
}(AbstractMethod);

var HasSymKeyMethod =
function (_AbstractMethod) {
  _inherits(HasSymKeyMethod, _AbstractMethod);
  function HasSymKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, HasSymKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(HasSymKeyMethod).call(this, 'shh_hasSymKey', 1, utils, formatters, moduleInstance));
  }
  return HasSymKeyMethod;
}(AbstractMethod);

var MarkTrustedPeerMethod =
function (_AbstractMethod) {
  _inherits(MarkTrustedPeerMethod, _AbstractMethod);
  function MarkTrustedPeerMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, MarkTrustedPeerMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(MarkTrustedPeerMethod).call(this, 'shh_markTrustedPeer', 1, utils, formatters, moduleInstance));
  }
  return MarkTrustedPeerMethod;
}(AbstractMethod);

var NewKeyPairMethod =
function (_AbstractMethod) {
  _inherits(NewKeyPairMethod, _AbstractMethod);
  function NewKeyPairMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, NewKeyPairMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(NewKeyPairMethod).call(this, 'shh_newKeyPair', 0, utils, formatters, moduleInstance));
  }
  return NewKeyPairMethod;
}(AbstractMethod);

var NewMessageFilterMethod =
function (_AbstractMethod) {
  _inherits(NewMessageFilterMethod, _AbstractMethod);
  function NewMessageFilterMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, NewMessageFilterMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(NewMessageFilterMethod).call(this, 'shh_newMessageFilter', 1, utils, formatters, moduleInstance));
  }
  return NewMessageFilterMethod;
}(AbstractMethod);

var NewSymKeyMethod =
function (_AbstractMethod) {
  _inherits(NewSymKeyMethod, _AbstractMethod);
  function NewSymKeyMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, NewSymKeyMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(NewSymKeyMethod).call(this, 'shh_newSymKey', 0, utils, formatters, moduleInstance));
  }
  return NewSymKeyMethod;
}(AbstractMethod);

var PostMethod =
function (_AbstractMethod) {
  _inherits(PostMethod, _AbstractMethod);
  function PostMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, PostMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(PostMethod).call(this, 'shh_post', 1, utils, formatters, moduleInstance));
  }
  return PostMethod;
}(AbstractMethod);

var SetMaxMessageSizeMethod =
function (_AbstractMethod) {
  _inherits(SetMaxMessageSizeMethod, _AbstractMethod);
  function SetMaxMessageSizeMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, SetMaxMessageSizeMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(SetMaxMessageSizeMethod).call(this, 'shh_setMaxMessageSize', 1, utils, formatters, moduleInstance));
  }
  return SetMaxMessageSizeMethod;
}(AbstractMethod);

var SetMinPoWMethod =
function (_AbstractMethod) {
  _inherits(SetMinPoWMethod, _AbstractMethod);
  function SetMinPoWMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, SetMinPoWMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(SetMinPoWMethod).call(this, 'shh_setMinPoW', 1, utils, formatters, moduleInstance));
  }
  return SetMinPoWMethod;
}(AbstractMethod);

var ShhVersionMethod =
function (_AbstractMethod) {
  _inherits(ShhVersionMethod, _AbstractMethod);
  function ShhVersionMethod(utils, formatters, moduleInstance) {
    _classCallCheck(this, ShhVersionMethod);
    return _possibleConstructorReturn(this, _getPrototypeOf(ShhVersionMethod).call(this, 'shh_version', 0, utils, formatters, moduleInstance));
  }
  return ShhVersionMethod;
}(AbstractMethod);

exports.PromiEvent = PromiEvent;
exports.AbstractMethodFactory = AbstractMethodFactory;
exports.AbstractMethod = AbstractMethod;
exports.MethodProxy = MethodProxy;
exports.TransactionObserver = TransactionObserver;
exports.GetProtocolVersionMethod = GetProtocolVersionMethod;
exports.VersionMethod = VersionMethod;
exports.ListeningMethod = ListeningMethod;
exports.PeerCountMethod = PeerCountMethod;
exports.ChainIdMethod = ChainIdMethod;
exports.GetNodeInfoMethod = GetNodeInfoMethod;
exports.GetCoinbaseMethod = GetCoinbaseMethod;
exports.IsMiningMethod = IsMiningMethod;
exports.GetHashrateMethod = GetHashrateMethod;
exports.IsSyncingMethod = IsSyncingMethod;
exports.GetGasPriceMethod = GetGasPriceMethod;
exports.SubmitWorkMethod = SubmitWorkMethod;
exports.GetWorkMethod = GetWorkMethod;
exports.GetAccountsMethod = GetAccountsMethod;
exports.GetBalanceMethod = GetBalanceMethod;
exports.GetTransactionCountMethod = GetTransactionCountMethod;
exports.RequestAccountsMethod = RequestAccountsMethod;
exports.AbstractGetBlockMethod = AbstractGetBlockMethod;
exports.AbstractGetUncleMethod = AbstractGetUncleMethod;
exports.AbstractGetBlockTransactionCountMethod = AbstractGetBlockTransactionCountMethod;
exports.AbstractGetBlockUncleCountMethod = AbstractGetBlockUncleCountMethod;
exports.GetBlockByHashMethod = GetBlockByHashMethod;
exports.GetBlockByNumberMethod = GetBlockByNumberMethod;
exports.GetBlockNumberMethod = GetBlockNumberMethod;
exports.GetBlockTransactionCountByHashMethod = GetBlockTransactionCountByHashMethod;
exports.GetBlockTransactionCountByNumberMethod = GetBlockTransactionCountByNumberMethod;
exports.GetBlockUncleCountByBlockHashMethod = GetBlockUncleCountByBlockHashMethod;
exports.GetBlockUncleCountByBlockNumberMethod = GetBlockUncleCountByBlockNumberMethod;
exports.GetUncleByBlockHashAndIndexMethod = GetUncleByBlockHashAndIndexMethod;
exports.GetUncleByBlockNumberAndIndexMethod = GetUncleByBlockNumberAndIndexMethod;
exports.AbstractGetTransactionFromBlockMethod = AbstractGetTransactionFromBlockMethod;
exports.AbstractObservedTransactionMethod = AbstractObservedTransactionMethod;
exports.EthSendTransactionMethod = EthSendTransactionMethod;
exports.GetTransactionMethod = GetTransactionMethod;
exports.GetTransactionByBlockHashAndIndexMethod = GetTransactionByBlockHashAndIndexMethod;
exports.GetTransactionByBlockNumberAndIndexMethod = GetTransactionByBlockNumberAndIndexMethod;
exports.GetTransactionReceiptMethod = GetTransactionReceiptMethod;
exports.SendRawTransactionMethod = SendRawTransactionMethod;
exports.SignTransactionMethod = SignTransactionMethod;
exports.SendTransactionMethod = SendTransactionMethod;
exports.GetCodeMethod = GetCodeMethod;
exports.SignMethod = SignMethod;
exports.CallMethod = CallMethod;
exports.GetStorageAtMethod = GetStorageAtMethod;
exports.EstimateGasMethod = EstimateGasMethod;
exports.GetPastLogsMethod = GetPastLogsMethod;
exports.EcRecoverMethod = EcRecoverMethod;
exports.ImportRawKeyMethod = ImportRawKeyMethod;
exports.ListAccountsMethod = ListAccountsMethod;
exports.LockAccountMethod = LockAccountMethod;
exports.NewAccountMethod = NewAccountMethod;
exports.PersonalSendTransactionMethod = PersonalSendTransactionMethod;
exports.PersonalSignMethod = PersonalSignMethod;
exports.PersonalSignTransactionMethod = PersonalSignTransactionMethod;
exports.UnlockAccountMethod = UnlockAccountMethod;
exports.AddPrivateKeyMethod = AddPrivateKeyMethod;
exports.AddSymKeyMethod = AddSymKeyMethod;
exports.DeleteKeyPairMethod = DeleteKeyPairMethod;
exports.DeleteMessageFilterMethod = DeleteMessageFilterMethod;
exports.DeleteSymKeyMethod = DeleteSymKeyMethod;
exports.GenerateSymKeyFromPasswordMethod = GenerateSymKeyFromPasswordMethod;
exports.GetFilterMessagesMethod = GetFilterMessagesMethod;
exports.GetInfoMethod = GetInfoMethod;
exports.GetPrivateKeyMethod = GetPrivateKeyMethod;
exports.GetPublicKeyMethod = GetPublicKeyMethod;
exports.GetSymKeyMethod = GetSymKeyMethod;
exports.HasKeyPairMethod = HasKeyPairMethod;
exports.HasSymKeyMethod = HasSymKeyMethod;
exports.MarkTrustedPeerMethod = MarkTrustedPeerMethod;
exports.NewKeyPairMethod = NewKeyPairMethod;
exports.NewMessageFilterMethod = NewMessageFilterMethod;
exports.NewSymKeyMethod = NewSymKeyMethod;
exports.PostMethod = PostMethod;
exports.SetMaxMessageSizeMethod = SetMaxMessageSizeMethod;
exports.SetMinPoWMethod = SetMinPoWMethod;
exports.ShhVersionMethod = ShhVersionMethod;
