$(function() {
    /* 1. Visualizing things on Hover - See next part for action on click */
    $('#stars li').on('mouseover focus', function() {
        var onStar = parseInt($(this).data('value'), 10); // The star currently mouse on
        $('#star_label').html($(this).data('label')); // display the label

        // Now highlight all the stars that's not after the current hovered star
        $(this).parent().children('li.star').each(function(e) {
            if (e < onStar) {
                $(this).addClass('hover');
            } else {
                $(this).removeClass('hover');
            }
        });

    }).on('mouseout blur', function() {
        $(this).parent().children('li.star').each(function(e) {
            $(this).removeClass('hover');
            if (isNaN($("#cmntfrm_rating").val()) || $("#cmntfrm_rating").val() == '') {
                $('#star_label').html('');
            } else {
                var starlabel = $('#stars li.selected').last().data('label');
                $('#star_label').html(starlabel);
            }
        });
    });


    /* 2. Action to perform on click */
    $('#stars li').on('click keypress', function() {
        var onStar = parseInt($(this).data('value'), 10); // The star currently selected
        $('#star_label').html($(this).data('label'));

        var stars = $(this).parent().children('li.star');

        for (i = 0; i < stars.length; i++) {
            $(stars[i]).removeClass('selected');
        }

        for (i = 0; i < onStar; i++) {
            $(stars[i]).addClass('selected');
        }
        // capture the rating
        var ratingValue = parseInt($('#stars li.selected').last().data('value'), 10);
        var starlabel = $('#star_label').html();
        $("#cmntfrm_rating").val(ratingValue);
        $("#cmntfrm_rating").attr({
            "data-label": starlabel
        });
    });


    $('#commentform').validate({
        onfocusout: false,
        onkeyup: false,
        onclick: false,
        focusInvalid: false,
        focusCleanup: true,
        errorClass: "error",
        validClass: "success",

        errorElement: "div",
        submitHandler: function(form) {
            $('.ajaxInProgress_wrapper').show();

            var encoded_params = $(form).serialize();
            encoded_params = encoded_params + '&mod=comments&action=submitcomment';

            $.ajax({
                    type: "POST",
                    url: "/render.php",
                    data: encoded_params
                })
                .done(function(resultsObj) {
                    if ('status' in resultsObj && resultsObj.status == 'success') {
                        // hide the signup div and show the description div then load the message area
                        $("#comment_form").hide('slow').html('');
                        $("#comment_button").hide('slow').html('');
                        // display the response
                        if ('response' in resultsObj) {
                            $("#comment_results").html(resultsObj.response).fadeIn('slow');
                        }
                        if ('commentblock' in resultsObj) {
                            $('#comment_all').prepend(resultsObj.commentblock);
                        }
                        // clear all fields within the form
                        $("#commentform").trigger("reset");
                    } else {
                        if ('response' in resultsObj) {
                            $("#comment_results").html(resultsObj.response).fadeIn('slow');
                        }
                    }

                })
                .fail(function(resultsObj) {
                    alert("We're sorry, the comment system is currently unavailable. Please try again later.");
                });

            // end progress indicator
            $('.ajaxInProgress_wrapper').hide();
        },
        success: function(label) {
            // set   as text for IE
            label.html("");
        }
    });

    initReplyValidate();

    $('#comment_all').on("click", '.JQcommentReply', function(evt) {
        var url_params = {
            mod: 'comments',
            action: "getreplyform",
            id: $(this).attr('data-replyid'),
            fkid: $(this).attr('data-fkid'),
            ctype: $(this).attr('data-ctype'),
            cpg: $(this).attr('data-pg')
        };

        encoded_params = $.param(url_params);

        $reply_div = $('.reply_area[data-replyid=' + $(this).attr('data-replyid') + "]");

        // if this replay area already open, close it
        if ($reply_div.is(':visible')) {
            $reply_div.hide('slow');
            //$reply_div.html('');
            return;
        }

        // if comment form visible, hide it
        if ($('#comment_form').is(':visible')) {
            $('#comment_form').toggle('slow');
        }


        // clear any existing forms
        if ($('#replyform').length > 0) {
            $('#replyform').data('validator', null);
        }
        // hide all reply areas
        $('.reply_area').each(function(idx, elementObj) {
            if ($(this).is(':visible')) {
                $(this).hide('slow');
                $(this).html('');
            }
        });

        // load this reply area
        $.ajax({
                type: "GET",
                url: "/render.php",
                data: encoded_params
            })
            .done(function(resultsObj) {
                if ('status' in resultsObj && resultsObj.status == 'success') {
                    // hide the signup div and show the description div then load the message area
                    if ('response' in resultsObj) {
                        $reply_div.html(resultsObj.response).fadeIn('slow');
                    }
                } else {
                    if ('response' in resultsObj) {
                        $reply_div.html(resultsObj.response).fadeIn('slow');
                    }
                }
                if ($reply_div.is(':hidden')) {
                    $reply_div.show('slow');
                }

            })
            .fail(function(results) {
                alert("We're sorry, the reply system is currently unavailable. Please try again later.");
            });

        initReplyValidate();


    });

    $('#comment_all').on("click", '.JQflagComment', function(evt) {
        var url_params = {
            mod: 'comments',
            action: "flagcomment",
            id: $(this).attr('data-replyid')
        };

        encoded_params = $.param(url_params);

        $reply_div = $('.reply_area[data-replyid=' + $(this).attr('data-replyid') + "]");

        // if this replay area already open, close it
        if ($reply_div.is(':visible')) {
            $reply_div.hide('slow');
            $reply_div.html('');
            return;
        }

        // hide all reply areas
        $('.reply_area').each(function(idx, elementObj) {
            if ($(this).is(':visible')) {
                $(this).hide('slow');
                $(this).html('');
            }
        });

        // load this reply area
        $.ajax({
                type: "GET",
                url: "/render.php",
                data: encoded_params
            })
            .done(function(resultsObj) {
                if ('status' in resultsObj && resultsObj.status == 'success') {
                    // hide the signup div and show the description div then load the message area
                    if ('response' in resultsObj) {
                        $reply_div.html(resultsObj.response).fadeIn('slow');
                    }
                } else {
                    if ('response' in resultsObj) {
                        $reply_div.html(resultsObj.response).fadeIn('slow');
                    }
                }
                if ($reply_div.is(':hidden')) {
                    $reply_div.show('slow');
                }

            })
            .fail(function(results) {
                alert("We're sorry, the system is currently unavailable. Please try again later.");
            });

    });



});

function ToggleCommentForm() {
    $('#comment_form').toggle('slow');
    // hide all reply areas
    $('.reply_area').each(function(idx, elementObj) {
        if ($(this).is(':visible')) {
            $(this).hide('slow');
        }
    });
}

function initReplyValidate() {
    $('#replyform').validate({
        onfocusout: false,
        onkeyup: false,
        onclick: false,
        focusInvalid: false,
        focusCleanup: true,
        errorClass: "error",
        validClass: "success",

        errorElement: "div",
        submitHandler: function(form) {
            $('.ajaxInProgress_wrapper').show();

            var encoded_params = $(form).serialize();
            encoded_params = encoded_params + '&mod=comments&action=submitcomment';

            $.ajax({
                    type: "POST",
                    url: "/render.php",
                    data: encoded_params
                })
                .done(function(resultsObj) {
                    if ('status' in resultsObj && resultsObj.status == 'success') {
                        // hide the signup div and show the description div then load the message area
                        $("#reply_form").hide('slow').html('');
                        //$("#reply_button").hide('slow').html('');
                        if ('response' in resultsObj) {
                            $("#reply_results").html(resultsObj.response).fadeIn('slow');
                        }
                        if ('commentblock' in resultsObj) {
                            comment_div = $("#reply_form").closest('div.comment').next('div.clearfix');
                            $(resultsObj.commentblock).insertAfter(comment_div);
                        }
                    } else {
                        if ('response' in resultsObj) {
                            $("#reply_results").html(resultsObj.response).fadeIn('slow');
                        }
                    }

                })
                .fail(function(results) {
                    alert("We're sorry, the comment system is currently unavailable. Please try again later.");
                });

            // end progress indicator
            $('.ajaxInProgress_wrapper').hide();
        },
        success: function(label) {
            // set   as text for IE
            label.html("");
        }
    });
}