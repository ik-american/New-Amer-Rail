/* -- BEGIN FILE: pers.js */

var PERS = {
    PERScontainer_selector: 'body',
    activator_selector: 'a[data-perstag],button[data-perstag]',
    homecat_selector: 'div.pers-select-box',
    toolbox_selector: 'div.pers-toolbox',
    reset_selector: 'button.JQPERSreset',
    reset_div_btn_selector: 'div.JQPERSresetbutton',
    reset_div_msg_selector: 'div.JQPERSresetmsg',
    PERSautotag_container_selector: 'div.pers-autotag',
    PERSautotag_activator_selector: 'a,button'
}

PERS.initialize = function() {

    // any div containers marked to autotag?
    if ($(this.PERSautotag_container_selector).length > 0) {
        //console.log('there is autotagging to be done.');
        this.autotag();
    }

    this.addHandlers();
    // if an interest category is set show the home interest selector
    var maincat = $('meta[name=PERSmeta]').data('maincat');
    if (maincat == 'Default') {
        $(this.homecat_selector).show();
    }
}

PERS.autotag = function() {


    $(this.PERSautotag_container_selector).each(function() {
        // get tag to propagate
        $container = $(this);
        if (typeof $container.data('perstag') !== 'undefined') {
            perstag_value = $container.data('perstag');
            $container.find(PERS.PERSautotag_activator_selector).each(function() {
                $elem = $(this);
                $elem.attr("data-perstag", perstag_value);
            });

        } else {
            console.log(PERSautotag_container_selector + ' missing perstag.');
        }
    });

}

PERS.reset = function() {
    console.log('pers reset request sent');
    this.send('reset', 0, 0);
    $(this.reset_div_btn_selector).hide();
    $(this.reset_div_msg_selector).show();
    $(this.toolbox_selector).slideUp();
}

PERS.addHandlers = function() {
    // find all clickable elements within our wrapperclass divs
    //  and apply click handler to it for recording PERS activity

    $(this.PERScontainer_selector).on("click", this.activator_selector, function(e) {
        tag = $(this).data('perstag');
        bid = $(this).data('bid'); // bit id
        if (!isNaN(tag) && (tag != '')) {
            PERS.send('click', tag, bid);
        } else {
            // console.log('PERS hit on missing or incomplete tag "' + tag + '"');
        }
    });

    // reset handler for PERS cookie reset
    $(this.PERScontainer_selector).on("click", this.reset_selector, function(e) {
        PERS.reset();
    });

}

PERS.send = function(cmd, tag, bid) {
    // PERS_UID is global cookie value

    var pageid = $('meta[name=PERSmeta]').data('pgid');
    var url_params = {
        c: cmd,
        t: tag,
        p: pageid,
        b: bid
    };
    encoded_params = $.param(url_params);
    var useBeacon = true;

    if (!navigator.sendBeacon) {
        //alert('no sendBeacon, falling back to ajax');
        useBeacon = false;
    }

    if (useBeacon) {
        var fd = new FormData();
        fd.append('c', cmd);
        fd.append('t', tag);
        fd.append('p', pageid);
        fd.append('b', bid);

        navigator.sendBeacon('/scripts/pers.php', fd);

    } else {
        $.ajax({
            type: "GET",
            async: true,
            url: "/scripts/pers.php",
            data: encoded_params
        });
    }
}

$(function() {
    PERS.initialize();
});

function JQtogglePers() {

    var params = {
        c: 'togglePersonalization'
    };
    encoded_params = $.param(params);

    // submit the toggle-
    $.ajax({
            type: 'POST',
            async: false,
            url: '/scripts/pers.php',
            data: encoded_params,
            timeout: 5000,
            cache: false
        })
        .done(function(resultsObj) {
            if ('status' in resultsObj) {
                var status = resultsObj.status;
                console.log('togglePersonalization returned status ' + status);
            }

        })
        .fail(function(XMLHttpRequest, textStatus, errorThrown) {
            console.log('togglePersonalization failure');
            console.log(textStatus);
            console.log(errorThrown);
        });

}
/* -- END FILE: pers.js */