(function(window, $, undefined){
    var R = window.R;

    var App = R.getHelper('rosa_notepad');
    var file = R.getClass('file');

    var notepad = {
        NAME : 'RosaNotepad',
        ACCEPT_SIGNAL : 'file',
        ONE_INSTANCE : true,

        init : function(){
            App.getCSS('css/notepad.css', true);
            App.getJS('js/codemirror/codemirror.js');
            this.tmpl = App.loadTemplate('tmpl/rosa_notepad.php');
            this.$R = {};
            this.editor = {};
        },

        onMoreInstance : function(f){
            var $R = this.$R;
            var self = this;
            var changeFile = function(){
                //set file_info to save button
                $R('#save').data('file_info', f);
                //get file data and set to code
                var content = file.read_file(f.id).data;
                self.editor.setCode(content);
                //set Parser
                self.setParserByFileType();
                //set title filename
                $R.dialog.$title.html(f.fullname);
                //set Taskbar title
                R.getTaskByApp(self).setTitle(f.fullname);
            };
            //save current files
            R.confirm('You want to save file '+$R('#save').data('file_info').fullname+' ?',
                      'Rosa Edit',
                      function(){
                          //save before change file.
                          $R('#save').click();
                          changeFile();
                      },
                      function(){
                          changeFile();
                      }
            );
        },

        run : function(f){
            var self = this;
            var tID = R.randID('np');
            var data = {}; //data for init text-editor
            data.textareaID = tID;
            if(f !== undefined){
                //open files and application
                data.content = file.read_file(f.id).data;
            } else {
                data.content = '';
            }
            var $r = R.addHTML(this.tmpl('#tmpl_np_main', data));
            this.$R = $r.ui().rosaDialog({
                title: 'Rosa Notepad',
                iconClass: 'rosa_icon_text_editor_24',
                minWidth: 250,
                minHeight: 250,
                height: 320,
                width: 400,
                menuHeight: 26,
                close : function(){
                    self.destroy();
                },
                resize : function(){
                   var h = self.$R.dialog.$body.height();
                   self.$R('.CodeMirror-wrapping > div, .CodeMirror-wrapping > iframe').css({ height: h });
                }
            });
            this.setupMenu(f);
            this.setupTextarea(tID);
        },

        setupTextarea : function(tID){
            var $R = this.$R;
            var self = this;
            var editor = this.editor = CodeMirror.fromTextArea(tID, {
                 parserfile : [
                    'tokenizejavascript.js', 'parsejavascript.js',
                    'parsecss.js', 'parsepython.js',
                    'parsedummy.js', 'parsexml.js',
                    'tokenizecsharp.js', 'parsecsharp.js',
                    'parsejava.js', 'tokenizejava.js',
                    'parselua.js', 'parsesql.js',
                    'tokenizephp.js', 'parsephp.js',
                    'parsephphtmlmixed.js', 'parsehtmlmixed.js',
                ],
                 path: App.url('js/codemirror/'),
                 stylesheet: [
                     App.url('css/codemirror/jscolors.css'),
                     App.url('css/codemirror/csscolors.css'),
                     App.url('css/codemirror/pythoncolors.css'),
                     App.url('css/codemirror/luacolors.css'),
                     App.url('css/codemirror/phpcolors.css'),
                     App.url('css/codemirror/csharpcolors.css'),
                     App.url('css/codemirror/sqlcolors.css'),
                     App.url('css/codemirror/xmlcolors.css'),
                     App.url('css/codemirror/javacolors.css')
                ],
                content: $('#'+tID).val(),
                tabMode: 'spaces',
                lineNumbers: true,
                saveFunction: function(){
                    var f = $R('#save').data('file_info');
                    if(f !== undefined){
                        file.write_file(f.id, editor.getCode());
                    }
                },
                onLoad : function(){
                    //setup size
                    var h = $R.dialog.$body.height();
                    $R('.CodeMirror-wrapping > div, .CodeMirror-wrapping > iframe').css({ height: h });
                    //set text editor file type
                    self.setParserByFileType();
                }
            });
            
        },

        setParserByFileType : function(){
            var $R = this.$R;
            //setup type
            var f = $R('#save').data('file_info');
            var val = 'text';
            switch(f.extension){
                case 'js': val = 'js'; break;
                case 'css': val = 'css'; break;
                case 'html': val = 'htmlmixed'; break;
                case 'py': val = 'python'; break;
                case 'cs': val = 'csharp'; break;
                case 'php': val = 'phpmixed'; break;
                case 'sql': val = 'sql'; break;
                case 'xml': val = 'xml'; break;
                case 'java': val = 'java'; break;
            }
            $R('#text_type').val(val).change();
        },

        setupMenu : function(f){
            var self = this;
            
            if(f !== undefined){
                //already have file
                this.$R('#save').data('file_info', f);
                //set title
                this.$R.dialog.$title.html(f.fullname);
            }

            var $R = this.$R;
            //set save button
            $R('#save').click(function(){
                var f = $(this).data('file_info');
                if(f){
                    file.write_file(f.id, self.editor.getCode());
                } else {
                    //need to save as...
                    //yes. we trigger click save as button
                    self.$R('#save_as').click();
                }
            });

            //add hover effect
            $R('.rnp_menu > li:not(.rnp_li_ignore)').hover(function(){
                $(this).addClass('hover');
            },function(){
                $(this).removeClass('hover');
            });

            $R('#text_type').change(function(){
                var val = $(this).val();
                var parser = 'DummyParser';
                switch(val){
                    case 'css' : parser = 'CSSParser'; break;
                    case 'js' : parser = 'JSParser'; break;
                    case 'htmlmixed' : parser = 'HTMLMixedParser'; break;
                    case 'python' : parser = 'PythonParser'; break;
                    case 'lua' : parser = 'LUAParser'; break;
                    case 'php' : parser = 'PHPParser'; break;
                    case 'phpmixed' : parser = 'PHPHTMLMixedParser'; break;
                    case 'csharp' : parser = 'CSharpParser'; break;
                    case 'sql' : parser = 'SqlParser'; break;
                    case 'xml' : parser = 'XMLParser'; break;
                    case 'java': parser = 'JavaParser'; break;
                }
                self.editor.setParser(parser);
            });

            //on click browse new file and save old file
            $R('#open').click(function(){
                R.AppManager.run.RosaBrowse('drive://', function(f){
                    //like more instance
                    self.onMoreInstance(f);
                });
            });

            $R('#save_as').click(function(){
                var data = self.editor.getCode();
                R.AppManager.run.RosaSaveAs('drive://', data, function(f_info, folder){
                    $R('#save').data('file_info', f_info);
                    $R.dialog.$title.html(f_info.fullname);
                    //set Parser
                    self.setParserByFileType();
                    //set Taskbar title
                    R.getTaskByApp(self).setTitle(f_info.fullname);
                });
            });
        }

    };//end notepad

    //regis to AppManager
    R.AppManager.add(notepad);

    //regis to Openwith
    R.openwith.register('txt|php|html|css|java|js|xml', notepad);

})(window, jQuery);