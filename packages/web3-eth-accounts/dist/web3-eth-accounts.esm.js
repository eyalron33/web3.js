import { formatters } from 'web3-core-helpers';
import { ChainIdMethod, GetGasPriceMethod, GetTransactionCountMethod, AbstractMethodFactory } from 'web3-core-method';
import isFunction from 'lodash/isFunction';
import RLP from 'eth-lib/lib/rlp';
import Bytes from 'eth-lib/lib/bytes';
import { AbstractWeb3Module } from 'web3-core';
import scryptsy from 'scrypt.js';
import isObject from 'lodash/isObject';
import { encodeSignature, recover, sign, decodeSignature, create, fromPrivate } from 'eth-lib/lib/account';
import uuid from 'uuid';
import Hash from 'eth-lib/lib/hash';
import * as Utils from 'web3-utils';
import { isHexStrict, hexToBytes, randomHex, sha3 } from 'web3-utils';
import isString from 'lodash/isString';

class MethodFactory extends AbstractMethodFactory {
  constructor(utils, formatters$$1) {
    super(utils, formatters$$1);
    this.methods = {
      getChainId: ChainIdMethod,
      getGasPrice: GetGasPriceMethod,
      getTransactionCount: GetTransactionCountMethod
    };
  }
}

const crypto = typeof global === 'undefined' ? require('crypto-browserify') : require('crypto');
class Account {
  constructor(options, accounts = null) {
    this.address = options.address;
    this.privateKey = options.privateKey;
    this.accounts = accounts;
  }
  signTransaction(tx, callback) {
    return this.accounts.signTransaction(tx, this.privateKey, callback);
  }
  sign(data) {
    if (isHexStrict(data)) {
      data = hexToBytes(data);
    }
    const messageBuffer = Buffer.from(data);
    const preamble = `\u0019Ethereum Signed Message:\n${data.length}`;
    const preambleBuffer = Buffer.from(preamble);
    const ethMessage = Buffer.concat([preambleBuffer, messageBuffer]);
    const hash = Hash.keccak256s(ethMessage);
    const signature = sign(hash, this.privateKey);
    const vrs = decodeSignature(signature);
    return {
      message: data,
      messageHash: hash,
      v: vrs[0],
      r: vrs[1],
      s: vrs[2],
      signature
    };
  }
  encrypt(password, options) {
    return Account.fromPrivateKey(this.privateKey, this.accounts).toV3Keystore(password, options);
  }
  static from(entropy, accounts = {}) {
    return new Account(create(entropy || randomHex(32)), accounts);
  }
  static fromPrivateKey(privateKey, accounts = {}) {
    return new Account(fromPrivate(privateKey), accounts);
  }
  toV3Keystore(password, options) {
    options = options || {};
    const salt = options.salt || crypto.randomBytes(32);
    const iv = options.iv || crypto.randomBytes(16);
    let derivedKey;
    const kdf = options.kdf || 'scrypt';
    const kdfparams = {
      dklen: options.dklen || 32,
      salt: salt.toString('hex')
    };
    if (kdf === 'pbkdf2') {
      kdfparams.c = options.c || 262144;
      kdfparams.prf = 'hmac-sha256';
      derivedKey = crypto.pbkdf2Sync(Buffer.from(password), salt, kdfparams.c, kdfparams.dklen, 'sha256');
    } else if (kdf === 'scrypt') {
      kdfparams.n = options.n || 8192;
      kdfparams.r = options.r || 8;
      kdfparams.p = options.p || 1;
      derivedKey = scryptsy(Buffer.from(password), salt, kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else {
      throw new Error('Unsupported kdf');
    }
    const cipher = crypto.createCipheriv(options.cipher || 'aes-128-ctr', derivedKey.slice(0, 16), iv);
    if (!cipher) {
      throw new Error('Unsupported cipher');
    }
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(this.privateKey.replace('0x', ''), 'hex')), cipher.final()]);
    const mac = sha3(Buffer.concat([derivedKey.slice(16, 32), Buffer.from(ciphertext, 'hex')])).replace('0x', '');
    return {
      version: 3,
      id: uuid.v4({
        random: options.uuid || crypto.randomBytes(16)
      }),
      address: this.address.toLowerCase().replace('0x', ''),
      crypto: {
        ciphertext: ciphertext.toString('hex'),
        cipherparams: {
          iv: iv.toString('hex')
        },
        cipher: options.cipher || 'aes-128-ctr',
        kdf,
        kdfparams,
        mac: mac.toString('hex')
      }
    };
  }
  static fromV3Keystore(v3Keystore, password, nonStrict = false, accounts = {}) {
    if (!isString(password)) {
      throw new Error('No password given.');
    }
    const json = isObject(v3Keystore) ? v3Keystore : JSON.parse(nonStrict ? v3Keystore.toLowerCase() : v3Keystore);
    if (json.version !== 3) {
      throw new Error('Not a valid V3 wallet');
    }
    let derivedKey;
    let kdfparams;
    if (json.crypto.kdf === 'scrypt') {
      kdfparams = json.crypto.kdfparams;
      derivedKey = scryptsy(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else if (json.crypto.kdf === 'pbkdf2') {
      kdfparams = json.crypto.kdfparams;
      if (kdfparams.prf !== 'hmac-sha256') {
        throw new Error('Unsupported parameters to PBKDF2');
      }
      derivedKey = crypto.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256');
    } else {
      throw new Error('Unsupported key derivation scheme');
    }
    const ciphertext = Buffer.from(json.crypto.ciphertext, 'hex');
    const mac = sha3(Buffer.concat([derivedKey.slice(16, 32), ciphertext])).replace('0x', '');
    if (mac !== json.crypto.mac) {
      throw new Error('Key derivation failed - possibly wrong password');
    }
    const decipher = crypto.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), Buffer.from(json.crypto.cipherparams.iv, 'hex'));
    const seed = `0x${Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('hex')}`;
    return Account.fromPrivateKey(seed, accounts);
  }
}

class Wallet {
  constructor(utils, accountsModule) {
    this.utils = utils;
    this.accountsModule = accountsModule;
    this.defaultKeyName = 'web3js_wallet';
    this.accounts = {};
    this.accountsIndex = 0;
    return new Proxy(this, {
      get: (target, name) => {
        if (target.accounts[name]) {
          return target.accounts[name];
        }
        if (name === 'length') {
          return target.accountsIndex;
        }
        return target[name];
      }
    });
  }
  create(numberOfAccounts, entropy) {
    for (let i = 0; i < numberOfAccounts; ++i) {
      this.add(Account.from(entropy || this.utils.randomHex(32), this.accountsModule));
    }
    return this;
  }
  get(account) {
    return this.accounts[account];
  }
  add(account) {
    if (isString(account)) {
      account = Account.fromPrivateKey(account, this.accountsModule);
    }
    if (!this.accounts[account.address]) {
      this.accounts[this.accountsIndex] = account;
      this.accounts[account.address] = account;
      this.accounts[account.address.toLowerCase()] = account;
      this.accountsIndex++;
      return account;
    }
    return this.accounts[account.address];
  }
  remove(addressOrIndex) {
    const account = this.accounts[addressOrIndex];
    if (account) {
      delete this.accounts[account.address];
      delete this.accounts[account.address.toLowerCase()];
      delete this.accounts[account.index];
      return true;
    }
    return false;
  }
  clear() {
    for (let i = 0; i <= this.accountsIndex; i++) {
      this.remove(i);
    }
    this.accountsIndex = 0;
    return this;
  }
  encrypt(password, options) {
    let encryptedAccounts = [];
    for (let i = 0; i <= this.accountsIndex; i++) {
      encryptedAccounts.push(this.accounts[i].encrypt(password, options));
    }
    return encryptedAccounts;
  }
  decrypt(encryptedWallet, password) {
    encryptedWallet.forEach(keystore => {
      const account = Account.fromV3Keystore(keystore, password, false, this.accountsModule);
      if (!account) {
        throw new Error("Couldn't decrypt accounts. Password wrong?");
      }
      this.add(account);
    });
    return this;
  }
  save(password, keyName) {
    console.warn('SECURITY WARNING: Storing of accounts in the localStorage is highly insecure!');
    if (typeof localStorage === 'undefined') {
      throw new TypeError('window.localStorage is undefined.');
    }
    try {
      localStorage.setItem(keyName || this.defaultKeyName, JSON.stringify(this.encrypt(password)));
    } catch (error) {
      if (error.code === 18) {
        return true;
      }
      throw new Error(error);
    }
    return true;
  }
  load(password, keyName) {
    console.warn('SECURITY WARNING: Storing of accounts in the localStorage is highly insecure!');
    if (typeof localStorage === 'undefined') {
      throw new TypeError('window.localStorage is undefined.');
    }
    let keystore;
    try {
      keystore = localStorage.getItem(keyName || this.defaultKeyName);
      if (keystore) {
        keystore = JSON.parse(keystore).map(item => {
          Account.fromV3Keystore(item, password, false, this.accountsModule);
        });
      }
    } catch (error) {
      if (error.code === 18) {
        keystore = this.defaultKeyName;
      } else {
        throw new Error(error);
      }
    }
    return this.decrypt(keystore || [], password);
  }
}

class Accounts extends AbstractWeb3Module {
  constructor(provider, utils, formatters$$1, methodFactory, options, net) {
    super(provider, options, methodFactory, net);
    this.utils = utils;
    this.formatters = formatters$$1;
    this.transactionSigner = options.transactionSigner;
    this.defaultKeyName = 'web3js_wallet';
    this.accounts = {};
    this.accountsIndex = 0;
    this.wallet = new Wallet(utils, this);
  }
  create(entropy) {
    return Account.from(entropy, this);
  }
  privateKeyToAccount(privateKey) {
    return Account.fromPrivateKey(privateKey, this);
  }
  hashMessage(data) {
    if (this.utils.isHexStrict(data)) {
      data = this.utils.hexToBytes(data);
    }
    const messageBuffer = Buffer.from(data);
    const preambleBuffer = Buffer.from(`\u0019Ethereum Signed Message:\n${data.length}`);
    const ethMessage = Buffer.concat([preambleBuffer, messageBuffer]);
    return Hash.keccak256s(ethMessage);
  }
  async signTransaction(tx, privateKey, callback) {
    try {
      const account = Account.fromPrivateKey(privateKey, this);
      if (!tx.chainId) {
        tx.chainId = await this.getChainId();
      }
      if (!tx.gasPrice) {
        tx.gasPrice = await this.getGasPrice();
      }
      if (!tx.nonce) {
        tx.nonce = await this.getTransactionCount(account.address);
      }
      const signedTransaction = await this.transactionSigner.sign(this.formatters.inputCallFormatter(tx, this), account.privateKey);
      if (isFunction(callback)) {
        callback(false, signedTransaction);
      }
      return signedTransaction;
    } catch (error) {
      if (isFunction(callback)) {
        callback(error, null);
        return;
      }
      throw error;
    }
  }
  recoverTransaction(rawTx) {
    const values = RLP.decode(rawTx);
    const signature = encodeSignature(values.slice(6, 9));
    const recovery = Bytes.toNumber(values[6]);
    const extraData = recovery < 35 ? [] : [Bytes.fromNumber(recovery - 35 >> 1), '0x', '0x'];
    const signingData = values.slice(0, 6).concat(extraData);
    const signingDataHex = RLP.encode(signingData);
    return recover(Hash.keccak256(signingDataHex), signature);
  }
  sign(data, privateKey) {
    if (this.utils.isHexStrict(data)) {
      data = this.utils.hexToBytes(data);
    }
    return Account.fromPrivateKey(privateKey, this).sign(data);
  }
  recover(message, signature, preFixed) {
    if (isObject(message)) {
      return this.recover(message.messageHash, encodeSignature([message.v, message.r, message.s]), true);
    }
    if (!preFixed) {
      message = this.hashMessage(message);
    }
    if (arguments.length >= 4) {
      return this.recover(arguments[0], encodeSignature([arguments[1], arguments[2], arguments[3]]), !!arguments[4]);
    }
    return recover(message, signature);
  }
  decrypt(v3Keystore, password, nonStrict) {
    return Account.fromV3Keystore(v3Keystore, password, nonStrict, this);
  }
  encrypt(privateKey, password, options) {
    return Account.fromPrivateKey(privateKey, this).toV3Keystore(password, options);
  }
}

function Accounts$1(provider, net = null, options = {}) {
  return new Accounts(provider, Utils, formatters, new MethodFactory(Utils, formatters), options, net);
}

export { Accounts$1 as Accounts };
