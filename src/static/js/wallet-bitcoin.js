var btc_wallet;

function loadWallet(){
	// Load wallet stored in Local Storage
	var BTC_Wal = localStorage.getItem("btc_wallet");
	console.log(BTC_Wal);
	if (BTC_Wal != null && BTC_Wal != undefined && BTC_Wal != ""){
		console.log("Login");
		// Login
		btc_wallet = new BTCWallet('id', 'password');
		btc_wallet.load(function(){
			loadPaywallAmount();
		});
	} else {
		console.log("Generate");
		btc_wallet = new BTCWallet('id', 'password');
		btc_wallet.generateAddress();
	}
}

//KwwQzZD7enkGWswB56h1SLXjgXDAxDJsCT7r2vBZYNRyVZBiNwjS

var localTimeout;
var restartWalletWebSocket = true;
var recievedPartialWallet = false;
var sentFunds = false;
var pingTimerId = 0;
function watchForLocalWalletPayment(address, amount, done) {
	// Check if we are starting it for the first time and it is not calling itself
	// If we are, then we need to reset the flag if it is false
	if (restartWalletWebSocket == false)
		restartWalletWebSocket = true;

	console.log(address);
    done = done || function () {};
    if (amount <= 0) {
        return done(amount);
    }

    bitcoinWalletWebsocket = new WebSocket("wss://ws.blockchain.info/inv");

    bitcoinWalletWebsocket.onopen = function(evt){
        console.log('Websocket Opened...');
        bitcoinWalletWebsocket.send('{"op":"addr_sub", "addr":"' + address + '"}');
    	pingWebSocket();
    }

    bitcoinWalletWebsocket.onmessage = function(evt){
        var received_msg = evt.data;
        var message = JSON.parse(received_msg);
        if (message.op == "utx"){
            console.log(message);
            console.log("Recieved transaction, hash: " + message.x.hash);
            
            var bitsRecieved = 0;

            for (var i = 0; i < message.x.out.length; i++) {
                if (message.x.out[i].addr == address){
                    bitsRecieved = message.x.out[i].value;
                    console.log("Bits Recieved: " + bitsRecieved);
                    // Now that we have recieved them add it to the local wallet
                    btc_wallet.putUnspent(message.x.out[i]);
                }
            }

            // This converts it from bits to full Bitcoin (i.e. 13312 bits would become 0.00013312 BTC);
            var formattedBTCRecieved = bitsRecieved/100000000;

            // amountPaid is the value in USD recieved.
            var amountPaid = BTCtoUSD(formattedBTCRecieved);
            console.log("Recieved $" + amountPaid);


			// Wrapped in try to catch when btc_wallet is undefined
			try {
				// Check if we are 
				var btcAddress = $($('.pwyw-btc-address')[0]).text();
				console.log(btcAddress);
				// Send the suggested price/whatever was entered into the box
				if (!sentFunds){
					// Add in 100 extra satoshi just in case :)
					console.log(amount, BTCUSD);
					btc_wallet.sendCoins(btc_wallet.getFirstAddress(), btcAddress, amount/BTCUSD, function(err, data){
						if (err){
							console.error(err);
						}
						console.log(data);
						sentFunds = true;
						restartWalletWebSocket = false;
						bitcoinWalletWebsocket.close();
					});
				}
			} catch (e) {
				// Most likely issue is taht btc_wallet is undefined/not working.
				console.error(e);
			}
            
        }
    }

    bitcoinWalletWebsocket.onclose = function(evt){
        // Sometimes the websocket will timeout or close, when it does just respawn the thread.
        console.log("Websocket Closed");
        clearTimeout(pingTimerId);
        if (restartWalletWebSocket)
            setTimeout(function(){ watchForpayment(address, amount, done); }, 500);
    }
}

var loadPaywallAmount = function (){
	console.log(btc_wallet.getTotalBalance(), BTCUSD);
	$('#payment-select-buttons-localwallet-buy').text("Pay with Wallet ($" + (btc_wallet.getTotalBalance()*BTCUSD).toFixed(2) + ")");
	$('#payment-select-buttons-localwallet-play').text("Pay with Wallet ($" + (btc_wallet.getTotalBalance()*BTCUSD).toFixed(2) + ")");
}

var payArtifactFromLocalWallet = function(type){
	var btcAddress = $($('.pwyw-btc-address')[0]).text();

	var amount = $($('.pwyw-btc-' + type + '-price')[0]).text();

	btc_wallet.sendCoins(btc_wallet.getFirstAddress(), btcAddress, parseFloat(amount), function(err, data){
		if (err){
			console.error(err);
		}
		console.log(data);
		sentFunds = true;
		restartWalletWebSocket = false;
		bitcoinWalletWebsocket.close();
	});
}

function pingWebSocket() {
	console.log('Ping WebSocket');
    bitcoinWalletWebsocket.send('{"op":"ping"}');
    pingTimerId = setTimeout(function(){
    	pingWebSocket();
    }, 28500);
}

loadWallet();