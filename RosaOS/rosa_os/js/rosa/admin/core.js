jQuery(function($){

    var $window = $(window);
    var $content = $('#admin_content');
    var $menu = $('#admin_menu');

    var menu_w = $menu.width();

    var change_size = function(){
        var doc_w = $window.width();
        //resize content
        $content.css('width', doc_w - menu_w - 25); // 5 +10+10 is border + padding of content
    };
    //trigger
    change_size();
    //set event to window
    $(window).resize(change_size);

    //confirm links
    $('.confirm_link').click(function(){
        return confirm('Are you sure to delete ?');
    });

    $('.submit_select').change(function(){
        window.location = $(this).val();
    });

});

