R.onLoadComplete(function(){
    var is_open = false;
    $('#rosa_signup').click(function(){
        
        var $dialog = $('#r_login_dialog').parent();
        var $dialog_inner = $('#r_login_dialog');
        var length = 175;
        var top = Math.abs( $dialog.height() - ($dialog.height()+length) )/2;
        var height = $dialog.height();

        if( is_open === false ){
            $('#signup_form').fadeIn();
            $('#rosa_signup').hide();

            $dialog.animate({
                'height': height + length,
                'top': $dialog.offset().top - top
            });

            $dialog_inner.animate({
                'height': height + length
            });
        } else {
            $('#signup_form').fadeOut();
            $('#rosa_signup').show();

            $dialog.animate({
                'height': height - length,
                'top': $dialog.offset().top + top
            });

            $dialog_inner.animate({
                'height': height - length
            });
        }

        //trigger flag
        ( is_open === true )? is_open = false : is_open = true;
    });

    $('#r_login_dialog').dialog({
       'width': 256,
       'height': 130,
       'title' : 'Login',
       'resizable' : false,
       'close' : function(){
           window.location = window.location;
       }
    })
    .find('.button')
    .button();


});


