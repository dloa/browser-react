var FLOCost;
var FLOLTC;
var LTCUSD;
var FLOUSD;
var BTCUSD;
var cryptoTimerId = 0;

// TIMER FOR CHANGING EXCHANGE RATES
function changeCryptoRates() {
	if (cryptoTimerRunning === false) {
		return false;
	} else {
		// set a timer and run search if done typing
		cryptoTimerRunning = true;
		cryptoTimerId = setTimeout ( 'getCryptos()', 1000 );
	}
}

// GET CRYPTO EXCHANGE RATES
function getCryptos() {
	console.log("checking crypto prices");
	clearTimeout ( cryptoTimerId );
	cryptoTimerRunning = false;
	if (!FLOUSD) {
		// Alexandria Crytpo Price
		$.ajax({
			url: 'https://api.alexandria.io/flo-market-data/v1/getAll',
			success: function(e) {
				console.info(e);
				var data = $.parseJSON(e);
				FLOUSD = data.USD;
				console.log(FLOUSD);
				adjDisplayValues(FLOUSD, false)
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.error(xhr.status);
				console.error(thrownError);
			}
			
		});
	} else {
		adjDisplayValues(FLOUSD, false)
	}
	if ( (!BTCUSD) && (location.hostname != 'localhost') ) {
		// Bitcoin
		$.ajax({
		    url: 'https://api.bitcoinaverage.com/ticker/global/USD/',
		    success: function(e) {
				console.info(e);
				BTCUSD = parseFloat(e['24h_avg']);
				console.log(BTCUSD);
				adjDisplayValues(false, BTCUSD);
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.error(xhr.status);
				console.error(thrownError);
			}
		});
	} else {
		adjDisplayValues(false, BTCUSD);
	}
}

function adjDisplayValues(FLOUSD, BTCUSD) {
	// FLO
	if (FLOUSD) {
		$('#flo-usd label').text('FLO/USD').next('span').text(FLOUSD);
		FLOCost = parseFloat($('#flo-cost').text());
		$('#tip-modal .flo-usd-output').text(Math.round((1/FLOUSD)*100)/100);
		$('#newMedia-notary .flo-usd-output').text(Math.round((FLOUSD*FLOCost)*100000)/100000);
		if ($('#alexandria-tip-amount').length > 0) {
			$('#tip-alexandria-modal .flo-usd-output').text(Math.round((document.getElementById('alexandria-tip-amount').value*FLOUSD)*100000)/100000);
		}
		var pwywAmount = $('.pwyw-wall-amount:visible').val();
		$('.pwyw-wall-amount:hidden').val(pwywAmount);
		$('#pwyw-modal .flo-usd-output').text(Math.round((pwywAmount/FLOUSD)*100000)/100000);
	}
	if (BTCUSD) {
		// BTC
		var pwywAmount = $('.pwyw-wall-amount:visible').val();
		$('.btc-usd .btc-usd-output').text(Math.round((1/BTCUSD)*100000000)/100000000);
		$('#pwyw-modal .btc-usd-output').text(Math.round((pwywAmount/BTCUSD)*100000)/100000);
	}
}