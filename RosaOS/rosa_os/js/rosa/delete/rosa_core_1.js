(function( window, $, undefined ){

    //===== CONSOLE ==========================================================//

    if( ! window.console ){
        window.console = {
            log : function( str ){
                if( R.DEBUG.started ){
                    R.log( str );
                }
            }
        }
    }

    //===== ROSA : R =========================================================//

    //$.ajaxSetup({ 'cache' : false });

    var R = {
        reqClock : 0,
        reqLock : false,
        reqObjectList : [],
        reqNameList : [],
        jsLoadedList : [],
        apiProgress : [],
        tmp : {},
        clipboard : {},

        syncPost : function( url, param, func, type ){
            if( ! url){alert('Async POST Error : Invalid URL');}
            if( ! param){param = {};}
            if( ! func){func = $.noop;}
            if( ! type){type = 'text';}

            //set async for require step by step
            $.ajaxSetup({'async': false});
            //sent post request to server
            $.post(url, param, func, type );
            //set async to true when finish function
            $.ajaxSetup({'async': true});
        },

        syncApi : function( api_func, data, func ){
            var response = {};
            //set async for require step by step
            $.ajaxSetup({'async': false});

            R.api(api_func, data, function( res ){
                response = res;
                if($.isFunction(func)){
                    func(res);
                }
            });
            //set async to true when finish function
            $.ajaxSetup({'async': true});

            return response;
        },

        api : function( api_func, data, func, app_id ){
            func = ($.isFunction(func))? func : $.noop;
            data = (data)? data : [];

            var async = false;
            if(app_id === undefined){
                //when not pass app_id
                async = true;
            }else if(R.apiProgress[app_id] === undefined){
                //when first time calling api
                R.apiProgress[app_id] = false;
            }

            if( R.apiProgress[app_id] === false || async === true ){
                //lock same api using at once time
                R.apiProgress[app_id] = true;
                //show Status
                R.showStatus('Loading... '+api_func);
                //request to server
                var self = this;
                $.post(
                    'api/'+api_func,
                    {'param' : data},
                    function( str_json ){
                        //unlock api
                        self.apiProgress[app_id] = false;
                        // first aid check is JSON
                        if(R.canParseJSON(str_json)){
                            //when error
                            if( str_json.error === true ){
                                console.log('ERROR !! ROSA API : ');
                                console.log(str_json.reason);
                            }
                            func( $.parseJSON(str_json) );
                        } else if( $.trim(str_json) == '' ){
                            func( undefined );
                        } else {
                            console.log('ERROR !! ROSA API : ');
                            console.log(str_json);
                        }
                        //hide status
                        R.hideStatus();
                    }
                );
            }
        },
        
        syncSysCall : function( api_func, data, func ){
            R.syncApi(api_func, data, func);
        },
        sysCall : function( api_func, data, func, app_id ){
            R.api( api_func, data, func, app_id );
        },

        getJS : function( path, func ){
            path = R.APPS_PATH + path;
            //control transection
            R.reqObjectList.push({
                'path':path,
                'func':func
            });
            //push Required name
            R.reqNameList.push(path);
            //get script
            if( !$.isFunction(func) ){
                func = $.noop;
            }
            //is loaded js ?
            if(R.arrayIndexOf(R.jsLoadedList, path) == -1){
                R.jsLoadedList.push(path);
                //get script and eval
                $.getScript(path, function(){
                    //do callback
                    if($.isFunction(func)){
                        func();
                    }
                    if(R.reqObjectList.length != 0){
                        //pop req next
                        var req = R.reqObjectList.shift();
                        R.getJS(req.path, req.func);
                    }
                });//end getScript
            } else {
                if(R.reqObjectList.length != 0){
                    //get next
                    var req = R.reqObjectList.shift();
                    R.getJS(req.path, req.func);
                }
            }
        },//end getJS

        cssLoadedList : [],
        getCSS : function(href){
            href = R.APPS_PATH + href;
            $.getCSS(href);
        },

        getHTML : function( url, data, func ){
            var h = '';
            R.syncPost( 'api/path/app/', {'param': [url, data]}, function(html){
                func(html);
                h = html;
            }, 'html');
            return h;
        },

        makeTemplate : function( html, quote ){
            var id = R.randID('rosa_template');
            //append in script tag for use jqote2
            //fixed. chrome not allow to paste <% into any html
            html = html.replace(/<%/g,'(%template').replace(/%>/g,'template%)');
            //add to dock
            $('#rosa_html_dock').append(['<div id="',id,'">',html,'</div>'].join(''));

            //template object
            var obj = function( selec ){
                return $('#'+id).find(selec);
            }
            obj = $.extend(obj, {
                getID : function(){
                    return id;
                },
                getHTML : function( selec, data ){
                    var html = obj(selec).html().replace(/\(%(template)/g, '<%')
                                                .replace(/(template)%\)/g, '%>')
                                                .replace(/&lt;/g, '<')
                                                .replace(/&gt;/g, '>');
                    if( !data ){
                        return html;
                    }
                    return $.jqote(html, data);
                }
            });

            return obj;
        },

        loadTemplate : function( url, func, data ){
            data = (data)? data : [];
            var templ = {};
            
            R.syncPost( 'api/path/app/',
            {'param': [url, data]},
            function(html){
                var obj = R.makeTemplate(html);
                if($.isFunction(func)){
                    func( obj ); //callback
                }
                //for return
                templ = obj;
            });
            //return templ obj
            return templ;
        },

        getLoadedHTML : function( id, data ){
            return $('#rosa_html_dock').find('#'+id).jqote(data);
        },

        trapLoop : function( func_unlock, func_doing ){
            if($.isFunction(func_unlock) && $.isFunction(func_doing)){
                (function trap(){
                    if(func_unlock()){
                        func_doing();
                        return;
                    } else {
                        setTimeout(function(){
                            trap();
                        },97);
                    }
                })();
            }
        },

        onLoadList : [],
        onLoadLock : false,

        onload : function( templ_url ,_func ){
            R.onLoad( templ_url ,_func );
        },

        onLoad : function( templ_url ,_func ){
            var func = $.noop;
            if( $.isFunction(_func) ){
                // when onload complete is load template
                func = function(){
                    R.loadTemplate(templ_url, function(templ){
                        _func( templ );
                        R.onLoadLock = false;
                    });
                };
            } else if( $.isFunction(templ_url) ){
                func = function(){
                    templ_url();
                    R.onLoadLock = false;
                };
            }
            
            //push to queue
            R.onLoadList.push( func );

            R.trapLoop(
                function(){
                    //check request_JS is finish
                    return (R.reqObjectList.length == 0 && ! R.onLoadLock)? true : false ;
                },
                function(){
                    //run first queue
                    var func = R.onLoadList.shift();
                    R.onLoadLock = true;
                    $(func);
                });
        },//end onLoad

        onloadComplete : function(func){
            R.onLoadComplete(func);
        },

        onLoadComplete : function( func ){
            window.onload = function(){
                R.onLoad(func);
            }
        },//end onComplete

        onResizeList : [],
        onWindowResize : function( func ){
            R.onResizeList.push(func);
            //init for func
            func(R.CLIENT.width, R.CLIENT.height);
        },//end onWindowResize

        clone : function( obj ){
            var newObj = $.extend({}, obj);
            //gennewId for absolute clone
            if($.isFunction(newObj.genNewId)){
                newObj.genNewId();
            }
            return newObj;
        },//end clone

        createObject : function( obj ){
            R.makeObject(obj);
            return obj.newObject();
        },

        extend : function( sub_class, super_class ){
            var sup = R.createObject(super_class);
            sub_class = $.extend(sup, sub_class);
            return sub_class;
        },//end extend

        selfExtend : function( obj ){
            R = $.extend(true, R, obj)
        },

        arrayIndexOf : function( array, keyword ){
            var index = -1;
            $.each(array ,function(i){
                if( keyword == this ){
                    index = i;
                }
            });
            return index;
        },

        inArray : function( array, keyword ){
            if( R.arrayIndexOf(array, keyword) == -1 ){
                return false;
            }
            return true;
        },

        arrayLast : function( array ){
            return array[ array.length - 1 ];
        },

        makeObject : function( obj ){
            //make object
            var o = function(){
                this.__rosa__id = R.randID();
                
                if( $.isFunction( this.init ) ){
                    this.init.apply(this, arguments);
                } 
            }
            o.prototype = $.extend( obj, {
                genNewID : function(){
                    this.__rosa__id = R.randID();
                },
                getID : function(){
                    return this.__rosa__id;
                }
            });

            return o;
        },

        randID : function( prefix ){
            prefix = ( prefix )? prefix+'_' : '';
            return prefix + parseInt(100000000 + (Math.random()*899999999));
        },

        timeStamp : function(){
            var time = '';
            /* FROM : http://www.tizag.com/javascriptT/javascriptdate.php */
            var currentTime = new Date();
            var hours = currentTime.getHours();
            var minutes = currentTime.getMinutes();
            var second = currentTime.getSeconds();
            if (minutes < 10){
                minutes = "0" + minutes;
            }
            if(second < 10){
                second = "0" + second;
            }
            time = hours + ":" + minutes + ":" + second;
            return time;
        },

        log : function(str){
            R.onLoad(function(){
                if(!R.DEBUG.started){
                    R.DEBUG.start();
                }
                R.DEBUG.log(str);
            })
        },

        CLIENT : {
            'width': $(window.document).width(),
            'height': $(window.document).height(),
            'isIE': $.browser.msie,
            'isIE6': ($.browser.msie && parseInt($.browser.version) == 6),
            'isIE7': ($.browser.msie && parseInt($.browser.version) == 7),
            'isIE8': ($.browser.msie && parseInt($.browser.version) == 7),
            'isFirefox': $.browser.mozilla,
            'isChorme': $.browser.webkit
        },

        DEBUG : {
            line : 0,
            jDebugContain : 'R-debug',
            $debugContain : $.noop,
            jDebug : 'debug',
            $debug : $.noop,
            started : false,
            enable : true,

            start : function(){
                if( !R.started && R.enable ){
                    R.started = true;

                    var self = this;
                    $('body').append(['<div id="',R.jDebugContain,'" >',
                        '<div style="float:right;"><a href="#" onClick="R.DEBUG.clearLog()">Clear</a></div>',
                        '<table id="',R.jDebug,'" border="0">',
                        '</table>',
                        '</div>'].join(''))
                    .ready(function(){
                        self.$debugContain = $('#'+self.jDebugContain);
                        self.$debug = $('#'+self.jDebug);
                        self.$debugContain.dialog({
                            title:': Debug',
                            height:600,
                            width:450
                        });
                    });
                }
                return this;
            },

            log : function( str ){
                //wait for $debug ready
                while( R.$debug.size() == 0 ){};

                R.$debug.append(['<tr class="R-debug-tr-',R.line%2,'">',
                    '<td width="50"style="color:blue;">',R.line++,'</td>',
                    '<td width="60" style="color:green;">',R.timeStamp(),'</td>',
                    '<td>',str,'</td>',
                    '</tr>'].join(''));
                
                R.$debugContain.scrollTo('max');
            },

            clearLog : function(){
                R.$debug.html('');
                R.line = 0;
            }
        },

        appendHTML : function( html, target ){
            return R.addHTML(html, target);
        },

        make$R : function( scope ){
            var id = R.randID('R');
            //if scope not have id , just added
            var tmp_id = $(scope).attr('id');
            if( ! tmp_id){
                $(scope).attr('id', id);
            } else {
                id = tmp_id;
            }

            var $R = function( selec ){
                if(selec){
                    return $(selec, '#'+id);
                }
                return $('#'+id);
            }

            $R.getID = function(){
                return id;
            }

            $R.ui = function( select ){
                if( select ){
                    return window.R.ui( select, '#'+id );
                }
                return window.R.ui('#'+id);
            }

            $R.ui.parse = function( func, scope ){
                func = (func)? func : $.noop;
                scope = (scope)? scope : $('#'+id);

                window.R.ui.parse(func, scope);
            }

            return $R;
        },

        addHTML : function( html, target ){
            if( !target ){
                target = '#rosa_desktop';
            }

            var id = R.randID('app');
            //wrap by "id" and append
            $(target).append(['<div id="', id, '">', html, '</div>'].join(''));
            //move id to real_HTML and unwrap
            $('#'+id+' > div', target).attr('id',id).unwrap();

            return R.make$R('#'+id);
        },

        alert : function( str, header ){
            var id = R.randID('alert');
            header = (header)? ' : '+header : '!!!';
            $('body').append(
                ['<div id="',id,'" class="r_alert" >',
                '<div class="rosa_icons_warning_64 rosa_icons_64 left" ></div>',
                '<div class="left" style="margin: 10px 0 0 10px; width: 245px;" >',str,'</div>',
                '<div class="clear"></div>',
                '</div>'
                ].join('')
                ).ready(function(){
                $('#'+id).dialog({
                    'title' : 'Alert '+header,
                    'width' : 350,
                    'resizable' : false,
                    'modal' : true,
                    'close' : function(){
                        $('#'+id).dialog('destroy');
                    },
                    'buttons' : {
                        'OK' : function(){
                            $('#'+id).dialog('destroy');
                            $('#'+id).remove();
                        }
                    }
                });
            });
        },

        confirm : function( str, header, fn_yes, fn_no ){
            fn_yes = (fn_yes)? fn_yes : $.noop;
            fn_no = (fn_no)? fn_no : $.noop;

            var id = R.randID('alert');
            header = (header)? ' : '+header : '!!!';

            $('body').append(
                ['<div id="',id,'" class="r_alert" >',
                '<div class="rosa_icons_question_64 rosa_icons_64 left" ></div>',
                '<div class="left" style="margin: 10px 0 0 10px; width: 245px;" >',str,'</div>',
                '<div class="clear"></div>',
                '</div>'
                ].join('')
                ).ready(function(){
                $('#'+id).dialog({
                    'title' : 'Confirm '+header,
                    'width' : 350,
                    'resizable' : false,
                    'modal' : true,
                    'close' : function(){
                        $('#'+id).dialog('destroy');
                    },
                    'buttons' : {
                        'Yes' : function(){
                            fn_yes();
                            $('#'+id).dialog('destroy');
                            $('#'+id).remove();
                        },
                        'NO' : function(){
                            fn_no();
                            $('#'+id).dialog('destroy');
                            $('#'+id).remove();
                        }
                    }
                });
            });
        },

        canParseJSON : function(str){
            return ( str.indexOf('{') == 0 || str.indexOf('[') == 0 )? true : false;
        },

        isMouseHover : function( event, ele ){
            var $ele = $(ele);

            var offset = $ele.offset();
            var size = {
                'width'  : $ele.outerWidth(),
                'height' : $ele.outerHeight()
            }

            //check mouse hover?
            if( event.pageX < offset.left + size.width &&
                event.pageX > offset.left &&
                event.pageY < offset.top + size.height &&
                event.pageY > offset.top
            ){
                return true;
            }
            return false;
        },

        statusList : [],
        showLoading : function(){
            R.showStatus('Loading ...');
        },

        showStatus : function( str, force){
            R.statusList.push(str);
            if( R.statusList.length == 1 || force){
                var _str = R.statusList.pop();
                if( $('#rosa_status').size() == 0 ){
                    $('body').append([
                        '<div id="rosa_status" style="',
                        'left: ',(R.CLIENT.width/2)-100,'px;',
                        '" >',_str,'</div>'
                    ].join('')).ready(function(){
                        $('#rosa_status').css('opacity', 0.9);
                    });
                } else {
                    $('#rosa_status').html(_str).show();
                }
            }
        },

        hideStatus : function(){
            if(R.statusList.length > 0){
                var str = R.statusList.pop();
                R.showStatus(str,true);
            } else {
                $('#rosa_status').hide();
            }
        },

        iconImage : function( path ){
            return R.APPS_PATH + path;
        }

    }; // rosa global object

    //========== ON WINDOW RESIZE ==========//

    $(window).resize(function(){
        R.CLIENT.width = $(this).width();
        R.CLIENT.height = $(this).height();
        //doing Observer
        $.each(R.onResizeList,function(){
            this(R.CLIENT.width, R.CLIENT.height);
        });
    });
    //trigger
    $(window).resize();

    //satstus
    R.onWindowResize(function(){
        $('#rosa_status').css('left',(R.CLIENT.width/2)-100);
    });

    //========== DEBUG ==========//
    R.DEBUG = R.makeObject(R.DEBUG);
    R.DEBUG = new R.DEBUG();

    // add R to global Object
    window.R = $.extend(window.R, R);

})(window, jQuery);

