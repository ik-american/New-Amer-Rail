// perform on load initialization
var errors_occured = false;
var call_was_successful = false;
var response_area = '';
var encoded_params = '';
var ajax_action = '';
var JQajaxResult = false;
var num_of_submits = 0;
var datechk_format = 'mm/dd/yyyy';

$(function() {
    // set default ajax settings
    $.ajaxSetup({
        type: 'GET',
        url: '/render.php',
        timeout: 15000,
        async: false,
        cache: false
    })

    // validate defaults

    jQuery.validator.setDefaults({
        onfocusout: false,
        onkeyup: false,
        onclick: false,
        focusInvalid: false,
        focusCleanup: true,
        errorElement: "div",
        errorClass: "errormsg",
        errorPlacement: function(error, element) {
            // if a placement element exists, use it, otherwise insert the message after the element
            if ($('#' + element.attr('id') + '_errmsg').length > 0) {
                if (element.attr('id') == 'address1' || element.attr('id') == 'address2') {
                    error.appendTo('#address_errmsg');
                } else {
                    error.appendTo('#' + element.attr('id') + '_errmsg');
                }
            } else {
                // no errmsg container exists for this eleement
                if (element.attr('id') == 'address1' || element.attr('id') == 'address2') {
                    error.appendTo('#address_errmsg');
                    error.insertAfter(element);
                } else {
                    if (element.attr('type') == 'radio') {
                        $(element).closest('div').append(error);
                    } else {
                        error.insertAfter(element);
                    }

                }

            }

        }
    });


    // footnote symbol link to footnote and back
    $('body').on("click", '.JQfootnoteLink', function(e) {
        footnoteID = $(this).attr('aria-describedby');
        symbolID = $(this).attr('id');
        $('#' + footnoteID).find('a').attr('href', '#' + symbolID);
    });

    // JQtrack hrefs are trackable events
    $('.JQtrack').on('click', function(e) {
        vTracker($(this));
    });

    // JQnewWindow hrefs open in a new window
    //  (no tracking, an href with this class will have some other tracked class)

    $('body').on("click", 'a.JQnewWindow:not([href^="mailto:"])', function(e) {
        e.preventDefault();
        window.open(this.href);
    });

    // JQfaq toggler
    //  div to expand/toggle located in anchor's data-expid arg
    $('body').on("click", 'a.JQfaq', function(e) {
        e.preventDefault();
        expid = $(this).data('expid');
        $('#' + expid).slideToggle();
        if ($('#' + expid).is(':visible')) {
            vTracker($(this));
            fid = $(this).data('id');
            vtracklocal('FAQ', fid);
        }
    });

    // open speedbump in iframe modal dialog
    $('*[class*="JQspeedbump"]').on('click', function(e) {
        e.preventDefault();
        href = $(this).attr('href');
        id = $(this).attr('id');
        linktext = $(this).text();

        var wWidth = $(window).width();
        var dWidth = Math.round(wWidth * 0.8);
        var wHeight = $(window).height();
        var dHeight = Math.round(wHeight * 0.8);

        // support for alternate speedbump styles:
        bumpstyle = encodeURIComponent($(this).attr('class'));

        $('#dialog_content').load('/render.php', {
            mod: "speedbump",
            action: "display",
            params: 'id~' + id + '|linktext~' + linktext + '|href~' + href + '|style~' + bumpstyle + '|ww~' + wWidth + '|wh~' + wHeight
        });

        if (linktext != '') {
            speedbumptitle = 'External Link - ' + linktext;
        } else {
            speedbumptitle = 'External Link';
        }

        $('#dialog').dialog({
            autoOpen: false,
            // position: { my: "center", at: "center", collision: 'fit' }, //removed as part of jquery3 update
            modal: true,
            overlay: {
                opacity: 0.1,
                background: "black"
            },
            title: speedbumptitle,
            height: "auto",
            maxHeight: dHeight,
            width: '80%',
            open: function() {
                // TJ; the following closes modal on outside click:
                $('.ui-widget-overlay').on('click', function() {
                    $(this).parents("body").find(".ui-dialog-content").dialog("close");
                });

            },
            buttons: {
                'Continue': function() {
                    vTracker($(this), 'Speedbumps', 'Exit', href);
                    $(this).dialog('close');

                    // open new window for all speedbumps:
                    //setTimeout(function() {
                    window.open(href);
                    //}, 100);

                    // or if client requests same window always:
                    //window.location.href = href;
                },
                'Stay': function() {
                    vTracker($(this), 'Speedbumps', 'Stay', href);
                    $(this).dialog('close');
                }
            }
        });

        $('#dialog').dialog("open");

    });

    // open iframe modal window
    $('a.JQmodal').on('click', function(e) {
        e.preventDefault();
        src = $(this).attr('href');
        if ($(this).attr('data-title') !== undefined) {
            wtitle = $(this).attr('data-title');
        } else {
            wtitle = '';
        }

        var wWidth = $(window).width();
        var dWidth = Math.round(wWidth * 0.8);
        var wHeight = $(window).height();
        var dHeight = Math.round(wHeight * 0.8);
        // check for protocol and adjust for http/https
        if (window.location.protocol == 'https:') {
            if (/http:/i.test(src)) {
                src = src.replace(/http:/ig, "https:");
            } else if (src.substr(0, 2) != '//') {
                if (src.substr(0, 1) == '/') {
                    src = "https://" + window.location.hostname + src;
                }
            }
        }

        $('<iframe src="' + src + '" />').dialog({
            autoOpen: true,
            title: wtitle,
            width: dWidth,
            height: dHeight,
            modal: true,
            resizable: true,
            open: function() {
                $(this).css('width', '98%');
                // TJ; the following closes modal on outside click:
                $('.ui-widget-overlay').on('click', function() {
                    $(this).parents("body").find(".ui-dialog-content").dialog("close");
                });
            },
            buttons: {
                'Close': function() {
                    $(this).dialog('close');
                }
            }
        });
    });

    // FAQ Slider logic
    $(".JQSlider").on('click', function(e) {
        event.preventDefault();
        this_href = $(this).attr("href").replace(/javascript:/i, '');
        eval(this_href);
        div_2_toggle = $(this).parent(".JQSlider_parent").children(".slider_content").get(0);
        if ($(this).parent(".JQSlider_parent").children(".faq_icon").length > 0) {
            faq_icon = $(this).parent(".JQSlider_parent").children(".faq_icon").get(0);
            if ($(faq_icon).attr("src") == '/img/icon_faq.gif') {
                $(faq_icon).attr({
                    src: "/img/icon_faq_open.gif"
                });
            } else {
                $(faq_icon).attr({
                    src: "/img/icon_faq.gif"
                });
            }
        }
        $(div_2_toggle).slideToggle();
    });


    // interior content tabs
    $('body').on("click", '.ca_tabs li', function(e) {
        e.preventDefault();
        $('.ca_tabs').find('.current').removeClass("current");
        $(this).addClass('current');

        item_2_select = 'ca_' + $(this).index();
        $('div[class^=ca_panel]:visible').hide();

        $('div[class~=' + item_2_select + ']').show();

        vTracker($(this), 'Tabs', 'Tab Clicks', $(this).text());
    });


    // establish normal dialog parameters
    $('#dialog').dialog({
        autoOpen: false,
        // position: { my: "center center", at: "center center"}, //removed as part of jquery3 update
        modal: true,
        height: 'auto',
        width: 450,
        buttons: {
            'Ok': function() {
                $(this).dialog('close');
            }
        }

    });

    // additional validator methods
    jQuery.validator.addMethod("phoneUS", function(phone_number, element) {
        phone_number = phone_number.replace(/\s+/g, "");
        return this.optional(element) || phone_number.length > 9 &&
            phone_number.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
    }, "Please specify a valid phone number (format ###-###-####)");


    // Track PDF links
    $('body').on("click", 'a[href$=".pdf"]', function(e) {
        vTracker($(this), 'PDF Document Views', $(this).text(), $(this).attr('href'));
    });

    $('.formDatePicker').datepicker({
        showSecond: false,
        dateFormat: 'mm/dd/yy'
    });

    // validate date check mm/dd/yyyy
    jQuery.validator.addMethod(
        "dateCHK",
        function(value, element) {
            var check = false;
            datechk_format = 'mm/dd/yyyy';
            if ($(element).is('[data-date-format]')) {
                datechk_format = $(element).attr('data-date-format');
                switch ($(element).attr('data-date-format')) {
                    case 'mm/dd/yyyy':
                        var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
                        if (re.test(value)) {
                            var adata = value.split('/');
                            var mm = parseInt(adata[0], 10); // was gg (giorno / day)
                            var dd = parseInt(adata[1], 10); // was mm (mese / month)
                            var yyyy = parseInt(adata[2], 10); // was aaaa (anno / year)
                            var xdata = new Date(yyyy, mm - 1, dd);
                            if ((xdata.getFullYear() == yyyy) && (xdata.getMonth() == mm - 1) && (xdata.getDate() == dd)) {
                                check = true;
                            } else {
                                check = false;
                            }
                        }
                        break;
                    case 'mm/yyyy':
                        var re = /^\d{1,2}\/\d{4}$/;
                        if (re.test(value)) {
                            var adata = value.split('/');
                            var mm = parseInt(adata[0], 10); // was gg (giorno / day)
                            var dd = 1; // was mm (mese / month)
                            var yyyy = parseInt(adata[1], 10); // was aaaa (anno / year)
                            var xdata = new Date(yyyy, mm - 1, dd);
                            if ((xdata.getFullYear() == yyyy) && (xdata.getMonth() == mm - 1) && (xdata.getDate() == dd)) {
                                check = true;
                            } else {
                                check = false;
                            }
                        }
                        break;
                    case 'yyyy/mm/dd':
                        var re = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
                        if (re.test(value)) {
                            var adata = value.split('/');
                            var yyyy = parseInt(adata[0], 10); // was gg (giorno / day)
                            var mm = parseInt(adata[1], 10); // was mm (mese / month)
                            var dd = parseInt(adata[2], 10); // was aaaa (anno / year)
                            var xdata = new Date(yyyy, mm - 1, dd);
                            if ((xdata.getFullYear() == yyyy) && (xdata.getMonth() == mm - 1) && (xdata.getDate() == dd)) {
                                check = true;
                            } else {
                                check = false;
                            }
                        }
                        break;
                    case 'freeform':
                        check = true;
                        break;
                    case 'useDatePicker':
                        check = true;
                        break;
                    default:
                        var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
                        if (re.test(value)) {
                            var adata = value.split('/');
                            var mm = parseInt(adata[0], 10); // was gg (giorno / day)
                            var dd = parseInt(adata[1], 10); // was mm (mese / month)
                            var yyyy = parseInt(adata[2], 10); // was aaaa (anno / year)
                            var xdata = new Date(yyyy, mm - 1, dd);
                            if ((xdata.getFullYear() == yyyy) && (xdata.getMonth() == mm - 1) && (xdata.getDate() == dd)) {
                                check = true;
                            } else {
                                check = false;
                            }
                        } else {
                            check = false;
                        }
                        break;
                }
            } else {
                var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
                if (re.test(value)) {
                    var adata = value.split('/');
                    var mm = parseInt(adata[0], 10); // was gg (giorno / day)
                    var dd = parseInt(adata[1], 10); // was mm (mese / month)
                    var yyyy = parseInt(adata[2], 10); // was aaaa (anno / year)
                    var xdata = new Date(yyyy, mm - 1, dd);
                    if ((xdata.getFullYear() == yyyy) && (xdata.getMonth() == mm - 1) && (xdata.getDate() == dd)) {
                        check = true;
                    } else {
                        check = false;
                    }
                } else {
                    check = false;
                }
            }
            return this.optional(element) || check;
        },
        function(params, element) {
            return formatValidatorDateChkMsg();
        }
    );

    // validate zip code check with optional last four
    jQuery.validator.addMethod(
        "zipCHK",
        function(value, element) {
            var check = false;
            var re = /^\d{5}(-\d{4})?$/;
            if (re.test(value)) {
                check = true;
            } else {
                check = false;
            }
            return this.optional(element) || check;
        },
        "Please enter a valid zip code"
    );

    // validate select box selected items value must not be blank
    jQuery.validator.addMethod(
        "JQforceSelect",
        function(value, element) {
            var check = false;
            if (value == '') {
                check = false;
            } else {
                check = true;
            }

            return check;
        },
        "Select an item from the list"
    );

    // validate captcha validation
    jQuery.validator.addMethod(
        "JQcaptcha",
        function(value, element) {
            var JQajaxResult = false;
            var formID = $(element).closest("form").attr('id');
            if ($('input[name=serial_number]').length == 0) {
                serial_num = '';
            } else {
                serial_num = $('input[name=serial_number]').val();
            }
            var url_params = {
                // if more than one captcha, access by id will fail validation
                fks: $('#' + formID).find('input[name="formkey_sys"]').val(),
                fku: $('#' + formID).find('input[name="formkey_user"]').val(),
                serial_number: serial_num
            };
            encoded_params = $.param(url_params);

            $.ajax({
                    type: "GET",
                    url: "/scripts/captcha_validator.php",
                    dataType: 'json',
                    async: false,
                    data: encoded_params
                })
                .done(function(resultsObj) {

                    if ('status' in resultsObj && resultsObj.status == 'success') {
                        if ('serial_number' in resultsObj) {
                            if ($('input[name=serial_number]').length == 0) {
                                $('<input>').attr({
                                    type: 'hidden',
                                    id: 'serial_number',
                                    name: 'serial_number',
                                    value: resultsObj.serial_number
                                }).appendTo('#' + formID);
                            }
                        }
                        JQajaxResult = true;
                    } else {
                        JQajaxResult = false;
                    }
                })
                .fail(function(results) {
                    alert("We're sorry, our processing system is currently unavailable. Please try again later.");
                    JQajaxResult = false;
                });
            return JQajaxResult;
        },
        "Correct security field code is required."
    );

    // handle hash URLs to thispage.html#goto_3 to automatically select and scroll to tabbed content
    if (window.location.hash) {
        var hash = window.location.hash.substring(1);
        if (hash.substr(0, 5) == 'goto_') {
            var hparts = hash.split('_');
            var tabnum = parseInt(hparts[1]);
            $('.ca_tabs li:nth-child(' + tabnum + ')').trigger('click');
            var anch = 'goto_' + tabnum;
            if ($('#' + hash).length > 0) {
                $('html, body').animate({
                    scrollTop: $('#' + anch).offset().top
                }, 'slow');
            }
        }
    }

    // needed to support #goto_X links to current page:
    $("a[href*='#goto_']").on('click', function(e) {
        var hashf = this.href.split('#');
        var hash = hashf[1];
        if (hash.substr(0, 5) == 'goto_') {
            if (hashf[0] == window.location.href.split("#")[0]) {
                var hparts = hash.split('_');
                var tabnum = parseInt(hparts[1]);
                $('.ca_tabs li:nth-child(' + tabnum + ')').trigger('click');
                var anch = 'goto_' + tabnum;
                if ($('#' + hash).length > 0) {
                    $('html, body').animate({
                        scrollTop: $('#' + anch).offset().top
                    }, 'slow');
                }
            }
        }
    });

    /* mod: v2.6-000 [3]
       date: 2016-Oct-21
       who: brian
       onclick evemt for taggling a radio button when a tag other than label is used. this simulates a label click
    */
    $('body').on("click", '.JQradioClick', function(e) {
        $(this).prev('input').trigger('click');

    });

    // open/close the hidden container.
    $(".JQslideToggle, .JQslideToggle_close_button").on('click', function(e) {
        e.preventDefault();
        $clicked_item = $(this);
        if ($(this).hasClass('JQslideToggle')) {
            if ($(this).data('container-class-to-close') && $(this).data('container-class-to-close') != '') {
                // close all open containers
                class_to_close = $(this).data('container-class-to-close');
                $('body').find('.' + class_to_close).each(function() {
                    if ($(this).is(":visible")) {
                        $(this).hide();
                    }
                });
            }
            // toggle an indicator if present
            if ($clicked_item.hasClass('content-open') || $clicked_item.hasClass('content-closed')) {
                if ($('#' + $clicked_item.data('container-id-to-open')).is(':hidden')) {
                    $clicked_item.removeClass('content-closed').addClass('content-open');
                } else {
                    $clicked_item.removeClass('content-open').addClass('content-closed');
                }
            }
            $('#' + $clicked_item.data('container-id-to-open')).slideToggle();
        } else {
            $('#' + $clicked_item.data('container-id-to-close')).slideToggle();
        }
    });
    upscaleImages();

});

function formatValidatorDateChkMsg() {
    return 'Please enter a valid date (' + datechk_format + ')';
}
// Voice Tracker
function vTracker(e, ec, ea, el) {

    var EventCategory = 'UNKNOWN';
    var EventAction = 'Click';
    var EventLabel = 'UNKNOWN';

    if (ec) {
        EventCategory = ec;
    }
    if (ea) {
        EventAction = ea;
    }
    if (el) {
        EventLabel = el;
    }

    if (!ec && e.attr('data-cat')) {
        EventCategory = e.data('cat');
    }

    if (!ea && e.attr('data-action')) {
        EventAction = e.data('action');
    }

    if (!el && e.attr('data-label')) {
        EventLabel = e.data('label');
    }

    if (EventAction == 'URL') {
        EventAction = window.location.pathname;
    }

    if (!el && !e.attr('data-label') && e.text()) {
        EventLabel = e.text();
    }



    try {
        // support the two generations of analytics:  _gaq if traditional async ga.js, ga if analytics.js
        if (typeof(_gaq) !== "undefined") {
            _gaq.push(['_trackEvent', EventCategory, EventAction, EventLabel]);
        } else if (typeof(ga) !== "undefined") {
            ga('send', 'event', EventCategory, EventAction, EventLabel);
        }
    } catch (err) {
        // no action.
    }

    // some trackable events do not navigate, so a required timeout (delay)
    //   will need to be added to events that navigate (after the call to vTracker)
    //setTimeout(function() { document.location.href = TargetHref; }, 100);

}

function vtracklocal(t, i) {

    var url_params = {
        t: t,
        i: i
    };
    encoded_params = $.param(url_params);
    $.ajax({
        type: "GET",
        url: "/scripts/vtrack.php",
        data: encoded_params
    });
}

// upscale default-size content images to optimize file size for bandwidth
//  by providing image file of dimensions to match image width as
//  a percentage of the content container's width
function upscaleImages() {

    // set this to the ID of the content container
    //  to be the width reference to which images will
    //  be matched
    var containr = 'cimg-container';
    var fallbacksize = 320;

    var idx = 1;

    $(".cimg").each(function(index) {
        var par = $(this).closest(".cimg-container");
        if (par.length > 0) {
            var caw = par.width();
            // check to see that this is reasonable and not broken:
            if (caw < 50 || caw > 2400) {
                caw = fallbacksize;
            }
        } else {
            // establish reasonable fallback
            var caw = fallbacksize;
        }



        var isrc = $(this).attr('src');
        var shouldupdate = 0;
        var dinfo = '';
        var classname = '';
        var classscale = 1.0;

        var idealwidth = caw;

        for (i = 0; i < img_cimg_scales.length; i++) {
            classname = img_cimg_scale_classes[i];
            classscale = img_cimg_scales[i];

            if ($(this).hasClass(classname)) {
                idealwidth = Math.round(caw * classscale);
                shouldupdate = 1;

                // build some debug info:
                dinfo += "<b>image #" + idx + "</b> (class " + classname + ")<br />";
                dinfo += classscale + ' x ' + caw + ' = optimal width of <b>' + idealwidth + "</b> pixels.<br />";
                dinfo += 'initial src = ' + isrc + "<br />";


            }
        }



        if (shouldupdate > 0) {
            chosen_width = img_avail_widths[0];
            // loop through avail widths and choose closest without going over
            for (i = 0; i < img_avail_widths.length; i++) {
                if (idealwidth <= img_avail_widths[i]) {
                    chosen_width = img_avail_widths[i];
                }
            }

            for (i = img_avail_widths.length - 1; i >= 0; i--) {
                if (chosen_width == img_avail_widths[i]) {
                    dinfo += "<b>" + img_avail_widths[i] + "</b>";
                } else {
                    dinfo += img_avail_widths[i];
                }
                dinfo += "&nbsp;&nbsp;";
            }


            if (chosen_width > 0) {
                isrc = $(this).attr('src');
                isrc = isrc.replace("/default/", "/" + chosen_width + "/");
                dinfo += "<br />updated src = " + isrc + "<br />";
                $(this).attr('src', isrc);
            }

            // this will produce debug info before each upscaled image
            //$('<p style="display: block; padding: 8px; border: solid 1px #fff; border-color: #c44e53; border-radius: 4px; font-size: 0.75em; width: auto;">'+dinfo+'</p>').insertBefore($(this));

        }

        idx++;

    });

}