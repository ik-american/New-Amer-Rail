var CalcTimerActiveCR = false;
var CalcInteractionDetectedCR = false;
var reCalcTimerCR;
var reCalcIntervalCR = 500; // 1000 = one second
var changeAmountCR = 25;
var balFieldID = 'AcctBalance';
var balErrorFieldID = 'bal_error';
var balInitVal = $('#' + balFieldID).val();
var balLastVal = $('#' + balFieldID).val();
var cdebug_enabled = false;

$(document).ready(function() {

    var pmtfld = document.getElementById(balFieldID);
    pmtfld.onfocus = reCalcRewardsTimer;

    $("input[data-type='currency']").on({
        keyup: function() {
            formatCurrency($(this));
        },
        blur: function() {
            formatCurrency($(this), "blur");
        }
    });

    formatCurrency($("#AcctBalance"));

    reCalcRewards();

});

function formatNumber(n) {
    // format number 1000000 to 1,234,567
    return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatCurrency(input, blur) {
    // appends $ to value, validates decimal side
    // and puts cursor back in right position.

    // get input value
    var input_val = input.val();

    // don't validate empty input
    if (input_val === "") {
        return;
    }

    // original length
    var original_len = input_val.length;

    // initial caret position 
    var caret_pos = input.prop("selectionStart");

    // check for decimal
    if (input_val.indexOf(".") >= 0) {

        // get position of first decimal
        // this prevents multiple decimals from
        // being entered
        var decimal_pos = input_val.indexOf(".");

        // split number by decimal point
        var left_side = input_val.substring(0, decimal_pos);
        var right_side = input_val.substring(decimal_pos);

        // add commas to left side of number
        left_side = formatNumber(left_side);

        // validate right side
        right_side = formatNumber(right_side);

        // On blur make sure 2 numbers after decimal
        if (blur === "blur") {
            right_side += "00";
        }

        // Limit decimal to only 2 digits
        right_side = right_side.substring(0, 2);

        // join number by .
        input_val = "$" + left_side + "." + right_side;

    } else {
        // no decimal entered
        // add commas to number
        // remove all non-digits
        input_val = formatNumber(input_val);
        input_val = "$" + input_val;

        // final formatting
        if (blur === "blur") {
            //input_val += ".00";
        }
    }

    // send updated string to input
    input.val(input_val);

    // put caret back in the right position
    var updated_len = input_val.length;
    caret_pos = updated_len - original_len + caret_pos;
    input[0].setSelectionRange(caret_pos, caret_pos);
}


function initCRInteraction() {
    $("div.calc-container .post-interaction").delay(2500).fadeIn(2000);
    // optionally record a personalization interest hit:
    $container = $("div.calc-container .calc-disclaimer");
    if (typeof $container.data('perstag-scripted') !== 'undefined') {
        perstag_value = $container.data('perstag-scripted');
        bid = $container.data('bid'); // bit id

        if (!isNaN(perstag_value) && (perstag_value != '')) {
            PERS.send('click', perstag_value, bid);
        }
    }
}

function reCalcRewardsTimer() {
    if (!CalcTimerActiveCR) {
        // timer is not active, activate it
        CalcTimerActiveCR = true;
        reCalcTimerCR = setInterval(reCalcRewards, reCalcIntervalCR);
        if (CalcInteractionDetectedCR === false) {
            CalcInteractionDetectedCR = true;
            initCRInteraction();
        }
    }
}

function chgPayment(op) {
    pmtv = parseInt($('#' + balFieldID).val());
    if (isNaN(pmtv)) {
        $('#' + balFieldID).val(5000);
    } else {
        if (CalcInteractionDetectedCR === false) {
            CalcInteractionDetectedCR = true;
            initCRInteraction();
        }
        switch (op) {
            case '-':
                if (pmtv > changeAmountCR) {
                    pmtv -= changeAmountCR;
                    $('#' + balFieldID).val(pmtv);
                    reCalcRewards();
                }
                break;
            case '+':
                pmtv = parseInt($('#' + balFieldID).val());
                pmtv += changeAmountCR;
                $('#' + balFieldID).val(pmtv);
                reCalcRewards();
                break;
            default:
                break;
        }

    }
}

function dbug(txt) {
    var dbug = false;
    if (dbug) {
        console.log(txt);
    }
}

function cdebug(msg) {
    if (cdebug_enabled) {
        console.log(msg);
    }
}

function reCalcRewards() {
    cdebug('reCalc start');

    BalanceEntered = $('#' + balFieldID).val();
    tmpBalance = BalanceEntered.replace(/\,/g, '');
    tmpBalance = tmpBalance.replace(/\$/g, '');
    AcctBalance = parseFloat(tmpBalance);

    if (isNaN(AcctBalance)) { //if the value entered is not a numeric value, set it to 0
        AcctBalance = 0;
    }

    cdebug('AcctBalance = ' + AcctBalance);

    // harvest parameters from HTML
    v_txn1min = parseInt($('#v_txn1min').val());
    v_txn1max = parseInt($('#v_txn1max').val());
    v_txn1apr = parseFloat($('#v_txn1apr').val());
    v_txn2min = parseInt($('#v_txn2min').val());
    v_txn2max = parseInt($('#v_txn2max').val());
    v_txn2apr = parseFloat($('#v_txn2apr').val());
    v_abovecapapr = parseFloat($('#v_abovecapapr').val());
    v_cashcap = parseFloat($('#v_cashcap').val());
    v_cashbackrate = parseFloat($('#v_cashbackrate').val());
    v_cashbackmax = parseFloat($('#v_cashbackmax').val());

    var v_belowcapreward = 0.00;
    var v_abovecapreward = 0.00;

    // set up the transaction count
    //  first just assign a value
    var v_txn_count = document.querySelector('input[name="txnrad"]:checked').value;

    //var v_txn_count = 15;
    cdebug('Transaction Count = ' + v_txn_count);

    // establish the below cap reward rate
    //  will be chosen based on the transaction tier (low/high)
    //  start at 0.00% in case low and high ranges fail.
    //  so if  low, choose value from v_txn1apr
    //  so if high, choose value from v_txn2apr
    var v_belowcaprewardrate = 0.00;
    // check if transactions fall within low tier
    if ((v_txn_count >= v_txn1min) && (v_txn_count <= v_txn1max)) {
        // transactions are in low-tier Range
        v_belowcaprewardrate = v_txn1apr / 100.0;
    }
    // check if transactions fall within high tier
    if ((v_txn_count >= v_txn2min) && (v_txn_count <= v_txn2max)) {
        // transactions are in low-tier Range
        v_belowcaprewardrate = v_txn2apr / 100.0;
    }
    cdebug('Cash Below Cap Rate = ' + v_belowcaprewardrate);

    // Calculate the Above Cap Extra
    var v_abovecapextra = 0.00;
    if (AcctBalance > v_cashcap) {
        v_abovecapextra = AcctBalance - v_cashcap;
    }
    cdebug('Cash Cap Extra = ' + v_abovecapextra);

    // Calculate Below Cap Reward
    if (AcctBalance <= v_cashcap) {
        // monthly balance is below cashcap value
        // so our below cap reward is based on below cap rate (determined from transaction count)
        v_belowcapreward = (AcctBalance * v_belowcaprewardrate) / 12.0;
    } else {
        // can only be greater than
        v_belowcapreward = ((AcctBalance - v_abovecapextra) * v_belowcaprewardrate) / 12.0;
    }
    cdebug('Below Cap Reward = ' + v_belowcapreward);

    // Calculate Above Cap Reward
    v_abovecapreward = (v_abovecapextra * (v_abovecapapr / 100.0)) / 12.0;
    cdebug('Above Cap Reward = ' + v_abovecapreward);

    // Calculate Kasasa Cash Montly Reward:
    var v_cashmonthlyreward = v_belowcapreward + v_abovecapreward;
    cdebug('Monthly Cash Reward = ' + v_cashmonthlyreward);

    // Calculate Kasasa Cash Annual Reward:
    var v_cashannualreward = v_cashmonthlyreward * 12.0;
    cdebug('Annual Cash Reward = ' + v_cashannualreward);


    // determine recommended product
    var v_breakevenbal = 1000 * (v_belowcaprewardrate / 12.0); // spreadsheet cell E6
    var v_breakevendiff = (v_cashbackmax / v_breakevenbal) * 1000; // spreadsheet cell D14

    // determine and update recommended product
    // current recommendation
    var v_recproduct = $('#v_recproduct').val();
    // determine calculated recommendation
    if (AcctBalance > v_breakevendiff) {
        // rec product is kasasa cash
        //  only change if different than currently shown rec prod
        if (v_recproduct != 'kc') {
            // rec prod has changed from kcb to kc
            $("#v_recproduct_kcb").hide();
            $("#v_recproduct_kc").show();
            $('#v_recproduct').val('kc');
        } else {
            // rec prod has not changed so nothing to be done
        }
    } else {
        // rec product is kasasa cash back
        //  only change if different than currently shown rec prod
        if (v_recproduct != 'kcb') {
            // rec prod has changed from kc to kcb
            $("#v_recproduct_kc").hide();
            $("#v_recproduct_kcb").show();
            $('#v_recproduct').val('kcb');
        } else {
            // rec prod has not changed so nothing to be done
        }
    }
    //console.log('Recommended product is ' + v_recproduct);


    // update values:
    $('#IntMonth').html(v_cashmonthlyreward.toFixed(2));
    $('#IntYear').html(v_cashannualreward.toFixed(2));



    return;

}