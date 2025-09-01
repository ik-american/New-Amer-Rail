/*

	Auto Loan Payment Estimator
		* user provides loan amount, we calculate payment
		* has been modified to play well with other calculators on a page

*/

var cal_CalcTimerActive = false;
var cal_CalcInteractionDetected = false;
var cal_reCalcTimer;
var cal_reCalcInterval = 500; // 1000 = one second
var cal_changeAmount = 1000;
var cal_changeAmount2 = 250;
var cal_amtFieldID = 'cal_amt';
var cal_amt2FieldID = 'cal_amt2';
var cal_totalFieldID = 'TotalCost';
var cal_amtErrorFieldID = 'cal_amt_error';
var cal_LoanAmountFieldPrefix = 'cal_LoanAmount';
var cal_LoanRateFieldPrefix = 'cal_LoanRate';
var cal_LoanTermFieldPrefix = 'cal_LoanTerm';
var numMonthsMax = 0;

$(function() {
    var cal_pmtfld = document.getElementById(cal_amtFieldID);
    cal_pmtfld.onfocus = cal_cal_reCalcLoanPaymentsTimer;
    var cal_pmtfld2 = document.getElementById(cal_amt2FieldID);
    cal_pmtfld2.onfocus = cal_cal_reCalcLoanPaymentsTimer;

    var cal_amtFieldIDVal = $('#' + cal_amtFieldID).val();
    var cal_amt2FieldIDVal = $('#' + cal_amt2FieldID).val();
    LastAutoLoanAmt = 0;
    TotalAutoLoanAmt = +cal_amtFieldIDVal - +cal_amt2FieldIDVal;
    cal_totalprice();
    //cal_reCalcLoanPayments();
    initcalc();
    recalc();

});

function cal_totalprice() {
    AutoLoanAmt = $('#' + cal_amtFieldID).val();
    AutoDownPmtAmt = $('#' + cal_amt2FieldID).val();
    LastAutoLoanAmt = TotalAutoLoanAmt;
    TotalAutoLoanAmt = +AutoLoanAmt - +AutoDownPmtAmt;
    TotalAutoLoanAmt_formatted = cal_addCommas(TotalAutoLoanAmt);
    //display the result
    var divobj = document.getElementById('TotalCost');
    divobj.style.display = 'block';
    divobj.innerHTML = "Loan Amount: $" + TotalAutoLoanAmt_formatted;
    initcalc();
    recalc();
}

function cal_initInteraction() {
    //$("div.calc-container .post-interaction").delay(2500).fadeIn(2000);
    // optionally record a personalization interest hit:
    $container = $("div.calc-container .post-interaction");
    if (typeof $container.data('perstag-scripted') !== 'undefined') {
        perstag_value = $container.data('perstag-scripted');
        bid = $container.data('bid'); // bit id

        if (!isNaN(perstag_value) && (perstag_value != '')) {
            PERS.send('click', perstag_value, bid);
        }
    }
}

function cal_cal_reCalcLoanPaymentsTimer() {
    if (!cal_CalcTimerActive) {
        // timer is not active, activate it
        cal_CalcTimerActive = true;
        cal_reCalcTimer = setInterval(cal_totalprice, cal_reCalcInterval);
    }
}

function cal_chgAmount(op) {
    pmtv = parseInt($('#' + cal_amtFieldID).val());
    if (isNaN(pmtv)) {
        $('#' + cal_amtFieldID).val(350);
    } else {
        if (cal_CalcInteractionDetected === false) {
            cal_CalcInteractionDetected = true;
            cal_initInteraction();
            cal_totalprice();
        }
        switch (op) {
            case '-':
                if (pmtv > cal_changeAmount) {
                    pmtv -= cal_changeAmount;
                    $('#' + cal_amtFieldID).val(pmtv);
                    cal_totalprice();
                    //cal_reCalcLoanPayments();
                    initcalc();
                    recalc();
                }
                break;
            case '+':
                pmtv = parseInt($('#' + cal_amtFieldID).val());
                pmtv += cal_changeAmount;
                $('#' + cal_amtFieldID).val(pmtv);
                cal_totalprice();
                //cal_reCalcLoanPayments();
                initcalc();
                recalc();
                break;
            default:
                break;
        }

    }
}

function cal_chgAmount2(op) {
    pmtv = parseInt($('#' + cal_amt2FieldID).val());
    if (isNaN(pmtv)) {
        $('#' + cal_amt2FieldID).val(50);
    } else {
        if (cal_CalcInteractionDetected === false) {
            cal_CalcInteractionDetected = true;
            cal_initInteraction();
            cal_totalprice();
        }
        switch (op) {
            case '-':
                if (pmtv > cal_changeAmount2) {
                    pmtv -= cal_changeAmount2;
                    $('#' + cal_amt2FieldID).val(pmtv);
                    cal_totalprice();
                    //cal_reCalcLoanPayments();
                    initcalc();
                    recalc();
                }
                break;
            case '+':
                pmtv = parseInt($('#' + cal_amt2FieldID).val());
                pmtv += cal_changeAmount2;
                $('#' + cal_amt2FieldID).val(pmtv);
                cal_totalprice();
                //cal_reCalcLoanPayments();
                initcalc();
                recalc();
                break;
            default:
                break;
        }

    }
}


/* cal_Float2Int
    options:
        truncate:  return integer portion with no rounding
        roundtens: return integer rounded DOWN to nearest ten
        roundhundreds: return integer rounded DOWN to nearest hundred
    */
function cal_Float2Int(x, oper) {
    switch (oper) {
        case 'truncate':
            return parseInt(x);
            break;
        case 'roundtens':
            y = parseInt(x / 10);
            y = y * 10;
            return y;
        case 'roundhundreds':
            y = parseInt(x / 100);
            y = y * 100;
            return y;
        default:
            return x;
    }
}

function cal_RoundOff(n) {
    var cal_adj = 0;
    n = n - cal_adj;
    nup = Math.round(n / 100);
    return Math.round(n);
}

function cal_calcLoanValue(I, N, M) {
    J = I / 12.0;
    N = N;
    P = M / (J / (1 - Math.pow((1 + J), -N)));
    return P;
}

function cal_calcPayment(r, pv, months) {
    rateperperiod = r / 12.0;
    P = (rateperperiod * pv) / (1 - Math.pow((1 + rateperperiod), -months));
    //console.log('calculating payment on (' + rateperperiod + ',' + pv + ',' + months + ') = ' + P);
    return P;
}

function cal_addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var cal_rgx = /(\d+)(\d{3})/;
    while (cal_rgx.test(x1)) {
        x1 = x1.replace(cal_rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

//new for month selection
function initcalc() {
    cal_auto_apr = $("input[name='numMonths']:checked").data('apr');
    if (typeof cal_auto_apr != 'number') {
        cal_auto_apr = cal_auto_apr.replace(/%/g, "");
    }
    $("#cal_auto_apr").val(cal_auto_apr);
    cal_auto_months = $("input[name='numMonths']:checked").val();

    // find greatest term
    numMonthsMax = 0;
    $("input:radio[name='numMonths']").each(function() {
        var nm = parseInt($(this).val());
        if (nm > numMonthsMax) {
            numMonthsMax = nm;
        }
    });

}

function recalc() {

    // if value hasn't changed since last recalc, just return
    if (TotalAutoLoanAmt == LastAutoLoanAmt) {
        //return;
    } else {
        LastAutoLoanAmt = TotalAutoLoanAmt;
    }

    if (cal_CalcInteractionDetected === false) {
        var cal_amtInitVal = TotalAutoLoanAmt;

        if (LastAutoLoanAmt != cal_amtInitVal) {
            cal_CalcInteractionDetected = true;
            cal_initInteraction();
        }
    }

    LoanAmount = TotalAutoLoanAmt;

    // if the user-entered loan amount has a comma, let's get rid of it:
    var cal_commaRgx = /,/;
    if (cal_commaRgx.test(LoanAmount)) {
        // found a comma, strip it form our variable
        LoanAmount = LoanAmount.replace(/\,/g, "");
        // and from the input field:
        $('#' + cal_amtFieldID).val(LoanAmount);

    }

    // check that input value is valid integer:
    var cal_legalNum = /^[\d]+$/; // allow only numbers
    if (!cal_legalNum.test(LoanAmount)) {
        $('#' + cal_amtErrorFieldID).show();
        return false; // non numeric character found
    } else {
        $('#' + cal_amtErrorFieldID).hide();
    }


    /*
		if( !($('#'+cal_LoanTermFieldPrefix+idx).length && $('#'+cal_LoanRateFieldPrefix+idx).length && $('#'+cal_LoanAmountFieldPrefix+idx).length) ) {
            return;
        }
		*/

    // term of Loan loan in months
    var cal_N = cal_auto_months;
    // interest rate for Loan loan
    var cal_I = cal_auto_apr;
    cal_I = String(cal_I); //without this we were getting a TypeError
    cal_I = cal_I.replace(/%/g, "");
    cal_I = cal_I / 100.0;

    // how should the Loan value (total loan amount) be displayed?
    //  (none of these round up -- only down)
    //
    //   "truncate"        $27,483.77 becomes $27,483
    //   "roundtens"       $27,483.77 becomes $27,480
    //   "roundhundreds"   $27,483.77 becomes $27,400
    //
    var cal_numberoption = 'truncate';

    cal_pv = parseInt(LoanAmount);
    cal_months = cal_N;
    cal_P = cal_calcPayment(cal_I, cal_pv, cal_months)

    // prepare values for display:
    //Pdisp = cal_Float2Int(cal_P,cal_numberoption);
    cal_Pdisp = Math.round(cal_P);
    //console.log(cal_Pdisp);
    //display the result
    var divobj = document.getElementById('TotalPayment');
    divobj.style.display = 'block';
    divobj.innerHTML = "$" + cal_Pdisp;

    // update term indicator progress bar
    var barobj = document.getElementById('termbar');
    cal_auto_months = $("input[name='numMonths']:checked").val();
    var pct = 100 * (cal_auto_months / numMonthsMax);
    //barobj.style.width=pct + '%';
    barobj.innerHTML = cal_auto_months + ' Months';
    barobj.setAttribute('aria-valuenow', cal_auto_months);
    barobj.setAttribute('aria-valuemin', 0);
    barobj.setAttribute('aria-valuemax', numMonthsMax);


    var termlabelwid = $('#LoanTermLabel').width();
    var termbuttonid = $("input[name='numMonths']:checked").attr("id");
    var termbuttonlabelelem = $("label[for='" + termbuttonid + "']");
    var termbuttonlabelwidth = $(termbuttonlabelelem).width();
    var termbuttonlabelpos = $(termbuttonlabelelem).offset();
    var termlabelpos = $('#LoanTermLabel').offset();

    // abl = active button label
    var abl_right = termbuttonlabelpos.left + termbuttonlabelwidth;
    //console.log("abl_right = " + abl_right);

    var abl_localoffset = abl_right - termlabelpos.left;
    //console.log("abl_localoffset = " + abl_localoffset);

    // adjustment is 21 for rv calc and 18 for auto
    var adjustment = 0;
    // px:
    //barobj.style.width= (abl_localoffset + adjustment) + 'px';
    // pct:
    var pct = ((abl_localoffset + adjustment) / termlabelwid) * 100;
    barobj.style.width = pct + '%';


}