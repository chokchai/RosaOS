(function( $, window, undefined ){

    var R = window.R;

    var openwith = {
        appList : {},
        appDefault : {},
        extList : {},

        register : function( ext_list, func, name ){
            ext_list = ext_list.split('|');
            //check is application objcet ?
            //when is true rebuild function
            if( $.isPlainObject(func) ){
                //get name
                name = func.NAME;
                //try to register application to AppManager
                if( ! R.AppManager.isAppExist(name) ){
                    R.AppManager.add(func);
                }
                //set function
                func = function(file, ext){
                    //run by ApplicationManager
                    R.AppManager.run[name](file, ext);
                }
            } 
            //add to applist
            this.appList[name] = true;

            //sign to appused
            var self = this;
            $.each(ext_list, function(i, ext){
                self._singleRegister(ext, func);
                //add to extList
                if( self.extList[ext] === undefined ){
                    self.extList[ext] = [];
                }
                self.extList[ext].push(name);
            });
        },

        _singleRegister : function( ext, func ){
            //when no default apps
            if( ! this.isAppUsedExtension(ext) ){
                //set to appUsed
                this.setDefaultApp(ext, func);
            }
        },

        setDefaultApp : function(ext, func){
            this.appDefault[ext] = func;
        },

        isAppUsedExtension : function( ext ){
            if( $.isFunction(this.appDefault[ext]) ){
                return true;
            }
            return false;
        },

        getDefaultApp : function(){
            return this.appDefault;
        },

        getAppList : function( ext ){
            if(ext && this.extList[ext] !== undefined){
                var self = this;
                var li = [];
                $.each( this.extList, function(i, name){
                    li.push(self.appList[name]);
                });
                return li;
            }
            return this.appList;
        },

        getExtList : function(){
            return this.extList;
        },

        open : function( file_data ){
            var ext = file_data.extension;
            if(file_data.type == 0){
                //is folder
                ext = 'folder';
            } else if(file_data.type == 3){
                //is shortcut
                ext = 'shortcut';
            } else if(ext){
                ext = ext.toLowerCase();
            }

            if(this.isAppUsedExtension(ext)){
                var func = this.appDefault[ext];
                func(file_data, ext);
            } else {
                // [waiting for ...] let user select apps
                R.alert('Can not Open "'+file_data.name+'.'+ext+'" <br/>'+
                        ' Because No Aplication Support File Types "'+ext+'". ',
                        'Open With' );
            }
        }
    };

    window.R.OPENWITH = window.R.openwith = openwith;

})( jQuery, window );