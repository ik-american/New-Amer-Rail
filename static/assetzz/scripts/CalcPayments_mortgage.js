const currentyear = new Date().getFullYear();

var cal_CalcInteractionDetected = false;
var cal_amtFieldID = 'cal_amt';
var cal_dataForPDF = {};
var subname;
var subemail;
var numMonthsMax = 0;


$(function() {

    cal_amtFieldIDVal = $('#' + cal_amtFieldID).val();
    LastAutoLoanAmt = 0;
    TotalAutoLoanAmt = +cal_amtFieldIDVal;
    cal_totalprice();
    initcalc();
    recalc();

    // If the Calculator Results form is submitted, fire the CalcPDF function to generate the PDF file
    /*
    document.querySelector('#L9Form').addEventListener('submit', function() {
    	event.preventDefault()
    	console.log("Calc form was submitted");
    	//formID = this.elements.form_identifier.value;
    	subname =  this.elements.nameaddress_1.value;
    	subemail =  this.elements.email_2.value;
    	//console.log(formID);
    	//console.log('Subname is: ' + subname);
    	//console.log('Subemail is: ' + subemail);
    	calcAmort();
    	CalcPDF('email');
    });
    */

});

function cal_totalprice() {
    AutoLoanAmt = $('#' + cal_amtFieldID).val();
    LastAutoLoanAmt = TotalAutoLoanAmt;
    TotalAutoLoanAmt = +AutoLoanAmt;
    TotalAutoLoanAmt_formatted = cal_addCommas(TotalAutoLoanAmt);

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

function cal_chgAmount() {
    cal_totalprice();
    initcalc();
    recalc();
    if (cal_CalcInteractionDetected === false) {
        cal_CalcInteractionDetected = true;
        cal_initInteraction();
    }

}

function initcalc() {

    cal_mort_apr = $("input[name='numMonths']:checked").data('apr');
    if (typeof cal_mort_apr != 'number') {
        cal_mort_apr = cal_mort_apr.replace(/%/g, "");
    }
    $("#cal_mort_apr").val(cal_mort_apr);
    cal_mort_term = $("input[name='numMonths']:checked").val();

    // find greatest term
    numMonthsMax = 0;
    $("input:radio[name='numMonths']").each(function() {
        var nm = parseInt($(this).val());
        if (nm > numMonthsMax) {
            numMonthsMax = nm;
        }
    });

    recalc();
}

function recalc() {

    // get current values
    var cal_amt = $('#cal_amt').val(); //starting loan amount
    cal_term = cal_mort_term; //term in years
    apr = cal_mort_apr;
    //console.log('Total loan amount ' + TotalAutoLoanAmt);

    var term_months = cal_term * 12;

    // calculate monthly payment for current selections
    var pmt = cal_calcPayment(apr / 100.0, TotalAutoLoanAmt, term_months);
    // prepare values for display:
    //Pdisp = cal_Float2Int(pmt,cal_numberoption);
    cal_Pdisp = Math.round(pmt);
    //console.log(cal_Pdisp);

    // update displayed values:
    //
    $(".calcAmt").html(moneyfmt(cal_amt));
    $(".calcTerm").html(cal_term);
    $(".calcAPR").html(apr);
    $(".calcPmt").html(moneyfmt(cal_Pdisp));
    $(".calcTotalLoan").html(moneyfmt(TotalAutoLoanAmt));

    //Amort info
    $("#amort-summary").hide();


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

function cal_calcPayment(r, pv, months) {
    rateperperiod = r / 12.0;
    P = (rateperperiod * pv) / (1 - Math.pow((1 + rateperperiod), -months));
    //console.log('calculating payment on (' + rateperperiod + ',' + pv + ',' + months + ') = ' + P);
    return P;
}

function moneyfmt(num) {
    var numnum = +num;
    return "$" + numnum.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

function mRound(num) {
    return Math.round(num * 100) / 100;
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

function calcAmort() {
    var prin = TotalAutoLoanAmt;
    console.log('Current APR ' + apr);
    //console.log("Loan Amount: " + prin);
    //prin = prin.replace(/\,/g, ""); - ERROR
    var orig_prin = Number(prin);
    var theapr = apr;
    //console.log("Rate: " + theapr);
    //theapr = theapr.replace(/%/g, ""); - ERROR

    var term_months = cal_term;
    //console.log("Term: " + term_months);
    var pmt = calcMonthlyPayment(prin, term_months, theapr);
    var orig_pmt = moneyfmt(pmt);

    var accum_pmts = 0;
    var accum_int = 0;

    var prin_comp = 0; // principal component of payment
    var int_comp = 0; // interest component of payment
    var bal = prin;
    var idx = 0;
    var i = 0;
    var data = [];

    for (idx = 1; idx <= term_months; idx++) {
        i = theapr / 100.0 / 12.0;
        int_comp = Math.round(prin * i * 100) / 100;
        accum_int += int_comp;

        if (idx < term_months) {
            prin_comp = pmt - int_comp;
            prin = mRound(prin - prin_comp);
        } else {
            // last payment
            prin_comp = prin;
            prin = mRound(prin - prin_comp);
            pmt = mRound(prin_comp + int_comp);
        }
        accum_pmts += pmt;
        data[idx] = [idx, pmt, prin_comp, int_comp, prin];


    }
    //console.log("total of payments: " + moneyfmt(accum_pmts));
    //console.log("total interest paid: " + moneyfmt(accum_int));
    //console.table(data);

    var tablediv = $("#amort-table");
    tablediv.html('');
    var headers = ["Year", "Payment", "Principal", "Interest", "Balance"];
    makeTable(tablediv, data, headers);

    $(".amort-amt").text(moneyfmt(orig_prin));
    $(".amort-rate").text(theapr);
    $(".amort-term").text(term_months);
    $(".amort-pmt").text(cal_Pdisp);
    $(".amort-int").text(moneyfmt(accum_int));
    $("#amort-summary").show();

    // package data needed for the PDF
    cal_dataForPDF.calcname = 'Personal Loan Calculator';
    cal_dataForPDF.amount = moneyfmt(orig_prin);
    cal_dataForPDF.apr = theapr;
    cal_dataForPDF.term = term_months;
    cal_dataForPDF.pmt = cal_Pdisp;
    cal_dataForPDF.interest = moneyfmt(accum_int);
    cal_dataForPDF.subname = subname;
    cal_dataForPDF.subemail = subemail;
    cal_dataForPDF.amortarray = data;

    if (cal_CalcInteractionDetected === false) {
        cal_CalcInteractionDetected = true;
        cal_initInteraction();
    }

}

function makeTable(container, data, headings) {
    var table = $("<table/>").addClass('amort-table');
    var thead = $("<thead/>");
    var hrow = $("<tr/>");
    $.each(headings, function(colIndex, c) {
        hrow.append($("<th/>").text(c));
    });
    thead.append(hrow);
    table.append(thead);

    for (var rowIndex = 1, l = data.length; rowIndex < l; rowIndex++) {
        r = data[rowIndex];
        var row = $("<tr/>");
        for (var colIndex = 0, cl = r.length; colIndex < cl; colIndex++) {
            c = r[colIndex];
            var cval = c;
            var display = false;
            switch (colIndex) {
                // 0: integer of month number
                case 0:
                    display = true;
                    break;

                    // 1: payment amount
                case 1:
                    display = true;
                    cval = moneyfmt(cval);
                    break;

                    // 2: principal component of payment
                case 2:
                    display = true;
                    cval = moneyfmt(cval);
                    break;

                    // 3: interest component of payment
                case 3:
                    // 4: balance
                case 4:
                    display = true;
                    cval = moneyfmt(cval);
                    break;
                default:
                    display = true;
                    break;
            }
            if (display) {
                row.append($("<t" + (rowIndex == 0 ? "h" : "d") + "/>").text(cval));
            }
        }
        table.append(row);
    }
    return container.append(table);
}

function calcMonthlyPayment(V, t, apr) {
    // t = total number of payments (term, years*months)
    // V = loan amount
    // apr = APR expressed as float like 3.5
    var P = 0;
    var pow = 1;
    if (apr == 0) {
        P = V / t;
    } else {
        apr = apr / 100.0 / 12;
        for (var j = 0; j < t; j++) {
            pow = pow * (1 + apr);
        }
        P = (V * pow * apr) / (pow - 1);
    }
    //console.log("pmt calculated as " + P);
    //console.log("rounded: " + Math.round(P*100)/100);
    P = Math.round(P * 100) / 100;
    return P;
}

// create and downloand PDF of calculator results
function CalcPDF(mode) {
    console.log("PDF area");
    //console.log(mode);
    ////
    //.e.preventDefault();
    var url_params = {
        mod: 'calcs',
        action: mode, //either pdf or email, coming from the link to the function in the bit type
        data: JSON.stringify(cal_dataForPDF)
    };
    encoded_params = $.param(url_params);
    $.ajax({
            type: 'POST',
            async: false,
            url: '/render.php',
            //dataType: "json",
            data: encoded_params,
            timeout: 15000,
            cache: false
        })
        .done(function(resultsObj) {
            if ('status' in resultsObj) {
                if (mode == 'pdf') {
                    if ('pdfpath' in resultsObj) {
                        window.open(resultsObj.pdfpath);
                    }
                }
            }
        })
        .fail(function(XMLHttpRequest, textStatus, errorThrown) {
            $('#dialog_detail').text("We're sorry. Your request could not be processed.");
            $('#dialog').dialog("open");
        });

};