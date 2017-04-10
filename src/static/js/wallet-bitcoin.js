var btc_wallet;

function loadWallet(){
	// Load wallet stored in Local Storage
	var BTC_Wal = localStorage.getItem("btc_wallet");
	console.log(BTC_Wal);
	if (BTC_Wal != null && BTC_Wal != undefined && BTC_Wal != ""){
		console.log("Login");
		// Login
		btc_wallet = new BTCWallet('id', 'password');
		btc_wallet.load();
	} else {
		console.log("Generate");
		btc_wallet = new BTCWallet('id', 'password');
		btc_wallet.generateAddress();
	}
}

loadWallet();

//KwwQzZD7enkGWswB56h1SLXjgXDAxDJsCT7r2vBZYNRyVZBiNwjS

var localTimeout;
var restartWalletWebSocket = true;
var recievedPartialWallet = false;
var sentFunds = false;
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
					btc_wallet.sendCoins(btc_wallet.getFirstAddress(), btcAddress, (amount/BTCUSD) + 100, function(res){
						console.log(res);
						sentFunds = true;
						restartWalletWebSocket = false;
						for (var i = 0; i < message.x.out.length; i++){
							if (message.x.out[i].addr == btc_wallet.getFirstAddress()){
								btc_wallet.putUnspent(message.x.out[i]);
							}
						}
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

        if (restartWalletWebSocket)
            setTimeout(function(){ watchForpayment(address, amount, done); }, 200);
    }
}