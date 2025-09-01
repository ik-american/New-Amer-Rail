/* 
   CalcMMA-cloneable.js
 */
var cal_CalcInteractionDetected = false;
var CalcTimerInterval_ms = 2000;
var timerID;

//=========================================================
// begin CalcMMA object
//---------------------------------------------------------
var CalcMMA = {
    instances: [],
    enablelog: false,
    defaultTerm: 5,
    CalcData: []
}

CalcMMA.initialize = function() {

    // determine how many of these calculators are on the page:
    $("div[data-calcinstance]").each(function() {
        var instance = $(this).data('calcinstance');
        var inst_selector = "div[data-calcinstance='" + instance + "'] ";
        var ratedata = [];
        CalcMMA.instances.push(instance);

        // Harvest rate data from template
        $(inst_selector + 'i.vc3_data_rates').each(function(i, obj) {
            bf = Number($(this).attr('data-BalanceFrom'));
            bt = Number($(this).attr('data-BalanceTo'));
            var ir = $(this).attr('data-IntRate');
            ir = ir.replace(/%/g, "");
            var irn = Number(ir);
            ratedata[i] = {
                balfrom: bf,
                balto: bt,
                intrate: irn
            };
        });

        var BegBalance = Number($(inst_selector + 'i.calcmma-data').attr('data-BegBalance'));
        var minReqBalance = Number($(inst_selector + 'i.calcmma-data').attr('data-minBegBalance'));
        var BalChangeAmount = Number($(inst_selector + 'i.calcmma-data').attr('data-BalChangeAmount'));
        var TermChangeAmount = Number($(inst_selector + 'i.calcmma-data').attr('data-TermChangeAmount'));
        var DepChangeAmount = Number($(inst_selector + 'i.calcmma-data').attr('data-DepChangeAmount'));

        CalcMMA.CalcData.push({
            instance: instance,
            BegBalance: BegBalance,
            minReqBalance: minReqBalance,
            BalChangeAmount: BalChangeAmount,
            TermChangeAmount: TermChangeAmount,
            DepChangeAmount: DepChangeAmount,
            curr_initbal: 0,
            curr_years: 0,
            curr_mondep: 0,
            last_initbal: -1,
            last_years: -1,
            last_mondep: -1,
            RateData: ratedata
        });

    });

    // now do the initial recalculation for each individual calculator:
    var init_value = 0;
    for (var inst = 0; inst < this.instances.length; inst++) {
        var this_instance = this.instances[inst];
        var inst_selector = "div[data-calcinstance='" + this_instance + "'] ";

        // set initial values for user-interactive values:
        //
        // beginning balance:
        init_value = this.getVariable(this_instance, 'BegBalance');
        $(inst_selector + '.vc3_initial_balance').val(init_value);
        this.setVariable(this_instance, 'curr_initbal', init_value);

        // beginning term:
        $(inst_selector + '.vc3_calcyears').val(this.defaultTerm);
        this.setVariable(this_instance, 'curr_years', this.defaultTerm);

        // beginning monthly deposit:
        init_value = this.getVariable(this_instance, 'DepChangeAmount');
        $(inst_selector + '.vc3_monthlydeposit').val(init_value);
        this.setVariable(this_instance, 'curr_mondep', init_value);

        this.recalculate(this_instance);
    }

}

CalcMMA.moneyfmt = function(num) {
    return "$" + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

CalcMMA.chgTerm = function(op, instance) {
    var inst_selector = "div[data-calcinstance='" + instance + "'] ";

    var trm = this.getVariable(instance, 'curr_years');
    var TermChangeAmount = this.getVariable(instance, 'TermChangeAmount');

    if (isNaN(trm)) {
        $(inst_selector + '.vc3_calcyears').val(this.defaultTerm);
        this.setVariable(instance, 'curr_years', this.defaultTerm);
    } else {
        switch (op) {
            case '-':
                if (trm > TermChangeAmount) {
                    trm -= TermChangeAmount;
                    $(inst_selector + '.vc3_calcyears').val(trm);
                    this.setVariable(instance, 'curr_years', trm);
                    this.recalculate(instance);
                }
                break;
            case '+':
                trm += TermChangeAmount;
                $(inst_selector + '.vc3_calcyears').val(trm);
                this.setVariable(instance, 'curr_years', trm);
                this.recalculate(instance);
                break;
            default:
                break;
        }

    }
}


CalcMMA.chgBal = function(op, instance) {

    var inst_selector = "div[data-calcinstance='" + instance + "'] ";

    var bal = this.getVariable(instance, 'curr_initbal');
    var BalChangeAmount = this.getVariable(instance, 'BalChangeAmount');
    var minReqBalance = this.getVariable(instance, 'minReqBalance');
    var BegBalance = this.getVariable(instance, 'BegBalance');

    if (isNaN(bal)) {
        $(inst_selector + '.vc3_initial_balance').val(BegBalance);
    } else {
        if (cal_CalcInteractionDetected === false) {
            cal_CalcInteractionDetected = true;
            cal_initInteraction();
        }
        switch (op) {
            case '-':
                if (bal > minReqBalance) {
                    bal -= BalChangeAmount;
                    $(inst_selector + '.vc3_initial_balance').val(bal);
                    this.setVariable(instance, 'curr_initbal', bal);
                    this.recalculate(instance);
                }
                break;
            case '+':
                bal += BalChangeAmount;
                $(inst_selector + '.vc3_initial_balance').val(bal);
                this.setVariable(instance, 'curr_initbal', bal);
                this.recalculate(instance);
                break;
            default:
                break;
        }

    }
}

CalcMMA.chgDep = function(op, instance) {
    var inst_selector = "div[data-calcinstance='" + instance + "'] ";

    var dep = this.getVariable(instance, 'curr_mondep');
    var DepChangeAmount = this.getVariable(instance, 'DepChangeAmount');

    if (isNaN(dep)) {
        var init_value = this.getVariable(this_instance, 'DepChangeAmount');
        $(inst_selector + '.vc3_monthlydeposit').val(init_value);

    } else {
        switch (op) {
            case '-':
                if (dep >= DepChangeAmount) {
                    dep -= DepChangeAmount;
                    this.setVariable(instance, 'curr_mondep', dep);
                    $(inst_selector + '.vc3_monthlydeposit').val(dep);
                    this.recalculate(instance);
                }
                break;
            case '+':
                dep += DepChangeAmount;
                this.setVariable(instance, 'curr_mondep', dep);
                $(inst_selector + '.vc3_monthlydeposit').val(dep);
                this.recalculate(instance);
                break;
            default:
                break;
        }

    }
}


CalcMMA.getVariable = function(instance, variable) {
    var ret = false;
    for (var r = 0; r < this.CalcData.length; r++) {
        dataObj = this.CalcData[r];
        if (dataObj.instance == instance) {
            for (var prop in dataObj) {
                if (prop == variable) {
                    return dataObj[prop];
                }
            }
        }
    }
    return false;
}
CalcMMA.setVariable = function(instance, variable, value) {
    var ret = false;
    for (var r = 0; r < this.CalcData.length; r++) {
        dataObj = this.CalcData[r];
        if (dataObj.instance == instance) {
            for (var prop in dataObj) {
                if (prop == variable) {
                    this.CalcData[r][prop] = value;
                    return dataObj[prop];
                }
            }
        }
    }
    return false;
}

CalcMMA.recalculateAll = function() {
    for (var inst = 0; inst < this.instances.length; inst++) {
        var instance = this.instances[inst];
        this.recalculate(instance);
    }
}

CalcMMA.log = function(msg) {
    if (this.enablelog) {
        console.log(msg);
    }
}

CalcMMA.recalculate = function(instance) {
    CalcMMA.log('recalc');

    // inst_selector is a jquery selector prefix that isolates the selector
    //  to within a single instance of the calculator
    var inst_selector = "div[data-calcinstance='" + instance + "'] ";

    // get the form values
    var form_initbal = Number($(inst_selector + "input[name='vc3_initial_balance']").val());
    var form_years = Number($(inst_selector + "input[name='vc3_calcyears']").val());
    var form_mondep = Number($(inst_selector + "input[name='vc3_monthlydeposit']").val());

    //console.log("L9");
    //console.log(form_mondep);

    // get the values remembered from last update
    var last_initbal = this.getVariable(instance, 'last_initbal');
    var last_years = this.getVariable(instance, 'last_years');
    var last_mondep = this.getVariable(instance, 'last_mondep');

    // get the current saved values
    var curr_initbal = this.getVariable(instance, 'curr_initbal');
    var curr_years = this.getVariable(instance, 'curr_years');
    var curr_mondep = this.getVariable(instance, 'curr_mondep');

    // if form values differ from saved current values then we need to update
    if (form_initbal != curr_initbal) {
        this.setVariable(instance, 'curr_initbal', form_initbal);
        curr_initbal = form_initbal;
    }
    if (form_years != curr_years) {
        this.setVariable(instance, 'curr_years', form_years);
        curr_years = form_years;
    }
    if (form_mondep != curr_mondep) {
        this.setVariable(instance, 'curr_mondep', form_mondep);
        curr_mondep = form_mondep;
    }



    // check that balance input value is valid integer:
    var legalNum = /^[\d,]+$/;
    if (!legalNum.test(curr_initbal)) {
        $(inst_selector + '.bal_error').show();
        return false;
    } else {
        $(inst_selector + '.bal_error').hide();
    }

    // check that years input value is valid integer:
    var legalNum = /^\d+$/;
    if (!legalNum.test(curr_years)) {
        $(inst_selector + '.term_error').show();
        return false;
    } else {
        $(inst_selector + '.term_error').hide();
    }

    // check that deposit input value is valid integer:
    var legalNum = /^\d+$/;
    if (!legalNum.test(curr_mondep)) {
        $(inst_selector + '.dep_error').show();
        return false;
    } else {
        $(inst_selector + '.dep_error').hide();
    }


    if ((last_initbal == curr_initbal) && (last_years == curr_years) && (last_mondep == curr_mondep)) {
        CalcMMA.log('unchanged, recalc aborted');
        // values unchanged since last recalc
        return;
    }



    if (curr_initbal == -10) {
        $(inst_selector + '.vc3_initial_balance').trigger('focus');
    } else if (curr_years == -10) {
        $(inst_selector + '.vc3_calcyears').trigger('focus');
    } else {

        var vc3_intrate;
        var vc3_months = 0;
        vc3_months = curr_years * 12;

        var run_bal = curr_initbal;
        var mon_dep = curr_mondep;

        var int_earn = 0;
        var accum_int = 0;
        var ann_int = 0;
        var accum_dep = curr_initbal;
        var ann_dep = 0;
        var yr_cnt = 0;
        var dep_cnt = 0;

        // loop through months of term
        //  balance determines interest rate
        var RateData = this.getVariable(instance, 'RateData');
        for (var i = 1; i <= vc3_months; i++) {

            vc3_intrate = 0.0;

            for (var r = 0; r < RateData.length; r++) {
                dataObj = RateData[r];
                if (run_bal >= dataObj.balfrom && run_bal < dataObj.balto) {
                    vc3_intrate = dataObj.intrate;
                }

            }

            dec_rate = vc3_intrate / 100 / 12;
            int_earn = run_bal * dec_rate;
            run_bal += int_earn;
            accum_int += int_earn;
            ann_int += int_earn;
            run_bal += mon_dep;
            ann_dep += mon_dep;
            accum_dep += mon_dep;

        }


        // new data-based:
        $(inst_selector + "*[data-calcresult='FutureValue']").text(this.moneyfmt(run_bal));
        $(inst_selector + "*[data-calcresult='TotalDeposits']").text(this.moneyfmt(accum_dep));
        $(inst_selector + "*[data-calcresult='TotalInterest']").text(this.moneyfmt(accum_int));

        // update values in the narrative
        // new data-based:
        $(inst_selector + "*[data-calcresult='initialbalance']").text(this.moneyfmt(curr_initbal));
        $(inst_selector + "*[data-calcresult='monthlydeposit']").text(this.moneyfmt(curr_mondep));
        $(inst_selector + "*[data-calcresult='termyears']").text(curr_years);
        $(inst_selector + "*[data-calcresult='futurebalance']").text(this.moneyfmt(run_bal));
        $(inst_selector + "*[data-calcresult='totaldeposits']").text(this.moneyfmt(accum_dep));
        $(inst_selector + "*[data-calcresult='totalinterest']").text(this.moneyfmt(accum_int));
        $(inst_selector + "*[data-calcresult='interestrate']").text(vc3_intrate);

    }

    CalcMMA.log(this.CalcData);

    // update value memory for recalc minimizing
    this.setVariable(instance, 'last_initbal', curr_initbal);
    this.setVariable(instance, 'last_years', curr_years);
    this.setVariable(instance, 'last_mondep', curr_mondep);


}
//=========================================================
// end CalcMMA object
//---------------------------------------------------------


function cal_initInteraction() {
    //$("div.calc-container .post-interaction").delay(2500).fadeIn(2000);
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

function reCalcMMA() {
    CalcMMA.recalculateAll();
}

function startTimerReCalc() {
    CalcMMA.log('activating timer');
    timerID = setInterval(reCalcMMA, CalcTimerInterval_ms);
}

function stopTimerReCalc() {
    CalcMMA.log('deactivating timer');
    clearInterval(timerID);
    reCalcMMA();
}

$(function() {

    CalcMMA.initialize();

    $('.recalctimer').on("focus", startTimerReCalc);
    $('.recalctimer').on("blur", stopTimerReCalc);

});