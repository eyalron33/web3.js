let config = null;

export default class web3 {
    /**
     * Getter for the current context
     *
     * @property current
     *
     * @returns {Configuration}
     */
    static get config() {
        if (!config) {
            throw new Error('No Configuration defined!');
        }

        return config;
    }

    /**
     * Sets the default context of Web3
     *
     * @method init
     *
     * @param {String} name
     * @param {Object} conf
     *
     * @returns {Boolean}
     */
    static init(name, conf) {
        if (!conf) {
            config = new Configuration(conf);
            configList.set(name, config);
        }
    }
}
