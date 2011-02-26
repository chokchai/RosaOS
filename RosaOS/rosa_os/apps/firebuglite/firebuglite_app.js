(function(window, $, undefined){
    var R = window.R;
    var App = R.getHelper('firebuglite');

    var firebug = {
        NAME : 'Firebuglite',
        IS_PROCESS : true,

        init : function(){
            //IGNORE
        },

        run : function(){
            $.getScript("https://getfirebug.com/firebug-lite.js");
        }
    };

    R.AppManager.add(firebug);

})(window, jQuery);

