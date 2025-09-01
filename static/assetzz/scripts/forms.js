$(function() {
    var default_datepicker_format = 'mm/dd/yyyy';
    // establish the datepicker
    if ('datepicker_format' in WrapperVariablesObj) {
        dpFormat = WrapperVariablesObj.datepicker_format;
    } else {
        dpFormat = default_datepicker_format;
    }
    $('.useDatePicker').datepicker({
        showSecond: false,
        dateFormat: dpFormat
    });
    // validate grid access all items associated grid items by name less the row
    jQuery.validator.addMethod(
        "JQGridReq",
        function(value, element) {
            var check = true;
            temp = element.name.split('_');
            temp.pop();
            elementName = temp.join('_');

            // loop through each row of the grid make sure an item is selected within each row
            num_of_times = $("#" + elementName + " tbody > tr").length;
            checked_array = new Array();
            rownum = 1;
            for (idx = 0; idx < num_of_times; idx++) {
                checked_array[idx] = 0;
                elName = elementName + '_' + rownum;
                $("input[name^='" + elName + "']").each(function() {
                    if ($(this).is(':checked')) {
                        checked_array[idx] = 1;
                    }
                });
                rownum++;
            }
            for (idx = 0; idx < num_of_times; idx++) {
                if (checked_array[idx] == 0) {
                    check = false;
                }
            }
            return check;
        },
        "These fields are required."
    );
    // clear message area on focus of
    $('#L9Form :input').on('focus', function(e) {
        if ($('#L9Form_errormessage_area').length > 0) {
            $('#L9Form_errormessage_area').hide().html('');
        }
    });

    // uploader
    num_of_uploads = 0;
    error_not_reported = true;
    if ('permitted_extensions' in WrapperVariablesObj) {
        permitted_extensions = WrapperVariablesObj['permitted_extensions'];
    } else {
        permitted_extensions = '[]';
    }

    if ('max_uploads' in WrapperVariablesObj) {
        max_uploads = WrapperVariablesObj['max_uploads']
    } else {
        max_uploads = 0;
    }

    if ('upload_multiple' in WrapperVariablesObj) {
        if (WrapperVariablesObj['upload_multiple'] == 'true') {
            upload_multiple = true;
        } else {
            upload_multiple = false;
        }
    } else {
        upload_multiple = false;
    }

    no_errors_detected = true;
    // if an uploader is present modify the form submission button
    if ($('#JQuploader').length > 0) {
        // method for validation upload limits
        jQuery.validator.addMethod(
            "JQUploadValidate",
            function(value, element) {
                var check = true;
                if (num_of_uploads > max_uploads) {
                    check = false;
                } else {
                    // clear the message
                    $('#progressBar').find('div.error').remove();
                }
                return check;
            },
            "A maximum of " + max_uploads + " files may be uploaded. Please limit the list of files to only " + max_uploads
        );
        $('#uploaded').val(''); // clear the element holding the list of files
        $('#JQuploader').fineUploader({
            request: {
                endpoint: '/render.php?mod=uploader&action=upload'
            },
            validation: {
                allowedExtensions: permitted_extensions
            },
            text: {
                uploadButton: 'Upload Files'
            },
            autoUpload: false,
            showMessage: function(message) {
                // include this to override the default JS Alert
            },
            failedUploadTextDisplay: {
                // displays the text next to the file attempting to be uploaded
                mode: 'custom',
                maxChars: 40,
                responseProperty: 'error',
                enableTooltip: true
            },
            // allow multiple file uploads true/false
            multiple: upload_multiple,
            // use our predefined button with an id of uploadButton
            button: $('#uploadButton'),
            listElement: $('#uploadContainer'),
            debug: false
        }).on('submit', function(event, id, filename) {
            // clear the errors flag. it may have been set on client side validation
            if (upload_multiple === true) {
                num_of_uploads++;
            } else {
                num_of_uploads = 1;
            }

        }).on('error', function(event, id, filename, reason) {
            // customize how messages are displayed
            $('#dialog_content').text(reason);
            $('#dialog').dialog({
                autoOpen: true,
                title: 'Upload Error',
                buttons: {
                    'Ok': function() {
                        $(this).dialog('close');
                    }
                }
            });
            no_errors_detected = false;
        }).on('cancel', function(event, id, filename) {
            num_of_uploads--;
            if (num_of_uploads <= max_uploads) {
                $('#progressBar').find('div.error').remove();
                no_errors_detected = true;
            }
        }).on('complete', function(event, id, filename, responseJSON) {
            switch (responseJSON.success) {
                case 'true':
                    if ($('#uploaded').val() == '') {
                        $('#uploaded').val(responseJSON.target_filename);
                    } else {
                        $('#uploaded').val($('#uploaded').val() + ',' + responseJSON.target_filename);
                    }
                    // if all done uploading files, submit the form
                    num_of_uploads--;
                    if (num_of_uploads == 0) {
                        SubmitTheForm();
                    }
                    break;
                default:
                    if ('error' in responseJSON) {
                        message = responseJSON.error;
                    } else {
                        message = 'Upload failed.';
                    }
                    $('#dialog_content').text(message);
                    $('#dialog').dialog({
                        autoOpen: true,
                        title: 'Upload Message',
                        buttons: {
                            'Ok': function() {
                                $(this).dialog('close');
                            }
                        }
                    });
                    break;
            }

            no_errors_detected = true;
        });
    }

    // form validator
    $('#L9Form').validate({
        onfocusout: false,
        onkeyup: false,
        onclick: false,
        focusInvalid: false,
        focusCleanup: true,
        errorClass: "error",
        validClass: "success",
        ignore: [],
        rules: {
            uploaded: {
                required: function() {
                    if ($('#uploaded').hasClass('required')) {
                        if (num_of_uploads == 0) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }

        },
        errorElement: "div",
        errorPlacement: function(error, element) {
            if ($(element).attr('name').substr(0, 5) == 'grid_') {
                temp = $(element).attr('name').split('_');
                temp.pop();
                elementName = temp.join('_');
                if ($('#' + elementName + '_errmsg').html() != '') {
                    $('#' + elementName + '_errmsg').html(error);
                }
            } else if ($(element).attr('name').substr(0, 9) == 'checkbox_') {
                elementName = $(element).attr('name').replace(/\[\]/ig, '');
                $('#' + elementName + '_errmsg').html(error);
            } else if ($(element).attr('name').substr(0, 9) == 'dropdown_') {
                elementName = $(element).attr('name').replace(/\[\]/ig, '');
                $('#' + elementName + '_errmsg').html(error);
            } else if ($(element).attr('name') == 'uploaded') {
                $('#progressBar').prepend(error);
            } else {
                elementName = $(element).attr('name').replace(/\[\]/ig, '') + '_errmsg';
                if ($('#' + elementName).length > 0) {
                    $('#' + elementName).html(error);
                } else {
                    error.insertAfter(element); // default error placement.
                }

            }
        },
        invalidHandler: function(errorMap, errorList) {
            $('#L9Form_errormessage_area').text('Required information is missing. Please complete all required fields, then submit again.').show();
        },
        submitHandler: function(form) {
            if ($('#JQuploader').length > 0 && num_of_uploads > 0) {
                $('#JQuploader').fineUploader('uploadStoredFiles');
            } else {
                SubmitTheForm();
            }

        },
        success: function(label) {
            // set   as text for IE
            label.html("");
        }
    });

    // Support for custom scripting for specific forms:
    //   example:
    //		addCustomScripting('myFormIdentifier',myFormInitialize);
    //      -- the above will execute a function named "myFormInitialize" only for the form "myFormIdentifier"

});

function addCustomScripting(form_identifier, function_name) {
    if ($('#form_identifier').length > 0 && $('#form_identifier').val() == form_identifier) {
        if (typeof function_name == "function") {
            // function exists.
            function_name(form_identifier);
        } else {
            console.log('Form Identifier has custom scripting applied but specified function not found');
        }
    }
}
// submit the form
function SubmitTheForm() {
    $('.ajaxInProgress_wrapper').show();
    var encoded_params = $('#L9Form').serialize();

    $.ajax({
            type: "POST",
            url: "/render.php",
            data: encoded_params,
            dataType: 'json'
        })
        .done(function(resultsObj) {
            if ('status' in resultsObj && resultsObj.status == 'success') {
                // hide the div and show the description div then load the message area
                $("#L9Form_div").hide('slow').html('');

                if ('response' in resultsObj) {
                    $("#L9Form_message_area").html(resultsObj.response).fadeIn('slow');

                    // 2020oct workaround for form confirmation not landing in visible area of page
                    //  strategy: delay to give browser recalc time, then animate with a fixed offset
                    var hdroffset = -150;
                    $('html, body').delay(1000).animate({
                        scrollTop: $('#L9Form_message_area').offset().top + hdroffset
                    }, 'fast');
                }
            } else {
                if ('response' in resultsObj) {
                    $("#L9Form_message_area").html(resultsObj.response).fadeIn('slow');
                }
            }

        })
        .fail(function(results) {
            alert("We're sorry, the form processing system is currently unavailable. Please try again later.");
        });

    // end progress indicator
    $('.ajaxInProgress_wrapper').hide();
}
/*
	========================================================
		FORM-SPECIFIC FUNCTIONS
	========================================================
*/