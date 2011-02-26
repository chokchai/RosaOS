jQuery(function($){
    $('.r_dialog').dialog({
        title : 'Administrator login',
        width : $('.r_dialog').width()+5,
        height : $('.r_dialog').height()+40,
        resizable : false,
        close : function(){
            window.location = window.location;
        }
    })
    .find('.button')
    .button();
});

