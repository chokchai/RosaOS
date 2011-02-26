(function( window, $, undefined ){
    var R = window.R; 
    //===== UI JQUERY ====================================================//
    var ui = function( selector, scope ){
        return $(selector, scope);
    }
    ui = $.extend(ui, $);

    //add template
    $(function(){
        ui.templ = R.loadTemplate('app://rosa_ui/template/ui_templ.php');
    });

    //===== UI CLASSES ===================================================//
    ui.dialog = {
        init : function( select, opt ){
            this.opt = {};
            this.$R = {};
            this.$ele = {};
            this.$head = {};
            this.$body = {};
            this.$foot = {};

            //rosa options parameter name
            var default_opt = {
                'menuHeight': 70,
                'bodyHeight': 440,
                'footerHeight': 30,
                'iconClass': 'rosa_icons_24',
                'height': 500,
                'width': 600
            };

            //get menu_html
            this.$ele = $(select);
            this.opt = $.extend(default_opt, opt);

            if( opt.bodyHeight ){
                this.opt.height = this.opt.bodyHeight;
            }

            this.opt.height += 36;
            this.opt.width += 4;
        },

        run : function(){
            //for shot_cut
            var $ele = this.$ele;

            //get all html
            var menuHTML = false, menuClass = '',
            footHTML = false, footClass = '';
            this.$menu = $('.rosa_dialog_menu', $ele);
            if( this.$menu.size() == 1 ){
                menuHTML = this.$menu.html();
                menuClass = this.$menu.attr('class');
            }
            this.$foot = $('.rosa_dialog_footer', $ele);
            if( this.$foot.size() == 1 ){
                footHTML = this.$foot.html();
                footClass = this.$foot.attr('class');
            }

            //remove header and footer
            $('.rosa_dialog_menu, .rosa_dialog_footer', $ele).remove();

            //set $ele to dialog
            $ele = $ele.dialog(this.opt).parent();

            //bind focus and blur effect
            $ele.bind('dialogfocus', function(){
                $('.ui-dialog-titlebar').addClass('dialog-titlebar-blur');
                $ele.find('.ui-dialog-titlebar').removeClass('dialog-titlebar-blur');
            }).trigger('dialogfocus');

            //add menu
            if( this.$menu.size() == 1 ){
                $('.ui-dialog-titlebar', $ele).after('<div class="'+menuClass+'">'+menuHTML+'</div>');
                $('.rosa_dialog_menu', $ele).css('height', this.opt.menuHeight);
            }
            //add footer
            if( this.$foot.size() == 1 ){
                $('.ui-dialog-content', $ele).after('<div class="'+footClass+'">'+footHTML+'</div>');
                $('.rosa_dialog_footer', $ele).css('height', this.opt.footerHeight);
            }
            //add icons to header
            $('.ui-dialog-titlebar', $ele).prepend([
                '<div class="rosa_dialog_icon left ',this.opt.iconClass,'" ></div>'
                ].join(''));
            //add miniminze button
            $('.ui-dialog-titlebar-close', $ele).before([
                '<a href="#" class="ui-dialog-titlebar-minimize ui-corner-all" role="button" ',
                'style="height: 18px; margin: -10px 0 0;padding: 1px;position: absolute;right: 25px;top: 50%;width: 19px;" >',
                '<span class="ui-icon ui-icon-minusthick">minimize</span>',
                '</a>'
                ].join(''));

            var $R = R.make$R($ele);
            var self = this;
            //add dialog helper to $R
            $R.isDialog = true;
            var dialog = function(){
                return self.$ele.dialog.apply(self.$ele, arguments);
            };
            $R.dialog = $.extend(dialog, {
                $ : this.$ele,
                object : this,
                option : this.opt,
                $title : $R('.ui-dialog-title'),
                $icon : $R('.rosa_dialog_icon'),
                $close : $R('.ui-dialog-titlebar-close'),
                $minimize: $R('.ui-dialog-titlebar-minimize'),
                $header : $R('.rosa_dialog_menu'),
                $body : $R('.ui-dialog-content'),
                $footer : $R('.rosa_dialog_footer')
            });
                
            //add minimize button hover class
            $R.dialog.$minimize
            .hover(function(){
                $(this).addClass('ui-state-hover').css('padding',0);
            }, function(){
                $(this).removeClass('ui-state-hover').css('padding',1);
            })
            .find(' > span')
            .css('margin','1px');

            this.$R = $R;

            return $R;
        },

        option : function(){
            this.$ele.dialog.apply({}, arguments);
            return false;
        },

        get$R : function(){
            return this.$R;
        },

        get$ : function(){
            return this.$ele;
        }
    };
    ui.dialog = R.makeObject(ui.dialog);

    //add jquery method
    ui.fn.extend({
        rosaDialog : function( opt ){
            var dialog = new ui.dialog($(this), opt);
            dialog.run();
            return dialog.get$R();
        },

        rosaDrag : function( _opt ){
            return $(this).each(function(){
                //add Drag outer or inner scope for work with droppable
                if( $.isPlainObject(_opt) ){
                    var copy_opt = $.extend({
                        scope : 'body',
                        appendTo: '#rosa_drag_helper_temp'
                    }, _opt);
                    var scope = copy_opt.scope;
                    var data = (_opt.data)? _opt.data : {};
                    //extends old data
                    $(this).data( $.extend( $(this).data(), data ) );
                    var opt = {
                        start : function(e, ui){
                            var $this = $(this);
                            //when start is inner
                            $(this).data('drop','inner');
                            //check is drop in other scope
                            $(scope).unbind('.rosaDrag')
                            .bind('mouseleave.rosaDrag',function(e){
                                if( ! R.isMouseHover(e, $('#rosa_drag_helper_temp > *'))){
                                    $this.data('drop','outer');
                                }
                            })
                            .bind('mouseenter.rosaDrag',function(){
                                $this.data('drop','inner');
                            });
                            //trigger default start function
                            if($.isFunction(_opt.start)){
                                _opt.start.apply(this, [ e, ui, this ]);
                            }
                        }
                    }
                    //remove rosa properties
                    delete( copy_opt.data );
                    delete( copy_opt.scope );
                        
                    $(this).draggable( $.extend(copy_opt, opt) );
                } else {
                    $(this).draggable( _opt );
                }
            });
        },
            
        rosaDrop : function( _opt ){
            return $(this).each(function(){
                var for_me = false;
                var dragging = false;
                //fixed buggy when drop to element has overlap to each other
                if( $.isPlainObject(_opt) ){
                    var copy_opt = $.extend({},_opt);
                    var data = $(this).data();
                    var opt = {
                        drop : $.noop,
                        //hoverClass : '',
                        activate : function(e, ui){
                            for_me = false;
                            dragging = true;
                                
                            if( $.isFunction(_opt.activate) ){
                                $(this).data(data);
                                _opt.activate.apply(this, [e, ui, this]);
                            }
                        },
                        deactivate : function(e, ui){
                            //console.log('DROP : '+for_me);
                            dragging = false;
                            if( $.isFunction(_opt.drop) && for_me ){
                                for_me = false;
                                //console.log(data);
                                $(this).data(data);
                                //console.log($(this).data('file_info').name+' ['+$(this).data('app_object').getID()+']');
                                _opt.drop.apply(this, [e, ui, this]);
                            }

                            if( $.isFunction(_opt.deactivate) ){
                                $(this).data(data);
                                _opt.deactivate.apply(this, [e, ui, this]);
                            }

                            $(this).removeClass(_opt.hoverClass);
                        }
                    };
                        
                    $(this).droppable( $.extend(copy_opt, opt) )
                    .mouseenter(function(e){
                        for_me = true;
                        if( dragging ){
                            $(this).addClass(_opt.hoverClass);
                        }
                    }).mouseleave(function(e){
                        for_me = false;
                        if( dragging ){
                            $(this).removeClass(_opt.hoverClass);
                        }
                    }).bind('click dblclick', function(){
                        for_me = false;
                        dragging = false;
                    });
                               
                } else {
                    $(this).droppable( _opt );
                }
            });
        },

        rosaDownload : function( func ){
            return $(this).click(function(e){
                e.stopPropagation();
                var file_info = $(this).data('file_info');
                var rosa_name = '';
                if( $.isArray(file_info) ){
                    var r = [];
                    $.each( file_info, function(){
                        r.push( this.rosa_name + '_' );
                    });
                    r[r.length-1] = r[r.length-1].replace('_', '');
                    rosa_name = r.join('');
                } else {
                    rosa_name = file_info.rosa_name;
                }
                window.location = R.BASE_URL + 'downloads/' + rosa_name;
                if( $.isFunction( func ) ){
                    func({
                        'type': 'download',
                        'status': 'start',
                        'element': this
                    });
                }
                return false;
            }).dblclick(function(){
                return false;
            });
        },

        rosaProperties : function( func ){
            return $(this).click(function(){
                var self = this;
                R.api('file/file_info/', [ $(this).data('file_info').id ], function( f ){
                    if( f != undefined ){
                        //show file_info dialog
                        var id = R.randID('properties');
                        var view = (f.type == 0)? 'folder' : 'file';
                        $('body').append(
                            R.ui.templ('#templ_rosa_ui_properties_'+view, $.extend({'dialog_id':id}, f))
                            ).ready(function(){
                            R.UI('#'+id).rosaDialog({
                                'buttons' : {
                                    'OK' : function(){
                                        $('#'+id).dialog('destroy');
                                    }
                                },
                                'width' : 300,
                                'height' : 300
                            });
                        });

                        if( $.isFunction(func) ){
                            var status = (f)? 'complete' : 'error';
                            var error = (f)? false : true;
                            var reason = (status == 'error')? 'RESPONSE_FROM_SERVEERROR' : 'NO_REASON';
                            var ui = {
                                'type' : 'porperties',
                                'status' : status,
                                'error' : error,
                                'element' : self,
                                'reason' : reason
                            }
                            func(ui ,f);
                        }
                    }
                });
            //end R.api
            }).dblclick(function(){
                return false;
            });
        },

        rosaDelete : function( func ){
            return $(this).click(function(){
                var self = this;

                var file_info = $(this).data('file_info');
                var files_id = [];
                var fname = '';
                if( $.isArray(file_info) ){
                    //get all file id to delete
                    $.each(file_info, function(i){
                        files_id.push(this.id);
                    });

                    if( file_info.length == 1 ){
                        fname = file_info[0].fullname;
                    } else {
                        fname = file_info.length + ' files';
                    }
                } else {
                    fname = file_info.fullname;
                }
                //function when confirm to delete
                var fn_yes = function(){
                    R.api('file/delete/',[ files_id ], function(res){
                        if($.isFunction(func)){
                            var ui = {
                                'type' : 'delete',
                                'status' : 'complete',
                                'element' : self
                            }
                            func(ui, res);
                        }
                    });
                };

                R.confirm('Do you want to Delete ? <br/> <u>'+fname+'</u> ', 'Delete ?', fn_yes);
            }).dblclick(function(){
                return false;
            });
        },

        rosaUpload : function( func ){
            return $(this).each(function(){
                var self = this;
                var upload_obj = $(this).upload({
                    name: 'file',
                    action: R.BASE_URL + 'api/file/upload/',
                    enctype: 'multipart/form-data',
                    autoSubmit: true,
                    onSubmit: function() {
                        console.log('upload : submit');

                        // update foldeid
                        upload_obj.params({
                            'param' : [ $(self).attr('folder_id') ]
                        });
                        if($.isFunction(func)){
                            var ui = {
                                'type' : 'upload',
                                'status' : 'submit',
                                'element' : self
                            };
                            func( ui );
                        }
                        R.showStatus('Uploading ...');
                    },
                    onComplete: function( response ) {
                        console.log('upload : complete');
                        console.log(response);

                        if($.isFunction(func)){
                            var ui = {
                                'type' : 'upload',
                                'status' : 'complete',
                                'error' : false,
                                'reason' : 'NO_REASON',
                                'element' : self
                            };                        
                            if( R.canParseJSON( response ) ){
                                response = $.parseJSON( response );
                            } else {
                                response = undefined;
                                ui.error = true;
                                ui.reason = 'RESPONSE_FROM_SERVEERROR';
                            }
                            func( ui, response );
                            R.hideStatus();
                        }
                    },
                    onSelect: function() {
                        console.log('upload : select');
                        if($.isFunction(func)){
                            var ui = {
                                'type' : 'upload',
                                'status' : 'select',
                                'element' : self
                            };
                            func( ui );
                        }
                    }
                });
            });
        },

        rosaBrowse : function( opt ){
            return $(this).each(function(){

                });
        },

        rosaIcon : function( opt ){

        },

        rosaUnselect : function(){
            return $(this).each(function(){
                $(this).mouseleave(function(){
                    //when select we replace self value to de select
                    if( $(this).attr('value') ){
                        $(this).val( $(this).val() );
                    } else {
                        $(this).html( $(this).html() );
                    }
                })
            });
        }

    });

    //add function
    ui.extend({

        parse : function( func, scope ){
            if( ! scope){
                scope = 'body';
            }
            ui('.upload[parse!=ok]', scope).attr('parse','ok').rosaUpload(func);
            ui('.browse[parse!=ok]', scope).attr('parse','ok').rosaBrowse(func);
            ui('.properties[parse!=ok]', scope).attr('parse','ok').rosaProperties(func);
            ui('.download[parse!=ok]', scope).attr('parse','ok').rosaDownload(func);
            ui('.delete[parse!=ok]', scope).attr('parse','ok').rosaDelete(func);
            ui('.button[parse!=ok]', scope).attr('parse','ok').button(func);
            ui('.unselect[parse!=ok]',scope).attr('parse','ok').rosaUnselect();
        }
    });

    //add to global object
    window.R.UI = window.R.ui = ui;

})(window, jQuery);

