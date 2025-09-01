// counter for homepage:
var counterDone = false;

function closeAlerts() {
    $('.JQalertsFader').hide();
}

function getHeaderHeight() {
    var headerHeight = parseInt($("div.header").height()) + parseInt($("div.header").css('margin-bottom')) + parseInt($("div.header").css('margin-top')) + parseInt($("div.header").css('padding-top')) + parseInt($("div.header").css('padding-bottom'));
    // add classic alerts if there is an active alert:

    if ($("div.classic-alerts div.alert").length > 0) {
        const alertsObj = $("div.classic-alerts div.alert");
        var alertHeight = alertsObj.height() +
            parseInt(alertsObj.css('border-bottom')) +
            parseInt(alertsObj.css('border-top')) +
            parseInt(alertsObj.css('margin-bottom')) +
            parseInt(alertsObj.css('margin-top')) +
            parseInt(alertsObj.css('padding-top')) +
            parseInt(alertsObj.css('padding-bottom'));

        //const alertHeight = parseInt($("div.classic-alerts div.alert").height());
        //const alertHeight = 90;
        headerHeight = headerHeight + alertHeight;
        //console.log("alert height " + alertHeight + " added to headerHeight");
    }
    // add the 91 margin-top pixels on the wrapper_inner:
    const wrapperObj = $("div#startcontent");
    var scrollMarge = parseInt(wrapperObj.css('margin-top'));
    //console.log('scrollMarge= ' + scrollMarge);
    //headerHeight = headerHeight + scrollMarge;
    console.log('getHeaderHeight function got ' + headerHeight);
    return headerHeight;
}


$(function() {
    // start of simple alert fader
    var alertHover = false;
    var alertInit = true;
    var alertCount = 0;
    alertCycler();

    function alertCycler() {
        var fadeSpeed = 2000;
        if (alertInit) {
            alertInit = false;
            alertCount = $('.JQalertsFader:visible div.alert').length;
            //console.log('detected ' + alertCount + ' header alerts');

            // sync up the heights of the alerts to the tallest one
            var maxHeight = 0;
            $('div.JQalertsFader div.alert').each(function() {
                //console.log('alert is ' + $(this).height() + ' pixels high');
                if ($(this).height() > maxHeight) {
                    maxHeight = $(this).height();
                }
            });
            //console.log('max alert height is ' + maxHeight);
            //$('div.classic-alerts').css("min-height",maxHeight+'px');
            $('div.classic-alerts div.alert').css("height", maxHeight + 'px');

            // isolate the visible divs of class alert and mark the first one
            //  (restricting to only visible adds support for duplicated alerts block)
            //$('.JQalertsFader div.alert:visible:first').addClass('current-alert');
            $('.JQalertsFader div.alert:first').addClass('current-alert');

            if (alertCount > 1) {
                setTimeout(alertCycler, 6000);
                return;
            }

        }
        if (!$('.JQalertsFader:visible').is(':visible')) {
            return;
        }
        if (!alertHover) {
            // the current alert is the one marked with class current-alert
            //  but is also visible
            var current = $('div.alert.current-alert:visible');
            var next;
            if (current.next().length) {
                next = current.next();
            } else {
                next = current.siblings().first();
            }

            var current_inner = current.children('div.inner');
            var next_inner = next.children('div.inner');

            if (alertCount > 1) {
                // hide the current alert and the inner div of the next one
                current.hide().removeClass('current-alert');
                next_inner.hide();
                // now show the next alert and then fade in its inner div
                next.addClass('current-alert').show();
                next_inner.fadeIn(fadeSpeed).addClass('current-alert');
            }
        }
        if (alertCount > 1) {
            setTimeout(alertCycler, 6000);
        }
    };

    $(".JQalertsFader").hover(
        function() {
            alertHover = true;
        },
        function() {
            alertHover = false;
        }
    );
    // end of simple alert fader


    // configure font-awesome to use the pseudo element names only needed for FA 5
    window.FontAwesomeConfig = {
        searchPseudoElements: true
    }

    // START OF 2021 ALERTS part one

    // optional end-of-page alerts hiding (set enableAlertFooterHide=true and set pixels from bottom threshold)
    const enableAlertFooterHide = true;
    const alertFooterPixelTrigger = 200;
    if (enableAlertFooterHide) {
        document.addEventListener('scroll', function(e) {
            let documentHeight = document.body.scrollHeight;
            let currentScroll = window.scrollY + window.innerHeight;
            // When the user is [alertFooterPixelTrigger] px from the bottom, fire the event.
            if (currentScroll + alertFooterPixelTrigger > documentHeight) {
                $('.site-alerts').fadeOut(800);
            } else {
                $('.site-alerts').fadeIn(200);
            }
        });
    }

    // close the clicked alert, save cookie with alert identifier to prevent re-display
    $(".JQcloseAlert").on('click', function(e) {
        e.preventDefault();
        $clicked_item = $(this);
        alertid = '';
        cookie_days = 100;
        if (typeof $clicked_item.data('lifespan') !== 'undefined') {
            cookie_days = $clicked_item.data('lifespan');
        }
        if (typeof $clicked_item.data('alertid') !== 'undefined') {
            alertid = $clicked_item.data('alertid');

            // remember that we've seen and closed this alert
            alert_cookiename = 'alertseen_' + alertid;
            alert_cookieval = 1;

            if (document.cookie.indexOf(alert_cookiename) == -1) {
                // cookie is not yet set so we set it

                // however, if cookie_days is zero then it means no cookie so
                if (cookie_days > 0) {
                    var exp = new Date();
                    exp.setDate(exp.getDate() + cookie_days); // expire in so many days
                    setAlertCookie(alert_cookiename, alert_cookieval, exp);
                }
            }
            $('div.alert[data-alertid=' + alertid + ']').slideToggle();
            //$('div.alert[data-alertid=' + alertid + ']').hide( "slide", { direction: "right"  }, 1000 );
        }

    });

    // expand the clicked alert
    $(".JQexpandAlert").on('click', function(e) {
        e.preventDefault();
        $clicked_item = $(this);
        alertid = '';
        if (typeof $clicked_item.data('alertid') !== 'undefined') {
            alertid = $clicked_item.data('alertid');
            toggleAlert(alertid);
        }

    });


    // auto-expand so-marked alerts
    $(".JQautoexpandAlert").each(function(e) {
        $clicked_item = $(this);
        alertid = '';
        if (typeof $clicked_item.data('alertid') !== 'undefined') {
            alertid = $clicked_item.data('alertid');
            //console.log('autoexpanding '+ alertid);
            expandAlert(alertid);
        }

    });
    // END OF 2021 ALERTS part one

    // search button show and hide - both mobile and desktop	
    // mobile search button show and hide
    $("#searchopen,#mobilesearchopen").on('click', function(e) {

        // submit if open, open if closed
        if ($("#search-box").hasClass("search-box-open")) {
            $("#search-box").toggleClass("search-box-open");

        } else {
            $("#search-box").toggleClass("search-box-open");
            $("#searchform").trigger('focus');
            $('#JQmegamenu_content').slideUp('slow');
        }
    });


    // for both mobile and desktop
    $("#searchclose").on('click', function() {

        $("#search-box").toggleClass("search-box-open");
        $("#searchopen,#mobilesearchopen").removeClass("hide");
    });


    $("#searchsubmit").on('click', function(e) {

        // submit if open, open if closed
        e.preventDefault();
        if ($("#search-box").hasClass("search-box-open") && ($("#searchform").val().length > 0)) {
            $("#searchfrm").trigger('submit');
        } else {

            $("#searchform").trigger('focus');

        }
    });


    $("#locatorclose").on('click', function() {

        $("#locator-box").toggleClass("locator-box-open");
        $("#locatoropen").removeClass("hide").addClass("fa-map-marker-alt");
    });


    $("#locatorsubmit").on('click', function(e) {

        // submit if open, open if closed
        e.preventDefault();
        if ($("#locator-box").hasClass("locator-box-open") && ($("#locatorform").val().length > 0)) {
            $("#locatorfrm").trigger('submit');
        } else {

            $("#locatorform").trigger('focus');

        }
    });


    // open/close the hidden container and add optionally add a class to the item that was clicked
    $(".JQslideTogglev2, .JQslideToggle_close_buttonv2").on('click', function(e) {
        e.preventDefault();
        $clicked_item = $(this);
        button_class = '';
        if (typeof $clicked_item.data('container_opened_class') !== 'undefined') {
            button_class = $clicked_item.data('container_opened_class');
        }
        if ($(this).hasClass('JQslideTogglev2')) {
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
            if (button_class != '') {
                if ($('#' + $clicked_item.data('container-id-to-open')).is(':visible')) {
                    $clicked_item.removeClass(button_class);
                } else {
                    $clicked_item.addClass(button_class);
                }
            }
            //$('#' + $clicked_item.data('container-id-to-open')).slideToggle();
            $('#' + $clicked_item.data('container-id-to-open')).toggle();
        } else {
            //$('#' + $clicked_item.data('container-id-to-close')).slideToggle();
            $('#' + $clicked_item.data('container-id-to-close')).toggle();
        }
    });





    // post pagination button click event
    $("body").on("click", '.JQPollsPagination_btn', function(e) {
        e.preventDefault();
        var url_params = {
            mod: 'post',
            action: "list",
            pg: $(this).attr('data-pg'),
            cat: $(this).attr('data-cat')
        };
        if ($(this).attr('data-psrc')) {
            url_params.psrc = $(this).attr('data-psrc');
        }
        $more_button = $(this).parent();
        $post_list = $(this).parent().prev("div[class*=JQpost_list]");
        encoded_params = $.param(url_params);
        $.ajax({
                type: 'GET',
                async: false,
                url: '/render.php',
                data: encoded_params,
                timeout: 15000,
                cache: false
            })
            .done(function(resultsObj) {
                if ('status' in resultsObj) {

                    if ('response' in resultsObj) {
                        $post_list.html(resultsObj.response);
                    }
                    if ('morebutton' in resultsObj) {
                        $more_button.html(resultsObj.morebutton);
                    }
                }

            })
            .fail(function(XMLHttpRequest, textStatus, errorThrown) {
                $('#dialog_detail').text("We're sorry. Your request could not be processed.");
                $('#dialog').dialog("open");
            });
    });


    /* banner-awareness */
    if ($('div.hero-banner-2023').length > 0) {
        $("div.wrapper").addClass("hasbanner");
    } else {
        $("div.wrapper").addClass("hasnobanner");
    }
    /* video banner-awareness */
    if ($('div.banner-video').length > 0) {
        $("div.hero-banner-home").addClass("hasvideobanner");
    } else {
        $("div.hero-banner-home").addClass("hasnovideobanner");
    }

    // toggle faq icon open and closed
    $("li.faq-icon a.JQfaq").on('click', function(e) {
        $(this).toggleClass("faq-open");
    });

    // all placeholders are automatically converted to values ONLY in browsers that don't understand placeholders

    // get the data-id of the main menu item that is in onstate
    if ($('ul.nav-menu.dropdown').find('li.on').length > 0) {
        original_main_menu_item = $('ul.nav-menu.dropdown').find('li.on a').attr('data-id');
    } else {
        original_main_menu_item = 0;
    }

    $('body').on("click", '.JQcloseMM', function(e) {
        e.preventDefault();
        $('#JQmegamenu_content').slideUp('slow');
    })

    // force the menu to be open
    if ($('ul.nav-menu.dropdown').find('a.on').length > 0) {
        TransInitialLoad = '1';
        $('ul.nav-menu.dropdown').find('a.on').trigger('click');
    }

    /*

       // when clicking outside of the entire menu area, check for a menu item having a class of 'on' if it does then close it
       $(document).on('mouseup', function(e){
            var container = $("div.menu-main");
            var container2 = $("#JQmegamenu_content");
            // if the target of the click isn't the either container or a descendant of either container

            if ((!container.is(e.target) && container.has(e.target).length === 0) && (!container2.is(e.target) && container2.has(e.target).length === 0)){
                $('ul.nav-menu.dropdown li.on').removeClass('on');  // clear the on state of the main menu item
                $('ul.nav-menu.dropdown a.active').removeClass('active').addClass('inactive');  // clear the active state of the main menu item
                // restore the state of the original if needed
                $currentAnchorTag = $('ul.nav-menu.dropdown').find('li a[data-id=' + original_main_menu_item + "]");
                if(!$currentAnchorTag.parent().hasClass('on')){
                    $currentAnchorTag.parent().addClass('on');
                }
                var $currentDiv = $('#JQmegamenu_content div.megacontainer.on');
                $currentDiv.slideUp('slow').removeClass('on');
                $('#JQmegamenu_content').slideUp('slow');
            }
      });
    */
    // toggles the menu to an x for mobile
    //  (desktop version handled in nav-megamenuv2)
    $('#mobilemenu').on('click', function(e) {
        var submenu = $('#submenu');
        if (submenu.is(":visible")) {
            submenu.slideUp();
            $(this).removeClass('menu-icon-open').addClass('menu-icon-closed');
        } else {
            submenu.slideDown();
            $(this).removeClass('menu-icon-closed').addClass('menu-icon-open')
        }
    });


    // slick slider options - homepage promotions carousel

    $('.carousel-promotions').slick({
        dots: false,
        arrows: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 2000,
        fade: false,
        speed: 2000,
        pauseOnHover: true,
        pauseOnDotsHover: true,
        pauseOnFocus: true,
        centerMode: true,
        centerPadding: '30px',
        slidesToShow: 3,
        slidesToScroll: 1,
        adaptiveHeight: false,
        useTransform: true, // needed for easing
        cssEase: 'ease',
        easing: 'swing',
        dotsClass: 'slick-dots slick-dots-black',
        responsive: [{
                breakpoint: 1300,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 900,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 500,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    speed: 1000
                }
            }
            // You can unslick at a given breakpoint now by adding:
            // settings: "unslick"
            // instead of a settings object
        ]
    });


    // slick slider options - extras carousel

    $('.carousel-extras').slick({
        dots: false,
        arrows: true,
        infinite: true,
        autoplay: false,
        autoplaySpeed: 2000,
        fade: false,
        speed: 600,
        pauseOnHover: false,
        pauseOnDotsHover: true,
        pauseOnFocus: true,
        centerMode: true,
        centerPadding: '30px',
        slidesToShow: 3,
        slidesToScroll: 1,
        adaptiveHeight: false,
        useTransform: true, // needed for easing
        cssEase: 'ease',
        easing: 'swing',
        dotsClass: 'slick-dots slick-dots-black',
        responsive: [{
                breakpoint: 767,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
            // You can unslick at a given breakpoint now by adding:
            // settings: "unslick"
            // instead of a settings object
        ]
    });

    // slick slider options - homepage testimonials carousel

    $('.carousel-testimonials').slick({
        dots: true,
        arrows: false,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3000,
        fade: false,
        speed: 2000,
        pauseOnHover: false,
        pauseOnDotsHover: false,
        pauseOnFocus: true,
        centerMode: true,
        centerPadding: '30px',
        slidesToShow: 3,
        slidesToScroll: 1,
        adaptiveHeight: false,
        useTransform: true, // needed for easing
        cssEase: 'ease',
        easing: 'swing',
        dotsClass: 'slick-dots slick-dots-black',
        responsive: [{
                breakpoint: 1640,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 900,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
            // You can unslick at a given breakpoint now by adding:
            // settings: "unslick"
            // instead of a settings object
        ]
    });


    // banking login interceptor
    //  customized with opt-out banking messages so also needs functions processLogin() and setInterstitialCookie()
    notices = ($('#OBmsg').length > 0) ? $('#OBmsg').attr('data-notices') : 'off';

    $('#BankingLoginSubmit').on('click', function(e) {
        if (($('#BankingLoginSubmit').length > 0) && (notices == 'on')) {
            e.preventDefault();
            $('#dialog_content').html($('#OBmsg').html());
            var btitle = $('#OBtitle').html();

            $('#dialog').dialog({
                autoOpen: false,
                modal: true,
                width: 'auto',
                height: 'auto',
                overlay: {
                    opacity: 0.1,
                    background: "black"
                },
                title: btitle,
                dialogClass: "bank-intercept",
                open: function() {
                    // TJ; the following closes modal on outside click:
                    $('.ui-widget-overlay').on('click', function() {
                        $(this).parents("body").find(".ui-dialog-content").dialog("close");
                    });
                    $('div.ui-dialog-buttonpane').insertBefore('#dialog');
                    $(".ui-dialog-titlebar").hide();
                    $('#dialog_content .JQtrack').on('click', function(e) {
                        vTracker($(this));
                    });
                },
                beforeClose: function() {
                    // restore the titlebar
                    $(".ui-dialog-titlebar").show();
                    // move the button panel back under contend:
                    $('div.ui-dialog-buttonpane').insertAfter('#dialog');
                    $('.ui-dialog').removeClass('bank-intercept');

                },
                buttons: {
                    'Continue': function() {
                        //$(this).dialog('close');
                        //$('#BankingLoginFrm').submit();
                        processLogin();
                    }
                }
            });

            $('#dialog').dialog("open");

        }

    });


    function processLogin() {
        if ($("input[name='username']").val().length > 0) {
            // see if there are any opt-out cookies to setActive
            $('.JQbnOptOut').each(function(idx, elementObj) {
                if ($(this).is(':checked')) {
                    data_cookiename = $(this).attr('data-cn');
                    data_cookieval = $(this).attr('data-cv');
                    if (document.cookie.indexOf(data_cookiename) == -1) {
                        // cookie is not yet set
                        var exp = new Date();
                        exp.setDate(exp.getDate() + 100); // expire in 100 days
                        setInterstitialCookie(data_cookiename, data_cookieval, exp, false, false);
                    } else {
                        // cookie is set, but we need to check its value
                        if ($.cookie(data_cookiename) != data_cookieval) {
                            // cookie is probably from previous version of notice, so update value:
                            var exp = new Date();
                            exp.setDate(exp.getDate() + 100); // expire in 100 days
                            setInterstitialCookie(data_cookiename, data_cookieval, exp, false, false);
                        }
                    }
                }


            });
            // cookies are all set, move on
            $('#BankingLoginFrm').submit();
        }
    }

    // client customization - add class to ul elements of Logo list style type
    const uls = document.getElementsByTagName("ul");
    for (let i = 0; i < uls.length; i++) {
        if (uls[i].style.listStyleType == "LogoList") {
            uls[i].classList.add("custom1");
        }
    };

    loadScripts();

});

// START OF 2021 ALERTS part two
function expandAlert(alertid) {
    $(this).slideDown();
    // replace open with closed icon in non-activated alerts
    //$('button.alert_expandbtn[data-alertid!=' + alertid + '] span.alert-open-icon').removeClass('alert-open-icon').addClass('alert-closed-icon');

    $('div.alert-content[data-alertid=' + alertid + ']').each(function() {
        if ($(this).is(":visible")) {
            $(this).slideUp();
            // replace open with closed icon in activated alert
            $('button.alert_expandbtn[data-alertid=' + alertid + '] span.alert-open-icon').removeClass('alert-open-icon').addClass('alert-closed-icon');
        } else {
            $(this).slideDown();
            // replace closed with open icon in activated alert
            $('button.alert_expandbtn[data-alertid=' + alertid + '] span.alert-closed-icon').removeClass('alert-closed-icon').addClass('alert-open-icon');
        }
    });

}

function toggleAlert(alertid) {

    if (!$('div.alert-content[data-alertid=' + alertid + ']').is(":visible")) {
        // clicked alert is not expanded

        // close all other alerts (notice the !=alertid)
        $('div.alert-content[data-alertid!=' + alertid + ']').each(function() {
            aid = $(this).data('alertid');
            //if($(this).is(":visible") && !$(this).hasClass("JQautoexpandAlert")){
            if ($(this).is(":visible")) {
                $(this).slideUp();
                $('button.alert_expandbtn[data-alertid=' + aid + '] span.alert-open-icon').removeClass('alert-open-icon').addClass('alert-closed-icon');
            }
        });

    }

    // now open or close the clicked alert
    $('div.alert-content[data-alertid=' + alertid + ']').each(function() {
        if ($(this).is(":visible")) {
            $(this).slideUp();
            // replace open with closed icon in activated alert
            $('button.alert_expandbtn[data-alertid=' + alertid + '] span.alert-open-icon').removeClass('alert-open-icon').addClass('alert-closed-icon');
        } else {
            $(this).slideDown();
            // replace closed with open icon in activated alert
            $('button.alert_expandbtn[data-alertid=' + alertid + '] span.alert-closed-icon').removeClass('alert-closed-icon').addClass('alert-open-icon');
        }
    });


}

function setInterstitialCookie(cn, cv, expires, path, domain) {
    var curCookie = cn + "=" + cv +
        ((expires) ? "; expires=" + expires.toUTCString() : "") +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        (('https:' == document.location.protocol) ? "; secure" : "");
    document.cookie = curCookie;
}

function setAlertCookie(cn, cv, expires) {
    var curCookie = cn + "=" + cv +
        ((expires) ? "; expires=" + expires.toUTCString() : "") +
        "; path=/" +
        // ((domain) ? "; domain=" + domain : "") +
        (('https:' == document.location.protocol) ? "; secure" : "");
    document.cookie = curCookie;
}

// END OF 2021 ALERTS part two



function hashLogic(funcType, href) {
    hrefVal = href || '';
    if (funcType == 'footnote') {
        hash = hrefVal;
        hash = hash.replace(/#/, '');
    } else {
        var hrefArray = hrefVal.split('#');
        var hash = hrefArray[1];
    }
    //console.log("hash is a " + typeof(hash));
    var headerHeight = 0; // height of the fixed header that everything scrolls beneath

    if ($("div.header").length > 0) {
        headerHeight = parseInt($("div.header").height()) + parseInt($("div.header").css('margin-bottom')) + parseInt($("div.header").css('margin-top'));
    }

    //console.log('header height measured to be ' + headerHeight + 'px');

    if (hash.substr(0, 5) == 'goto_') {
        if (funcType == 'window') {
            var temp = hash.split('_');
            namedAnchorId = temp[1];
            switch (namedAnchorId) {
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                    tabnum = parseInt(namedAnchorId);
                    anchorOffset = $('.ca_tabs').offset().top - headerHeight;
                    $('html, body').animate({
                        scrollTop: anchorOffset
                    }, 'slow');
                    $('.ca_tabs li:nth-child(' + tabnum + ')').trigger('click');
                    break;
                default:
                    if ($('#' + namedAnchorId).length > 0) {
                        anchorOffset = $('a#' + namedAnchorId).offset().top - headerHeight;
                        $('html, body').animate({
                            scrollTop: anchorOffset
                        }, 'slow');
                    } else {
                        //console.log('Named Anchor - ' + namedAnchorId + ', not found in document.');
                    }
                    break;
            }
        } else {
            // make sure the id exists otherwise an error is thrown
            namedAnchorId = hash.replace(/goto_/i, '');
            if ($('#' + namedAnchorId).length > 0) {
                anchObj = $('#' + namedAnchorId).offset();
                if ($(window).width() > 767) {
                    $('html').animate({
                        scrollTop: anchObj.top - headerHeight
                    }, 'slow');
                } else {
                    $('html').animate({
                        scrollTop: anchObj.top
                    }, 'slow');
                }
            } else {
                //console.log('Named Anchor - ' + namedAnchorId + ', does not exist in document.');
            }
            return false;
        }
    } else {
        // make sure the id exists otherwise an error is thrown
        namedAnchorId = hash.replace(/goto_/i, '');
        if (namedAnchorId != '' && $('#' + namedAnchorId).length > 0) {
            anchObj = $('#' + namedAnchorId).offset();
            //console.log("anchor offset is " + anchObj);
            //console.log(anchObj);
            var fudge = 18;
            var scrollto = anchObj.top - headerHeight - fudge;
            //console.log("scrollto calculated as " + scrollto);
            if ($(window).width() > 767) {
                $('html').animate({
                    scrollTop: scrollto
                }, 'slow');
            } else {
                $('html').animate({
                    scrollTop: scrollto
                }, 'slow');
            }
        }
        return false;
    }
}

// begin counter-related functions
function countUp() {
    if (!counterDone) {
        counterDone = true;
        $('.counter').each(function(e) {
            var $this = $(this),
                countTo = $this.attr('data-count');

            $({
                countNum: $this.text()
            }).animate({
                countNum: countTo
            }, {
                duration: 4000,
                easing: 'linear',
                step: function() {
                    $this.text(commafy(Math.floor(this.countNum)));
                },
                complete: function() {
                    $this.text(commafy(this.countNum));
                    counterDone = true;
                }
            });
        });
    }
}

function commafy(num) {
    var commas = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return commas;
}


function isInViewport(element) {
    const container = document.querySelector(element);
    const rect = container.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
// end counter-related functions


// loadScripts will load script referenced via divs with a data-loadscript attribute
//	script will be loaded only once even if the same script is present in 
//  multiple data-loadscript attributes
function loadScripts() {
    $("div[data-loadscript]").each(function() {
        var s2l = $(this).data('loadscript');

        // make sure we only load the script once:
        var list = document.getElementsByTagName('script');
        var i = list.length,
            scriptloaded = false;
        var srcspec, srcfile, s2llen;

        while (i--) {
            srcspec = list[i].src;
            s2llen = s2l.length;
            srcfile = srcspec.substr(-s2llen);
            //console.log("is " + srcfile + " == " + s2l + "?");
            if (srcfile == s2l) {
                scriptloaded = true;
                //console.log("duplicate script not loaded");
                break;
            }
        }

        // if we didn't already find it on the page, add it
        if (!scriptloaded) {
            var tag = document.createElement('script');
            tag.src = s2l;
            document.getElementsByTagName('body')[0].appendChild(tag);
            //console.log("script " + s2l + " loaded.");
        }
    });

}

$(window).on('load', function() {

    if (window.location.hash) {
        hashLogic('window', window.location.href);
    }

    // needed to support anchors to within current page:
    $("a[href*='#']").on('click', function(event) {
        //console.log(this.href);
        if (this.href != '') {
            hashLogic('click', this.href);
        }
    });

    // count up from zero 
    if ($('#counter_trigger').length > 0) {
        $(window).scroll(function(e) {
            if (isInViewport("#counter_trigger")) {
                countUp();
            }
        });
    }

    // add class to fixed header on scroll
    if ($(".header").is(':visible')) {
        //console.log('STICKYDEBUG: in onload');
        $(window).scroll(function() {
            var scroll = $(window).scrollTop();
            if (scroll > 0) {
                //console.log('STICKYDEBUG: scroll > 0');
                $(".header").addClass("scrolled");
                $(".wrapper_inner").addClass("scrolled-margin");
            } else {
                //console.log('STICKYDEBUG: scroll !> 0');
                $(".header").removeClass("scrolled");
                $(".wrapper_inner").removeClass("scrolled-margin");
            }
        });
    }



});