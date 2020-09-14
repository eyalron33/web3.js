(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('web3-core-helpers'), require('web3-eth-accounts'), require('web3-eth-ens'), require('web3-eth-contract'), require('web3-eth-personal'), require('web3-eth-abi'), require('web3-eth-iban'), require('web3-net'), require('web3-utils'), require('ethereumjs-tx'), require('lodash/isString'), require('@babel/runtime/regenerator'), require('@babel/runtime/helpers/asyncToGenerator'), require('web3-core-subscriptions'), require('web3-core-method'), require('web3-providers'), require('@babel/runtime/helpers/classCallCheck'), require('@babel/runtime/helpers/createClass'), require('@babel/runtime/helpers/possibleConstructorReturn'), require('@babel/runtime/helpers/set'), require('@babel/runtime/helpers/getPrototypeOf'), require('@babel/runtime/helpers/get'), require('@babel/runtime/helpers/inherits'), require('web3-core')) :
    typeof define === 'function' && define.amd ? define(['exports', 'web3-core-helpers', 'web3-eth-accounts', 'web3-eth-ens', 'web3-eth-contract', 'web3-eth-personal', 'web3-eth-abi', 'web3-eth-iban', 'web3-net', 'web3-utils', 'ethereumjs-tx', 'lodash/isString', '@babel/runtime/regenerator', '@babel/runtime/helpers/asyncToGenerator', 'web3-core-subscriptions', 'web3-core-method', 'web3-providers', '@babel/runtime/helpers/classCallCheck', '@babel/runtime/helpers/createClass', '@babel/runtime/helpers/possibleConstructorReturn', '@babel/runtime/helpers/set', '@babel/runtime/helpers/getPrototypeOf', '@babel/runtime/helpers/get', '@babel/runtime/helpers/inherits', 'web3-core'], factory) :
    (factory((global.Web3Eth = {}),global.web3CoreHelpers,global.web3EthAccounts,global.web3EthEns,global.web3EthContract,global.web3EthPersonal,global.web3EthAbi,global.web3EthIban,global.web3Net,global.Utils,global.EthereumTx,global.isString,global._regeneratorRuntime,global._asyncToGenerator,global.web3CoreSubscriptions,global.web3CoreMethod,global.web3Providers,global._classCallCheck,global._createClass,global._possibleConstructorReturn,global._set,global._getPrototypeOf,global._get,global._inherits,global.web3Core));
}(this, (function (exports,web3CoreHelpers,web3EthAccounts,web3EthEns,web3EthContract,web3EthPersonal,web3EthAbi,web3EthIban,web3Net,Utils,EthereumTx,isString,_regeneratorRuntime,_asyncToGenerator,web3CoreSubscriptions,web3CoreMethod,web3Providers,_classCallCheck,_createClass,_possibleConstructorReturn,_set,_getPrototypeOf,_get,_inherits,web3Core) { 'use strict';

    EthereumTx = EthereumTx && EthereumTx.hasOwnProperty('default') ? EthereumTx['default'] : EthereumTx;
    isString = isString && isString.hasOwnProperty('default') ? isString['default'] : isString;
    _regeneratorRuntime = _regeneratorRuntime && _regeneratorRuntime.hasOwnProperty('default') ? _regeneratorRuntime['default'] : _regeneratorRuntime;
    _asyncToGenerator = _asyncToGenerator && _asyncToGenerator.hasOwnProperty('default') ? _asyncToGenerator['default'] : _asyncToGenerator;
    _classCallCheck = _classCallCheck && _classCallCheck.hasOwnProperty('default') ? _classCallCheck['default'] : _classCallCheck;
    _createClass = _createClass && _createClass.hasOwnProperty('default') ? _createClass['default'] : _createClass;
    _possibleConstructorReturn = _possibleConstructorReturn && _possibleConstructorReturn.hasOwnProperty('default') ? _possibleConstructorReturn['default'] : _possibleConstructorReturn;
    _set = _set && _set.hasOwnProperty('default') ? _set['default'] : _set;
    _getPrototypeOf = _getPrototypeOf && _getPrototypeOf.hasOwnProperty('default') ? _getPrototypeOf['default'] : _getPrototypeOf;
    _get = _get && _get.hasOwnProperty('default') ? _get['default'] : _get;
    _inherits = _inherits && _inherits.hasOwnProperty('default') ? _inherits['default'] : _inherits;

    var TransactionSigner =
    function () {
      function TransactionSigner(utils, formatters) {
        _classCallCheck(this, TransactionSigner);
        this.utils = utils;
        this.formatters = formatters;
      }
      _createClass(TransactionSigner, [{
        key: "sign",
        value: function () {
          var _sign = _asyncToGenerator(
          _regeneratorRuntime.mark(function _callee(transaction, privateKey) {
            var ethTx, validationResult, rlpEncoded, rawTransaction;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (privateKey) {
                      _context.next = 2;
                      break;
                    }
                    throw new Error('No privateKey given to the TransactionSigner.');
                  case 2:
                    if (privateKey.startsWith('0x')) {
                      privateKey = privateKey.substring(2);
                    }
                    ethTx = new EthereumTx(transaction);
                    ethTx.sign(Buffer.from(privateKey, 'hex'));
                    validationResult = ethTx.validate(true);
                    if (!(validationResult !== '')) {
                      _context.next = 8;
                      break;
                    }
                    throw new Error("TransactionSigner Error: ".concat(validationResult));
                  case 8:
                    rlpEncoded = ethTx.serialize().toString('hex');
                    rawTransaction = '0x' + rlpEncoded;
                    return _context.abrupt("return", {
                      messageHash: Buffer.from(ethTx.hash(false)).toString('hex'),
                      v: '0x' + Buffer.from(ethTx.v).toString('hex'),
                      r: '0x' + Buffer.from(ethTx.r).toString('hex'),
                      s: '0x' + Buffer.from(ethTx.s).toString('hex'),
                      rawTransaction: rawTransaction
                    });
                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));
          function sign(_x, _x2) {
            return _sign.apply(this, arguments);
          }
          return sign;
        }()
      }]);
      return TransactionSigner;
    }();

    var GetBlockMethod =
    function (_AbstractGetBlockMeth) {
      _inherits(GetBlockMethod, _AbstractGetBlockMeth);
      function GetBlockMethod(utils, formatters, moduleInstance) {
        _classCallCheck(this, GetBlockMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockMethod).call(this, 'eth_getBlockByNumber', utils, formatters, moduleInstance));
      }
      _createClass(GetBlockMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getBlockByHash';
          }
          _get(_getPrototypeOf(GetBlockMethod.prototype), "beforeExecution", this).call(this, moduleInstance);
        }
      }]);
      return GetBlockMethod;
    }(web3CoreMethod.AbstractGetBlockMethod);

    var GetUncleMethod =
    function (_AbstractGetUncleMeth) {
      _inherits(GetUncleMethod, _AbstractGetUncleMeth);
      function GetUncleMethod(utils, formatters, moduleInstance) {
        _classCallCheck(this, GetUncleMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetUncleMethod).call(this, 'eth_getUncleByBlockNumberAndIndex', utils, formatters, moduleInstance));
      }
      _createClass(GetUncleMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getUncleByBlockHashAndIndex';
          }
          _get(_getPrototypeOf(GetUncleMethod.prototype), "beforeExecution", this).call(this, moduleInstance);
        }
      }]);
      return GetUncleMethod;
    }(web3CoreMethod.AbstractGetUncleMethod);

    var GetBlockTransactionCountMethod =
    function (_AbstractGetBlockTran) {
      _inherits(GetBlockTransactionCountMethod, _AbstractGetBlockTran);
      function GetBlockTransactionCountMethod(utils, formatters, moduleInstance) {
        _classCallCheck(this, GetBlockTransactionCountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockTransactionCountMethod).call(this, 'eth_getBlockTransactionCountByNumber', utils, formatters, moduleInstance));
      }
      _createClass(GetBlockTransactionCountMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getBlockTransactionCountByHash';
          }
          _get(_getPrototypeOf(GetBlockTransactionCountMethod.prototype), "beforeExecution", this).call(this, moduleInstance);
        }
      }]);
      return GetBlockTransactionCountMethod;
    }(web3CoreMethod.AbstractGetBlockTransactionCountMethod);

    var GetBlockUncleCountMethod =
    function (_AbstractGetBlockUncl) {
      _inherits(GetBlockUncleCountMethod, _AbstractGetBlockUncl);
      function GetBlockUncleCountMethod(utils, formatters, moduleInstance) {
        _classCallCheck(this, GetBlockUncleCountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockUncleCountMethod).call(this, 'eth_getUncleCountByBlockNumber', utils, formatters, moduleInstance));
      }
      _createClass(GetBlockUncleCountMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getUncleCountByBlockHash';
          }
          _get(_getPrototypeOf(GetBlockUncleCountMethod.prototype), "beforeExecution", this).call(this, moduleInstance);
        }
      }]);
      return GetBlockUncleCountMethod;
    }(web3CoreMethod.AbstractGetBlockUncleCountMethod);

    var GetTransactionFromBlockMethod =
    function (_AbstractGetTransacti) {
      _inherits(GetTransactionFromBlockMethod, _AbstractGetTransacti);
      function GetTransactionFromBlockMethod(utils, formatters, moduleInstance) {
        _classCallCheck(this, GetTransactionFromBlockMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionFromBlockMethod).call(this, 'eth_getTransactionByBlockNumberAndIndex', utils, formatters, moduleInstance));
      }
      _createClass(GetTransactionFromBlockMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getTransactionByBlockHashAndIndex';
          }
          _get(_getPrototypeOf(GetTransactionFromBlockMethod.prototype), "beforeExecution", this).call(this, moduleInstance);
        }
      }]);
      return GetTransactionFromBlockMethod;
    }(web3CoreMethod.AbstractGetTransactionFromBlockMethod);

    var EthSignTransactionMethod =
    function (_SignTransactionMetho) {
      _inherits(EthSignTransactionMethod, _SignTransactionMetho);
      function EthSignTransactionMethod(utils, formatters, moduleInstance) {
        _classCallCheck(this, EthSignTransactionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(EthSignTransactionMethod).call(this, utils, formatters, moduleInstance));
      }
      _createClass(EthSignTransactionMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
        }
      }, {
        key: "execute",
        value: function execute() {
          if (isString(this.parameters[1])) {
            var account = this.moduleInstance.accounts.wallet[this.parameters[1]];
            if (account) {
              return this.moduleInstance.transactionSigner.sign(this.parameters[0], account.privateKey);
            }
          }
          return _get(_getPrototypeOf(EthSignTransactionMethod.prototype), "execute", this).call(this);
        }
      }]);
      return EthSignTransactionMethod;
    }(web3CoreMethod.SignTransactionMethod);

    var EthSignMethod =
    function (_SignMethod) {
      _inherits(EthSignMethod, _SignMethod);
      function EthSignMethod(utils, formatters, moduleInstance) {
        _classCallCheck(this, EthSignMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(EthSignMethod).call(this, utils, formatters, moduleInstance));
      }
      _createClass(EthSignMethod, [{
        key: "execute",
        value: function execute() {
          if (this.moduleInstance.accounts.wallet[this.parameters[1]]) {
            return this.signLocally();
          }
          return _get(_getPrototypeOf(EthSignMethod.prototype), "execute", this).call(this);
        }
      }, {
        key: "signLocally",
        value: function () {
          var _signLocally = _asyncToGenerator(
          _regeneratorRuntime.mark(function _callee() {
            var signedMessage;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.prev = 0;
                    this.beforeExecution(this.moduleInstance);
                    signedMessage = this.moduleInstance.accounts.sign(this.parameters[1], this.moduleInstance.accounts.wallet[this.parameters[0]].privateKey);
                    if (this.callback) {
                      this.callback(false, signedMessage);
                    }
                    return _context.abrupt("return", signedMessage);
                  case 7:
                    _context.prev = 7;
                    _context.t0 = _context["catch"](0);
                    if (this.callback) {
                      this.callback(_context.t0, null);
                    }
                    throw _context.t0;
                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this, [[0, 7]]);
          }));
          function signLocally() {
            return _signLocally.apply(this, arguments);
          }
          return signLocally;
        }()
      }]);
      return EthSignMethod;
    }(web3CoreMethod.SignMethod);

    var MethodFactory =
    function (_AbstractMethodFactor) {
      _inherits(MethodFactory, _AbstractMethodFactor);
      function MethodFactory(utils, formatters) {
        var _this;
        _classCallCheck(this, MethodFactory);
        _this = _possibleConstructorReturn(this, _getPrototypeOf(MethodFactory).call(this, utils, formatters));
        _this.methods = {
          getNodeInfo: web3CoreMethod.GetNodeInfoMethod,
          getProtocolVersion: web3CoreMethod.GetProtocolVersionMethod,
          getCoinbase: web3CoreMethod.GetCoinbaseMethod,
          isMining: web3CoreMethod.IsMiningMethod,
          getHashrate: web3CoreMethod.GetHashrateMethod,
          isSyncing: web3CoreMethod.IsSyncingMethod,
          getGasPrice: web3CoreMethod.GetGasPriceMethod,
          getAccounts: web3CoreMethod.GetAccountsMethod,
          getBlockNumber: web3CoreMethod.GetBlockNumberMethod,
          getBalance: web3CoreMethod.GetBalanceMethod,
          getStorageAt: web3CoreMethod.GetStorageAtMethod,
          getCode: web3CoreMethod.GetCodeMethod,
          getBlock: GetBlockMethod,
          getUncle: GetUncleMethod,
          getBlockTransactionCount: GetBlockTransactionCountMethod,
          getBlockUncleCount: GetBlockUncleCountMethod,
          getTransaction: web3CoreMethod.GetTransactionMethod,
          getTransactionFromBlock: GetTransactionFromBlockMethod,
          getTransactionReceipt: web3CoreMethod.GetTransactionReceiptMethod,
          getTransactionCount: web3CoreMethod.GetTransactionCountMethod,
          sendSignedTransaction: web3CoreMethod.SendRawTransactionMethod,
          signTransaction: EthSignTransactionMethod,
          sendTransaction: web3CoreMethod.EthSendTransactionMethod,
          sign: EthSignMethod,
          call: web3CoreMethod.CallMethod,
          estimateGas: web3CoreMethod.EstimateGasMethod,
          submitWork: web3CoreMethod.SubmitWorkMethod,
          getWork: web3CoreMethod.GetWorkMethod,
          getPastLogs: web3CoreMethod.GetPastLogsMethod,
          requestAccounts: web3CoreMethod.RequestAccountsMethod,
          getId: web3CoreMethod.VersionMethod,
          getChainId: web3CoreMethod.ChainIdMethod
        };
        return _this;
      }
      return MethodFactory;
    }(web3CoreMethod.AbstractMethodFactory);

    var SubscriptionsFactory =
    function () {
      function SubscriptionsFactory(utils, formatters) {
        _classCallCheck(this, SubscriptionsFactory);
        this.utils = utils;
        this.formatters = formatters;
      }
      _createClass(SubscriptionsFactory, [{
        key: "getSubscription",
        value: function getSubscription(moduleInstance, type, options) {
          switch (type) {
            case 'logs':
              return new web3CoreSubscriptions.LogSubscription(options, this.utils, this.formatters, moduleInstance, new web3CoreMethod.GetPastLogsMethod(this.utils, this.formatters, moduleInstance));
            case 'newBlockHeaders':
              return new web3CoreSubscriptions.NewHeadsSubscription(this.utils, this.formatters, moduleInstance);
            case 'pendingTransactions':
              return new web3CoreSubscriptions.NewPendingTransactionsSubscription(this.utils, this.formatters, moduleInstance);
            case 'syncing':
              return new web3CoreSubscriptions.SyncingSubscription(this.utils, this.formatters, moduleInstance);
            default:
              throw new Error("Unknown subscription: ".concat(type));
          }
        }
      }]);
      return SubscriptionsFactory;
    }();

    var Eth =
    function (_AbstractWeb3Module) {
      _inherits(Eth, _AbstractWeb3Module);
      function Eth(provider, methodFactory, net, accounts, personal, Iban, abiCoder, ens, utils, formatters, subscriptionsFactory, contractModuleFactory, options, nodeNet) {
        var _this;
        _classCallCheck(this, Eth);
        _this = _possibleConstructorReturn(this, _getPrototypeOf(Eth).call(this, provider, options, methodFactory, nodeNet));
        _this.net = net;
        _this.accounts = accounts;
        _this.personal = personal;
        _this.Iban = Iban;
        _this.abi = abiCoder;
        _this.ens = ens;
        _this.utils = utils;
        _this.formatters = formatters;
        _this.subscriptionsFactory = subscriptionsFactory;
        _this.contractModuleFactory = contractModuleFactory;
        _this.initiatedContracts = [];
        _this._transactionSigner = options.transactionSigner;
        _this.Contract = function (abi, address) {
          var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
          var contract = _this.contractModuleFactory.createContract(_this.currentProvider, _this.accounts, abi, address, {
            defaultAccount: options.from || options.defaultAccount || _this.defaultAccount,
            defaultBlock: options.defaultBlock || _this.defaultBlock,
            defaultGas: options.gas || options.defaultGas || _this.defaultGas,
            defaultGasPrice: options.gasPrice || options.defaultGasPrice || _this.defaultGasPrice,
            transactionBlockTimeout: options.transactionBlockTimeout || _this.transactionBlockTimeout,
            transactionConfirmationBlocks: options.transactionConfirmationBlocks || _this.transactionConfirmationBlocks,
            transactionPollingTimeout: options.transactionPollingTimeout || _this.transactionPollingTimeout,
            transactionSigner: _this.transactionSigner,
            data: options.data
          });
          _this.initiatedContracts.push(contract);
          return contract;
        };
        return _this;
      }
      _createClass(Eth, [{
        key: "clearSubscriptions",
        value: function clearSubscriptions() {
          return _get(_getPrototypeOf(Eth.prototype), "clearSubscriptions", this).call(this, 'eth_unsubscribe');
        }
      }, {
        key: "subscribe",
        value: function subscribe(type, options, callback) {
          return this.subscriptionsFactory.getSubscription(this, type, options).subscribe(callback);
        }
      }, {
        key: "setProvider",
        value: function setProvider(provider, net) {
          var setContractProviders = this.initiatedContracts.every(function (contract) {
            return contract.setProvider(provider, net);
          });
          return this.net.setProvider(provider, net) && this.personal.setProvider(provider, net) && _get(_getPrototypeOf(Eth.prototype), "setProvider", this).call(this, provider, net) && setContractProviders;
        }
      }, {
        key: "transactionSigner",
        get: function get() {
          return this._transactionSigner;
        }
        ,
        set: function set(transactionSigner) {
          this._transactionSigner = transactionSigner;
          this.accounts.transactionSigner = transactionSigner;
          this.ens.transactionSigner = transactionSigner;
          this.initiatedContracts.forEach(function (contract) {
            contract.transactionSigner = transactionSigner;
          });
        }
      }, {
        key: "defaultGasPrice",
        set: function set(value) {
          this.initiatedContracts.forEach(function (contract) {
            contract.defaultGasPrice = value;
          });
          this.net.defaultGasPrice = value;
          this.personal.defaultGasPrice = value;
          _set(_getPrototypeOf(Eth.prototype), "defaultGasPrice", value, this, true);
        }
        ,
        get: function get() {
          return _get(_getPrototypeOf(Eth.prototype), "defaultGasPrice", this);
        }
      }, {
        key: "defaultGas",
        set: function set(value) {
          this.initiatedContracts.forEach(function (contract) {
            contract.defaultGas = value;
          });
          this.net.defaultGas = value;
          this.personal.defaultGas = value;
          _set(_getPrototypeOf(Eth.prototype), "defaultGas", value, this, true);
        }
        ,
        get: function get() {
          return _get(_getPrototypeOf(Eth.prototype), "defaultGas", this);
        }
      }, {
        key: "transactionBlockTimeout",
        set: function set(value) {
          this.initiatedContracts.forEach(function (contract) {
            contract.transactionBlockTimeout = value;
          });
          this.net.transactionBlockTimeout = value;
          this.personal.transactionBlockTimeout = value;
          _set(_getPrototypeOf(Eth.prototype), "transactionBlockTimeout", value, this, true);
        }
        ,
        get: function get() {
          return _get(_getPrototypeOf(Eth.prototype), "transactionBlockTimeout", this);
        }
      }, {
        key: "transactionConfirmationBlocks",
        set: function set(value) {
          this.initiatedContracts.forEach(function (contract) {
            contract.transactionConfirmationBlocks = value;
          });
          this.net.transactionConfirmationBlocks = value;
          this.personal.transactionConfirmationBlocks = value;
          _set(_getPrototypeOf(Eth.prototype), "transactionConfirmationBlocks", value, this, true);
        }
        ,
        get: function get() {
          return _get(_getPrototypeOf(Eth.prototype), "transactionConfirmationBlocks", this);
        }
      }, {
        key: "transactionPollingTimeout",
        set: function set(value) {
          this.initiatedContracts.forEach(function (contract) {
            contract.transactionPollingTimeout = value;
          });
          this.net.transactionPollingTimeout = value;
          this.personal.transactionPollingTimeout = value;
          _set(_getPrototypeOf(Eth.prototype), "transactionPollingTimeout", value, this, true);
        }
        ,
        get: function get() {
          return _get(_getPrototypeOf(Eth.prototype), "transactionPollingTimeout", this);
        }
      }, {
        key: "defaultAccount",
        set: function set(value) {
          var _this2 = this;
          this.initiatedContracts.forEach(function (contract) {
            contract.defaultAccount = _this2.utils.toChecksumAddress(value);
          });
          this.net.defaultAccount = value;
          this.personal.defaultAccount = value;
          _set(_getPrototypeOf(Eth.prototype), "defaultAccount", value, this, true);
        }
        ,
        get: function get() {
          return _get(_getPrototypeOf(Eth.prototype), "defaultAccount", this);
        }
      }, {
        key: "defaultBlock",
        set: function set(value) {
          this.initiatedContracts.forEach(function (contract) {
            contract.defaultBlock = value;
          });
          this.net.defaultBlock = value;
          this.personal.defaultBlock = value;
          _set(_getPrototypeOf(Eth.prototype), "defaultBlock", value, this, true);
        }
        ,
        get: function get() {
          return _get(_getPrototypeOf(Eth.prototype), "defaultBlock", this);
        }
      }]);
      return Eth;
    }(web3Core.AbstractWeb3Module);

    function TransactionSigner$1() {
      return new TransactionSigner(Utils, web3CoreHelpers.formatters);
    }
    function Eth$1(provider) {
      var net = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      if (!options.transactionSigner) {
        options.transactionSigner = new TransactionSigner$1();
      }
      var resolvedProvider = new web3Providers.ProviderResolver().resolve(provider, net);
      var accounts = new web3EthAccounts.Accounts(resolvedProvider, null, options);
      var abiCoder = new web3EthAbi.AbiCoder();
      return new Eth(resolvedProvider, new MethodFactory(Utils, web3CoreHelpers.formatters), new web3Net.Network(resolvedProvider, null, options), accounts, new web3EthPersonal.Personal(resolvedProvider, null, accounts, options), web3EthIban.Iban, abiCoder, new web3EthEns.Ens(resolvedProvider, null, accounts, options), Utils, web3CoreHelpers.formatters, new SubscriptionsFactory(Utils, web3CoreHelpers.formatters), new web3EthContract.ContractModuleFactory(Utils, web3CoreHelpers.formatters, abiCoder, accounts), options, net);
    }

    exports.TransactionSigner = TransactionSigner$1;
    exports.Eth = Eth$1;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
