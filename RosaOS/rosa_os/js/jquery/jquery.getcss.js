/**
* Get CSS
* http://drstonyhills.com/2009/07/06/jquery-getcss/
*/
(function($){
   $.getCSS = function( url, media ){
      $(document.createElement('link') ).attr({
          href: url,
          media: media || 'screen',
          type: 'text/css',
          rel: 'stylesheet'
      }).appendTo('head');
   }
})(jQuery);


