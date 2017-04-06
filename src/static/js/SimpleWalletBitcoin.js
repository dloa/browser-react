$.ajaxSetup({
	cache: false
});
/*
 * SimpleWallet.js
 *
 * This is the <modified> core of the LiteVault, all of this Typescript
 * and/or related javascript is held under the AGPL Licence
 * unless otherwise noted on the Git repository
 *
 * Created by Someguy123 (http://someguy123.com)
 * Modified by bitspill
 */
 var blockchainBaseURL = "https://blockchain.info";

var BTCWallet = (function () {
	function Wallet(identifier, password) {
		this.addresses = {};
		this.balances = {};
		this.coin_network = Bitcoin.networks.bitcoin;
		this.CryptoConfig = {
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Iso10126,
			iterations: 5
		};
		this.identifier = identifier;
		this.password = password;
		this.known_spent = [];
		this.known_unspent = [];

		if('btcspentdata' in localStorage) {
			try {
				var spdata = JSON.parse(localStorage.btcspentdata);
				this.known_spent = spdata.spent;
				this.known_unspent = spdata.unspent;
			} catch(e) {
				// local data is corrupt?
				delete localStorage['btcspentdata'];
			}
		}
	};

	Wallet.prototype.putSpent = function (spent) {
		this.known_spent.push(spent);
		var unspent = this.known_unspent;
		// clean out known unspent
		for (var v in unspent) {
			if (JSON.stringify(spent) == JSON.stringify(unspent[v])) {
				delete this.known_unspent[k];
			}
		}
		this.storeSpent();
	};

	Wallet.prototype.putUnspent = function (spent) {
		this.known_unspent.push(spent);
		this.storeSpent();
	};

	Wallet.prototype.storeSpent = function() {
		var spdata = {spent: this.known_spent, unspent: this.known_unspent};
		localStorage.btcspentdata = JSON.stringify(spdata);
	}
	/**
	 * setSharedKey()
	 *
	 * This is used when the wallet is first created, we get the shared key
	 * from the server, we give it to this wallet object using this function
	 * because we haven't yet written the encrypted wallet to the server
	 * which contains the shared key.
	 *
	 * @param sKey
	 */
	Wallet.prototype.setSharedKey = function (sKey) {
		this.shared_key = sKey;
	};

	Wallet.prototype.generateAddress = function () {
		var key = Bitcoin.ECKey.makeRandom();
		var PubKey = key.pub.getAddress(this.coin_network).toString();
		var PrivKey = key.toWIF(this.coin_network);
		this.addAddress(PubKey, {label: "", priv: PrivKey, addr: PubKey});
		this.refreshBalances();
		this.store();
	};
	Wallet.prototype.addAddress = function (address, data) {
		if (address in this.addresses) {
			alert("Warning: address " + address + " already exists, skipping.");
		}
		else {
			this.addresses[address] = data;
		}
	};

	Wallet.prototype.load = function (_success) {
		if (_success === void 0) {
			_success = function () {
			};
		}
		var _this = this;
		if (localStorage.btc_wallet){
			var decWallet, decWalletString, decWalletJSON;
			//console.log("Decrypting data: '" + data.wallet + "' with password " + _this.password);
			console.log('Decrypting wallet');
			try {
				// Decrypt wallet
				decWallet = CryptoJS.AES.decrypt(localStorage.btc_wallet, this.password, this.CryptoConfig);
				decWalletString = decWallet.toString(CryptoJS.enc.Utf8);
				// Load the JSON, then use it to initialize the wallet
				decWalletJSON = JSON.parse(decWalletString);
				this.shared_key = decWalletJSON.shared_key;
				this.addresses = decWalletJSON.addresses;
				console.log('Wallet loaded successfully. Refreshing balances and running success callback.');
				try {
					this.refreshBalances();
					// run the success callback
					_success();
				} catch (ex) {
					alert("There was an error rendering this page. Please contact an administrator.");
					console.log(ex);
				}
			} catch (ex) {
				alert("Error decrypting wallet - Invalid password?");
				console.log(ex);
			}
		} else {

		}
	};
	Wallet.prototype.store = function () {
		var walletData = this.wallet_serialize();
		console.log("Encrypting data");
		var encWalletData = CryptoJS.AES.encrypt(walletData, this.password, this.CryptoConfig);
		var encWalletDataCipher = encWalletData.toString();
		var _this = this;
		
		localStorage.btc_wallet = encWalletDataCipher;
	};

	/**
	 * refreshBalances(callback)
	 *
	 * Updates balances from server, then outputs the balance map
	 * to the callback function.
	 *
	 * @param callback(balances)
	 */
	Wallet.prototype.refreshBalances = function (callback) {
		if (callback === void 0) {
			callback = function (balances) {
			};
		}
		var _this = this;
		for (var i in this.addresses) {
			$.ajax({
				url: blockchainBaseURL + '/rawaddr/' + this.addresses[i].addr + "?format=json",
				data: "",
				type: "GET",
				cache: false,
				beforeSend: function(xhr){xhr.setRequestHeader('Access-Control-Allow-Headers', 'x-requested-with');},
				success: function (data) {
					if (data) {
						var addr_data = JSON.parse(data.responseText.replace(/<\/?[^>]+>/gi, ''));
						console.log(addr_data);
						_this.setBalance(addr_data['address'], addr_data['final_balance'] / Math.pow(10, 8) );
					}
				}
			});
		}
	};
	Wallet.prototype.getUnspent = function (address, callback) {
		$.ajax({
			url: blockchainBaseURL + '/unspent?active=' + address + "&format=json",
			data: "",
			type: "GET",
			cache: false,
			beforeSend: function(xhr){xhr.setRequestHeader('Access-Control-Allow-Headers', 'x-requested-with');},
			success: function (data) {
				if (data) {
					var unspent_data = JSON.parse(data.responseText.replace(/<\/?[^>]+>/gi, ''));
					console.log(unspent_data);
					callback(unspent_data.unspent_outputs);
					//_this.setBalance(addr_data['address'], addr_data['final_balance']);
				}
			}
		});
	};

	/**
	 * Attempts to remove inputs that are known to be spent.
	 * This helps avoid problems when sending multiple transactions shortly
	 * after eachother.
	 */
	Wallet.prototype.removeSpent = function (coins) {
		console.log("removeSpent");
		console.log(JSON.stringify(coins));
		var clean_coins = coins;
		for (var v in this.known_spent) {
			for (var k in coins) {
				if (JSON.stringify(coins[k]) == JSON.stringify(this.known_spent[v])) {
					delete clean_coins[k];
				}
			}
		}
		console.log(JSON.stringify(clean_coins));
		return clean_coins;
	};
	Wallet.prototype.mergeUnspent = function (unspent, address) {
		var merged = unspent;
		console.log("!unspent!");
		console.log(JSON.stringify(unspent, null, 2));

		for (var i = 0; i < this.known_unspent.length; ++i)
			if (this.known_unspent[i].address == address) {
				var dupe = false;
				for (var j = 0; j < unspent.length; ++j)
					if (this.known_unspent[i].txid == merged[j].txid &&
						this.known_unspent[i].vout == merged[j].vout) {
						dupe = true;
						break;
					}
				if (!dupe)
					merged.push(this.known_unspent[i]);
			}

		console.log("!known_unspent!");
		console.log(JSON.stringify(this.known_unspent, null, 2));
		console.log("!merged!");
		console.log(JSON.stringify(merged, null, 2));
		return merged;
	};
	/**
	 * calculateBestUnspent()
	 *
	 * Sorts passed in unspents by confirmations descending.
	 *
	 * Returns an object containing the required unspents to match the
	 * amount requested, as well as the total Litecoin value of them.
	 *
	 * @param amount (amount of coins to reach)
	 * @param unspents (array of Unspent Transactions)
	 * @returns {{unspent: Array<UnspentTX>, total: number}}
	 */
	Wallet.prototype.calculateBestUnspent = function (amount, unspents) {
		console.log("calcBestUnspent");
		console.log(unspents);
		// note: unspents = [ {tx, amount, n, confirmations, script}, ... ]
		// TODO: implement a real algorithm to determine the best unspents
		// e.g. compare the size to the confirmations so that larger coins
		// are used, as well as ones with the highest confirmations.
		unspents.sort(function (a, b) {
			// if (a.confirmations > b.confirmations) {
			//	 return -1;
			// }
			// if (a.confirmations < b.confirmations) {
			//	 return 1;
			// }
			if (a.value > b.value) {
				return 1;
			}
			if (a.value < b.value) {
				return -1;
			}
			return 0;
		});
		var CutUnspent = [], CurrentAmount = 0;
		for (var v in unspents) {
			// if (parseFloat(unspents[v].amount) > amount) {
			//	 CurrentAmount += parseFloat(unspents[v].amount);
			//	 CutUnspent.push(unspents[v]);
			//	 break;
			// }
			CurrentAmount += unspents[v].value;
			CutUnspent.push(unspents[v]);
			if (CurrentAmount > amount) {
				break;
			}
		}
		if (CurrentAmount < amount) {
			throw "Not enough coins in unspents to reach target amount";
			alert("Not enough coins in unspents to reach target amount");
		}
		return {unspent: CutUnspent, total: CurrentAmount};
	};
	Wallet.prototype.validateKey = function (key, priv) {
		if (priv === void 0) {
			priv = false;
		}
		try {
			var version;
			// are we validating a private key?
			if (priv === true) {
				version = this.coin_network.wif;
			}
			else {
				version = this.coin_network.pubKeyHash;
			}
			var decoded = Bitcoin.base58check.decode(key);

			if( this.coin_network == Bitcoin.networks.florincoin && priv == true){
				// Backwards compatibility for private keys saved under litecoin settings.
				return decoded[0] == Bitcoin.networks.florincoin.wif || decoded[0] == Bitcoin.networks.litecoin.wif
			}

			// is this address for the right network?
			return (decoded[0] == version);
		}
		catch (ex) {
			// exceptions mean invalid address
			return false;
		}
	};
	Wallet.prototype.sortTransactions = function (transactions) {
		var allTransactions = [];
		for (var v in transactions) {
			if (transactions[v]) {
				var newTx = transactions[v];
				allTransactions.push(newTx);
			}
		}
		return allTransactions;
	};
	Wallet.prototype.sendCoins = function (fromAddress, toAddress, amount, txComment, callback) {
		if (typeof txComment == "undefined")
			txComment = '';
		if (typeof txComment == typeof Function) {
			callback = txComment;
			txComment = '';
		}
		if (typeof callback != typeof Function)
			callback = function (err, data) {
			};

		var _this = this;
		if (this.validateKey(toAddress) && this.validateKey(fromAddress)) {
			if (fromAddress in this.addresses && this.validateKey(this.addresses[fromAddress].priv, true)) {
				this.refreshBalances();
				if (this.balances[fromAddress] < amount) {
					alert("You don't have enough coins to do that");
					return;
				}
				this.getUnspent(fromAddress, function (data) {
					//var merged = _this.mergeUnspent(data, fromAddress);
					//var clean_unspent = _this.removeSpent(merged);
					amount = parseInt((amount * Math.pow(10, 8)).toString());
					data = _this.calculateBestUnspent(amount, data);
					console.log(data);
					// temporary constant
					var minFeePerKb = 40;
					var tx = new Bitcoin.Transaction();
					// IMPORTANT! We're dealing with Satoshis now
					var totalUnspent = data.total;
					//if (amount < minFeePerKb) {
					//	alert("You must send at least 0.001 BTC (otherwise your transaction may get rejected)");
					//	return;
					//}
					console.log('Sending ' + amount + ' satoshis from ' + fromAddress + ' to ' + toAddress + ' unspent amt: ' + totalUnspent);
					var unspents = data.unspent;
					_this.putSpent.bind(_this);
					for (var v in unspents) {
						// Add them regardless of if there is zero confirmations.
						if (unspents[v].tx_hash_big_endian && unspents[v].tx_output_n){
							tx.addInput(unspents[v].tx_hash_big_endian, unspents[v].tx_output_n);
							_this.putSpent(unspents[v]);
						}
					}
					console.log(tx);
					tx.addOutput(toAddress, amount);
					console.log(tx);
					//var estimatedFee = _this.coin_network.estimateFee(tx);
					var estimatedFee = 12000; // this is ~1.5¢ ~45 satoshi per byte (45 * 266 ~= 12000)
					console.log(estimatedFee);
					if (estimatedFee > 0) {
						// Temporary fix for "stuck" transactions
						// estimatedFee = estimatedFee * 3;
					}
					if ((amount + estimatedFee) > totalUnspent) {
						alert("Can't fit fee of " + estimatedFee / Math.pow(10, 8) + " - lower your sending amount");
						console.log('WARNING: Total is greater than total unspent: %s - Actual Fee: %s', totalUnspent, estimatedFee);
						return;
					}
					var changeValue = parseInt((totalUnspent - amount - estimatedFee).toString());
					// only give change if it's bigger than the minimum fee
					if (changeValue >= minFeePerKb) {
						tx.addOutput(fromAddress, changeValue);
					}
					tx.ins.forEach(function (input, index) {
						tx.sign(index, new Bitcoin.ECKey.fromWIF(_this.addresses[fromAddress].priv));
					});
					console.log('Sending amount %s to address %s - Change value: %s - Fee in satoshis: %s - Fee in standard: %s', amount / Math.pow(10, 8), toAddress, changeValue, estimatedFee, (estimatedFee / Math.pow(10, 8)));
					var rawHex = tx.toHex();
                    console.log(rawHex);

                    console.log("Comment:");
                    console.log(txComment);

                    var lenBuffer = Bitcoin.bufferutils.varIntBuffer(txComment.length);
                    var hexComment = '';

                    for (var i = 0; i < lenBuffer.length; ++i) {
                        hexComment += toHex(lenBuffer[i]);
                    }
                    for (i = 0; i < txComment.length; ++i) {
                        hexComment += toHex(txComment.charCodeAt(i));
                    }
                    rawHex += hexComment;

                    console.log("Raw");
                    console.log(rawHex);

					_this.pushTX(rawHex, function (data) {
						_this.putUnspent.bind(_this);
						// If I'm paying myself it's known_unspent
						if (toAddress == fromAddress) {
							_this.putUnspent({
								address: toAddress,
								txid: data.txid,
								vout: 0,
								confirmations: -1,
								amount: amount / Math.pow(10, 8)
							});
						}
						// Add the change as a known_unspent
						if (changeValue >= minFeePerKb)
							_this.putUnspent({
								address: fromAddress,
								txid: data.txid,
								vout: 1,
								confirmations: -1,
								amount: changeValue / Math.pow(10, 8)
							});
						try {
							beep(300, 4);
						}
						catch (e) {
							console.error('Beep is not supported by this browser???');
						}
						if (typeof callback == typeof Function)
							callback(null, data);
					});
				});
				this.refreshBalances();
			}
			else {
				alert("Error: You don't own that address!");
			}
		}
		else {
			alert('Error: Your sending or recipient address is invalid. Please check for any typos');
		}
	};
	Wallet.prototype.pushTX = function (tx, callback) {
		if (callback === void 0) {
			callback = function (data) {
			};
		}
		var _this = this;
		$.ajax({
			url: 'http://btc.blockr.io/api/v1/tx/push',
			data: {hex: tx},
			type: "POST",
			headers: {
				//"Access-Control-Allow-Origin": "*"
				//'Access-Control-Allow-Headers': 'X-Requested-With'
			},
			cache: false,
			//beforeSend: function(xhr){xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');},
			success: function (data) {
				if (data) {
					console.log(data);
					//var addr_data = JSON.parse(data.responseText.replace(/<\/?[^>]+>/gi, ''));
					//console.log(addr_data);
					//_this.setBalance(addr_data['address'], addr_data['final_balance']);
				}
			}
		});
		/*$.post(blockchainBaseURL + '/pushtx', {hex: tx}, function (data) {
			console.log(data);
			if (!data.txid) {
				alert('There was an error pushing your transaction. May be a temporary problem, please try again later.');
			}
			else {
				callback(data);
			}
			_this.refreshBalances();
		}, "json").fail(function () {
			alert('There was an error pushing your transaction. May be a temporary problem, please try again later.');
		});*/
	};
	Wallet.prototype.setBalance = function (address, balance) {
		this.balances[address] = balance;
	};
	/**
	 * getTotalBalance()
	 *
	 * This function returns the total balance calculated
	 * from this.balances; NOTE: It does NOT update the balance
	 * from the server, if you need that, do this.refreshBalances();
	 * before executing this function to get an up to date result.
	 *
	 * ~~Someguy123
	 */
	Wallet.prototype.getTotalBalance = function () {
		var total = 0;
		for (var v in this.balances) {
			total += parseFloat(this.balances[v].toString());
		}
		return total;
	};

	Wallet.prototype.signMessage = function (address, message) {
		var privkey = new Bitcoin.ECKey.fromWIF(this.addresses[address].priv);
		var signed_message = Bitcoin.Message.sign(privkey, message, this.coin_network);
		return signed_message.toString('base64');
	};

	/**
	 * wallet_serialize()
	 *
	 * Returns the JSON version of the wallet, including
	 * only the necessities, such as the shared key,
	 * addresses, labels, and private keys
	 *
	 * @param prettify
	 * @returns {string}
	 */
	Wallet.prototype.wallet_serialize = function (prettify) {
		if (prettify === void 0) {
			prettify = false;
		}
		var walletdata = ({
			shared_key: this.shared_key,
			addresses: this.addresses
		});
		if (prettify) {
			return JSON.stringify(walletdata, null, "\t");
		}
		else {
			return JSON.stringify(walletdata);
		}
	};

	return Wallet;
})();

function toHex(d) {
	return ("0" + (Number(d).toString(16))).slice(-2).toUpperCase()
}
