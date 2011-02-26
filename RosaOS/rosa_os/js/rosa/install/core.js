jQuery(function($){
    if($('#source_php').size() > 0){
        var editor = CodeMirror.fromTextArea('source_php', {
            parserfile : ['tokenizephp.js', 'parsephp.js'],
            path: '../rosa_os/js/rosa/install/codemirror/',
            stylesheet: ['../rosa_os/css/install/codemirror/phpcolors.css'],
            content: $('#source_php').val(),
            tabMode: 'spaces',
            lineNumbers: true
        });
    }

    if($('form').size() > 0){
        $('.button:last').click(function(){
            $('form').submit();
            return false;
        });
    }

});

