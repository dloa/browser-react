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