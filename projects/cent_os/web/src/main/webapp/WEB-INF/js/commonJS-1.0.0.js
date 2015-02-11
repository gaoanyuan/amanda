/**
 * ��Ϊ������汾��ʵ�ֵĻ��ң��˺�����Ψһ�����жϱ������͵ĺ���  "Array", "Object", "Number", "String" , "Boolean", "Function"
 * eg:typeIs(modules,typeIs.String);
 */
function typeIS(obj, type) {
    var typeClass = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && typeClass === type;
}
typeIS.Array = "Array";
typeIS.Object = "Object";
typeIS.Number = "Number";
typeIS.String = "String";
typeIS.Boolean = "Boolean";
typeIS.Function = "Function";
typeIS.Undefined = "undefined";


function IntellijLoad() {
    var intellijLoad = this;
    this.modules = undefined;
    this.basePath = window.location.origin;
    this.baseCssUrl = this.basePath;
    this.baseJsUrl = this.basePath;
    this.ajaxMax = 4;
    this.syncMax = 10;
    this.mergeHttp = false;
    var COMPLETE_LOADING = "completedLoading";
    var COMPLETE_DOWNLOAD = "completedDownload";
    /**
     * ���е���������ڴζ����¹���.
     * @type {{}}
     */
    this.component = {};


    /**
     * �ͻ����õĺ���API������ҳ����߼����뱻�����fnc��.
     * @param modules ��Ҫ��ģ���б�,�����ַ��������ַ�������.
     * @param func ��Ҫ������߼�����.
     */
    this.use = function (modules, func) {
        var needModules = [];
        /** ֻ��Ҫһ��ģ��ʱ�����Դ����ַ����������ַ������� **/
        if (typeIS(modules, typeIS.String)) {
            needModules.push(modules);
        } else if (typeIS(modules, typeIS.Array)) {
            needModules = modules;
        } else {
            Console.error("Need modules error");
            return;
        }
        var page = new PageDomain(needModules, func);
        /**
         * ����Page��������,�Ὣ������ �ֿ�Ϊ�첽����������ͬ����������
         */
        resolveDependency(needModules, page);
        console.log(needModules + "�Ѿ�������������ͬ����������:" + page.syncSortArray);
        /**
         * �ȼ����첽��ģ�飬�첽ģ���ִ������������������ý���
         */
        loadAsyncModule(page);
        /**
         * ͬ������ģ�飬��ʹ��document.createElement("script")��ajax 2�з���.
         */
        loadSyncModule(page);
    };
    /**
     * ѭ������ģ��������ģ��ᱻ�ֳ��첽��ͬ�� 2��������������page������.
     * @param needModules
     * @param page
     */
    function resolveDependency(needModules, page) {
        page.syncDependTree = {};
        page.asyncDependTree = {};
        page.syncSortArray = [];
        page.asyncSortArray = [];
        for (var index in needModules) {
            doResolveDependency(needModules[index], page);
        }
    }

    /**
     * ʹ�õ��������������е�����������ʹ�õ�module����¼��ӿ�
     * @param moduleName
     * @param page
     */
    function doResolveDependency(moduleName, page) {
        var module = intellijLoad.modules[moduleName];
        /**
         * ��ʹ�õ�module����¼��ӿڣ�����prototypeʵ������Ϊÿ��module���¼�Ҫ���Բ�ͬ
         * Module��3���¼�:startLoading,completeLoading,completeExec
         */
        if (module._listener === undefined) {
            EventFunction.apply(module, null);
        }
        var dependTree = null;
        var sortArray = null;
        if (module.async) {
            dependTree = page.asyncDependTree;
            sortArray = page.asyncSortArray;
        } else {
            dependTree = page.syncDependTree;
            sortArray = page.syncSortArray;
        }
        var dependency = dependTree[moduleName];
        if (!dependency) {
            dependency = {
                name: moduleName,
                dependOn: [],
                beDependOn: []
            };
            dependTree[moduleName] = dependency;
            if (module.js) {
                page.addOneNeedModule();
            }
            var requiredArray = intellijLoad.modules[moduleName].required;
            for (var requiredIndex in requiredArray) {
                var requiredName = requiredArray[requiredIndex];
                var requiredModule = intellijLoad.modules[requiredName];
                var requiredDependTree = null;
                if (requiredModule.async) {
                    requiredDependTree = page.asyncDependTree;
                } else {
                    requiredDependTree = page.syncDependTree;
                }
                var requiredDepend = requiredDependTree[requiredName];
                if (!requiredDepend) {
                    doResolveDependency(requiredName, page);
                    requiredDepend = requiredDependTree[requiredName];
                }
                /**
                 * ȥ��ͬ��ģ������cssģ��Ŀ���
                 */
                if (!((module.async == false) && (requiredModule.async == true))) {
                    dependency.dependOn.push(requiredDepend);
                    requiredDepend.beDependOn.push(dependency);
                }
            }
            /**
             * ÿ������ģ�鴴���Ժ󣬻���������е�����,Ȼ������������������
             */
            if (sortArray.indexOf(moduleName) === -1) {
                var maxIndex = 0;
                for (var dependIndex in dependency.dependOn) {
                    var name = dependency.dependOn[dependIndex].name;
                    if (sortArray.indexOf(name) > maxIndex) {
                        maxIndex = sortArray.indexOf(name);
                    }
                }
                sortArray.splice(++maxIndex, 0, moduleName);
            }
        }
    }

    /**
     * ��ɶ��첽ģ��ļ���
     * @param page
     */
    function loadAsyncModule(page) {
        /**
         * �ϲ�http������Ҫ��̨֧�֡�
         */
        if (intellijLoad.mergeHttp) {

        } else {
            for (var asyncDependName in page.asyncDependTree) {
                doLoadAsyncModule(page.asyncDependTree[asyncDependName], page);
            }
        }
    }

    function doLoadAsyncModule(dependency, page) {
        var module = intellijLoad.modules[dependency.name];
        /*var dependOn = dependency.dependOn;
         for (var index in dependOn) {
         doLoadAsyncModule(dependOn[index], page);
         }*/
        if (module._completeLoading) {
            page.asyncLoadingComplete();
        } else {
            module.addEventListener(COMPLETE_LOADING, function () {
                page.asyncLoadingComplete();
            });
        }
        if (module.async === true) {
            if (!module._startLoading) {
                module._startLoading = true;
                loadCSS(module);
                loadAsyncJs(module);
            }
        }
    }

    /**
     * ��ɶ�ͬ��ģ�������
     * @param page
     */
    function loadSyncModule(page) {
        if (intellijLoad.mergeHttp) {
            //TODO
        } else {
            var sortArray = page.syncSortArray;
            var num = sortArray.length;
            if (num < intellijLoad.syncMax) {
                doLoadSyncModule(sortArray, page)
            } else {
                doAjaxSyncModule(sortArray, page);
            }
        }
    }

    function doLoadSyncModule(syncSortArray, page) {
        if (syncSortArray.length <= 0) return;
        var moduleName = syncSortArray.shift();
        var module = intellijLoad.modules[moduleName];

        if (module._completeLoading) {
            page.syncLoadingComplete(moduleName);
            doLoadSyncModule(syncSortArray, page);
        } else {
            module.addEventListener(COMPLETE_LOADING, function () {
                page.syncLoadingComplete(moduleName);
                doLoadSyncModule(syncSortArray, page);
            });
            if (!module._startLoading) {
                module._startLoading = true;
                loadCSS(module);
                loadSyncJs(module);
            }
        }
    }

    /**
     * ͬ���ļ���ajax����ģ��
     * @param syncSortArray
     * @param page
     */
    function doAjaxSyncModule(syncSortArray, page) {
        /**
         * ajaxģʽ����ͬ��js���ȿ�ʼ�����ajax������������
         */
        var num = syncSortArray.length;
        if (num > intellijLoad.ajaxMax) {
            num = intellijLoad.ajaxMax;
        }
        for (var i = 0; i < num; i++) {
            downloadAjaxJS(syncSortArray, page);
        }
    }

    function downloadAjaxJS(syncSortArray, page) {
        if (syncSortArray.length <= 0) return;
        var moduleName = syncSortArray.shift();
        var module = intellijLoad.modules[moduleName];
        if (module._completeLoading) {
            page.completeOneModule(moduleName);
        } else {
            module.addEventListener(COMPLETE_LOADING, function () {
                page.syncAjaxLoadingComplete(moduleName);
            });
            if (module._completeDownload) {
                page.syncAjaxDownloadComplete(moduleName);
            } else {
                module.addEventListener(COMPLETE_DOWNLOAD, function (event) {
                    page.syncAjaxDownloadComplete(moduleName);
                });
            }
            if (!module._startLoading) {
                module._startLoading = true;
                loadCSS(module);
                loadSyncJSFromAjax(module);
            }
        }
        downloadAjaxJS(syncSortArray, page);
    }

    /**
     * ģ����ص��õ���ģ�飬�����첽����JS�ļ�,����Ҳ�Ὣ��Ҫͬ�����ص�js�ļ����ֿ���.
     * @param module
     */
    function loadAsyncJs(module) {
        if (module.js) {
            var headEle = document.getElementsByTagName("head")[0];
            var script = document.createElement("script");
            script.src = module.js;
            script.type = "text/javascript";
            if (module.async) {
                script.async = "async";
            }
            script["onload"] = function () {
                module._completeLoading = true;
                module.fireEvent(COMPLETE_LOADING);
            };
            headEle.appendChild(script);
        }
    }

    /**
     * ����ģ����õ���ģ�飬����ͬ������Js�ļ���ʱ�����ڣ���������ģ�鶼�����ˣ��첽ģ���ֱ�ӿ�ʼ���أ�ͬ��ģ��
     * ����Ҫ����˳��������Ҫ֪�����е�ͬ��ģ���Ժ󣬲��ܿ�ʼ����ͬ��ģ�����
     * @param module
     */
    function loadSyncJs(module) {
        var headEle = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.src = module.js;
        script.type = "text/javascript";
        script["onload"] = function () {
            module._completeLoading = true;
            module.fireEvent(COMPLETE_LOADING)
        };
        headEle.appendChild(script);
    }

    /**
     * ajax ����js�ļ�����ͬ��{@link function loadSyncJS()},ǰ�߿���ͬʱ������Щͬ�������ļ�������ֻ�ܴ�������
     * ����ÿһ�������������󲢷����������ƣ�����ȡ��������м�ֵ 4 ��󲢷�
     * @param module
     */
    function loadSyncJSFromAjax(module) {
        var xhr = new XMLHttpRequest();
        xhr.open("get", module.js, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
                    var script = document.createElement("script");
                    script.type = "text/javascript";
                    script.text = xhr.responseText;
                    module._completeDownload = true;
                    module.script = script;
                    module.fireEvent(COMPLETE_DOWNLOAD);
                }
            }
        };
        xhr.send(null);
    }


    /**
     * ģ�����ʹ�õ���ģ�飬��������CSS�ļ�
     * @param module
     */
    function loadCSS(module) {
        if (module.css) {
            var headEle = document.getElementsByTagName("head")[0];
            var link = document.createElement("link");
            link.href = module.css;
            link.type = "text/css";
            link.rel = "stylesheet";
            headEle.appendChild(link);
        }
    }

    /**
     * ����µ�ģ�飬ģ���Ϊ�첽ͬ��2�У�����jquery����û��ʹ�ñհ��ģ�����ʹ��ͬ��������ȷ�����ģ��֮��ļ���˳��
     * ÿ��ģ����ܰ���js�ļ���css�ļ�(ģ��Ҳ����������ģ�飬����������ģ��ᱻ���ȼ���)
     * @param name ģ����
     * @param func ģ�鹦�ܿ�
     * @param required ������ģ��
     */
    this.addModule = function (name, func, required) {
        if (intellijLoad.modules[name] === undefined) {
            intellijLoad.modules[name] = {};
        }
        var module = intellijLoad.modules[name];
        module.func = func;
        if (required) {
            if (typeIS(required, typeIS.String)) {
                module.required = [].push(required);
            } else {
                module.required = required;
            }
            var page = new PageDomain(module.required, function () {
            });
            resolveDependency(module.required, page);
            loadAsyncModule(page);
        }
    };

    this.register = function (options) {
        /**
         * ���ǵ�һ�ε��õ�ʱ�򴥷��ĳ�ʼ��
         */
        if (intellijLoad.modules === undefined) {
            intellijLoad.modules = options.modules;
            if (options.baseJsUrl) {
                intellijLoad.baseJsUrl = intellijLoad.basePath + options.baseJsUrl + "/";
            }
            if (options.baseCssUrl) {
                intellijLoad.baseCssUrl = intellijLoad.basePath + options.baseCssUrl + "/";
            }
            for (var name in intellijLoad.modules) {
                var module = intellijLoad.modules[name];
                initModuleProperty(name, module);
            }
        } else {
            /**
             * �������κ�YUI({modules:{newModule��{}}})������µ�ģ��
             */
            for (var moduleName in options.modules) {
                intellijLoad.modules[moduleName] = options.modules[moduleName]
                initModuleProperty(moduleName, intellijLoad.modules[moduleName]);
            }
        }
    };
    function initModuleProperty(name, module) {
        module.name = name;
        /**
         * module ��ʼ�������û��ʹ��$.extend������Ϊ��������û������jquery.
         */
        module["bindPages"] = [];
        if (module.async === undefined) {
            module.async = true;
        }
        /**
         * ��module.required ���Գ�ʼ��,����string,�ᱻת��string ����
         */
        if (!module.required) {
            module.required = [];
        } else if (typeIS(module.required, typeIS.String)) {
            module.required = [module.required];
        }
        /**
         * js ����� / ��ͷ����Ϊ�Ǿ���·��
         */
        if (module.js) {
            if (!(module.js.substring(0, 1) === "/")) {
                module.js = intellijLoad.baseJsUrl + module.js;
            }
        }
        /**
         * css·������� / ��ͷ����Ϊ�Ǿ���·��
         */
        if (module.css) {
            if (!(module.css.substring(0, 1) === "/")) {
                module.css = intellijLoad.baseCssUrl + module.css;
            }
        }
    }

    /**
     * �����ÿ��ʹ��use���������һ��PageDomain
     * @param moduleNames
     * @param func
     * @constructor
     */
    function PageDomain(moduleNames, func) {
        var page = this;
        this._needLoad = 0;
        this.moduleNames = moduleNames;
        this.addOneNeedModule = function () {
            page._needLoad++;
        };
        this.syncLoadingComplete = function (moduleName) {
            page.completeOneModule(moduleName);
        };
        this.syncAjaxDownloadComplete = function (moduleName) {
            console.log(moduleName + "�������...");
            var headEle = document.getElementsByTagName("head")[0];
            var module = intellijLoad.modules[moduleName];
            if (module.script !== undefined) {
                var dependency = page.syncDependTree[moduleName];
                var dependOn = dependency.dependOn;
                var flag = true;
                for (var index in dependOn) {
                    if (!(intellijLoad.modules[dependOn[index].name]._completeLoading)) {
                        flag = false;
                        break;
                    }
                }
                /**
                 * ���������ģ�鶼�Ѿ����أ���ִ�У�������ӵ�dependency���ȵ�����ģ��ȫ��������ϴ���.
                 */
                if (flag) {
                    headEle.appendChild(module.script);
                    console.log(moduleName + "�Ѿ�ִ��...");
                    delete module.script;
                    delete dependency["script"];
                    module._completeLoading = true;
                    page.syncAjaxLoadingComplete(moduleName);
                } else {
                    dependency["script"] = module.script;
                }
            }
        };
        this.syncAjaxLoadingComplete = function (moduleName) {
            page.completeOneModule(moduleName);
            var dependency = page.syncDependTree[moduleName];
            var beDependOn = dependency.beDependOn;
            /**
             * ֪ͨ���������Լ���ģ��
             */
            for (var index in beDependOn) {
                /**
                 * �鿴�����Լ���ģ���Ƿ��Ѿ�����ִ��
                 */
                if (intellijLoad.modules[beDependOn[index].name]._completeDownload) {
                    var flag = true;
                    var depends = beDependOn[index].dependOn;
                    for (var num in depends) {
                        if (!(intellijLoad.modules[depends[num].name]._completeLoading)) {
                            flag = false;
                            break;
                        }
                    }
                    if (flag) {
                        var module = intellijLoad.modules[beDependOn[index].name];
                        document.getElementsByTagName("head")[0].appendChild(module.script);
                        delete module.script;//script�ܴ󣬴��ڴ����Ƴ�.
                        delete dependency.script;
                        console.log(module.name + "�Ѿ�ִ��");
                        module._completeLoading = true;
                        page.syncAjaxLoadingComplete(module.name);
                    }
                }
            }
        };
        this.asyncLoadingComplete = function (moduleName) {
            page.completeOneModule(moduleName)
        };
        this.completeOneModule = function (moduleName) {
            console.log(--page._needLoad);
            if (page._needLoad <= 0) {
                for (var index in page.moduleNames) {
                    var name = page.moduleNames[index];
                    loadJsFunction(name);
                }
                if (document.readyState === "complete" || document.readyState === "interactive") {
                    func(page);
                } else {
                    if (document.addEventListener) {
                        document.addEventListener("DOMContentLoaded", function () {
                            func(page)
                        }, false);
                    } else {
                        document.attachEvent("onreadystatechange", function () {
                            func(page)
                        });
                    }
                }
            }
        };
        /**
         * �����е�module��ȷ����������Ժ󣬽���Ҫ���ص�module��˳�����.
         */
        function loadJsFunction(moduleName) {
            var module = intellijLoad.modules[moduleName];
            var requiredModules = module.required;
            if (typeIS(requiredModules, typeIS.Array) && requiredModules.length > 0) {
                for (var index in requiredModules) {
                    loadJsFunction(requiredModules[index])
                }
            } else if (typeIS(requiredModules, typeIS.String)) {
                loadJsFunction(requiredModules);
            }
            if (typeIS(module.func, typeIS.Function)) {
                module.func(page);
            }
        }
    }

    PageDomain.prototype = this;
}
function EventFunction() {
    var eventFc = this;
    this._listener = {};
    this.addEventListener = function (type, fn) {
        if (eventFc._listener[type] === undefined) {
            eventFc._listener[type] = [];
        }
        eventFc._listener[type].push(fn);
    };
    this.fireEvent = function (type, param) {
        var fns = eventFc._listener[type];
        for (var index in fns) {
            var fn = fns[index];
            var obj = {type: type};
            for (var name in param) {
                obj[name] = param[name];
            }
            fn(obj);
        }
    };
}

function YUI(options) {
    if (!window.intellijLoad) {
        window.intellijLoad = new IntellijLoad();
    }
    if (options) {
        window.intellijLoad.register(options)
    }
    return window.intellijLoad;
}
YUI({
    baseJsUrl: "/assets",
    baseCssUrl: "/assets",
    modules: {
        "jquery": {
            js: "js/jquery/jquery-1.11.1.js",
            async: false
        },
        "ui-lightness": {
            css: "jquery-ui/css/ui-lightness/jquery-ui.css"
        },
        "ui-darkness": {
            css: "jquery-ui/css/ui-darkness/jquery-ui.css"
        },
        "bootstrap3": {
            js: "bootstrap/bootstrap3/js/bootstrap.min.js",
            async:false,
            required:["jquery"]
        },
        "bootstrap-dialog": {
            js: "bootstrap/bootstrap3/js/bootstrap-dialog.min.js",
            css: "bootstrap/bootstrap3/css/bootstrap-dialog.min.css",
            async:false,
            required:["jquery"]
        },

        "jquery-ui-core": {
            js: "jquery-ui/js/core/jquery-ui-core.1.11.1.js",
            async: false,
            required: ["jquery","ui-lightness"]
        },
        "draggable": {
            js: "jquery-ui/js/interactions/jquery-ui-draggable.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "droppable": {
            js: "jquery-ui/js/interactions/jquery-ui-droppable.1.11.1.js",
            async: false,
            required: ["draggable"]
        },
        "resizable": {
            js: "jquery-ui/js/interactions/jquery-ui-resizable.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "selectable": {
            js: "jquery-ui/js/interactions/jquery-ui-selectable.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "sortable": {
            js: "jquery-ui/js/interactions/jquery-ui-sortable.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "tabs": {
            js: "jquery-ui/js/widgets/jquery-ui-tabs.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "accordion": {
            js: "jquery-ui/js/widgets/jquery-ui-accordion.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "menu": {
            js: "jquery-ui/js/widgets/jquery-ui-menu.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "autocomplete": {
            js: "jquery-ui/js/widgets/jquery-ui-autocomplete.1.11.1.js",
            async: false,
            required: ["menu"]
        },
        "button": {
            js: "jquery-ui/js/widgets/jquery-ui-button.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "datepicker": {
            js: "jquery-ui/js/widgets/jquery-ui-datepicker.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "red-blitzer-timePicker":{
            css:"jquery-ui/css/timepicker/jquery-ui-1.11.2.custom.red-blitzer.css"
        },
        "timepicker-addon":{
            css:"jquery-ui/css/timepicker/jquery-ui-timepicker-addon.css"
        },
        "timePicker":{
            js: "jquery-ui/js/timepicker/jquery-ui-timepicker-addon.js",
            css: "jquery-ui/css/timepicker/jquery-ui-timepicker-addon.css",
            async:false,
            required:["datepicker","red-blitzer-timePicker","timepicker-addon"]
        },
        "dialog": {
            js: "jquery-ui/js/widgets/jquery-ui-dialog.1.11.1.js",
            async: false,
            required: ["jquery-ui-core", "draggable", "resizable", "button"]
        },
        "progressbar": {
            js: "jquery-ui/js/widgets/jquery-ui.progressbar.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "selectmenu": {
            js: "jquery-ui/js/widgets/jquery-ui-selectmenu.1.11.1.js",
            async: false,
            required: ["menu"]
        },
        "slider": {
            js: "jquery-ui/js/widgets/jquery-ui-slider.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "spinner": {
            js: "jquery-ui/js/widgets/jquery-ui-spinner.1.11.1.js",
            async: false,
            required: ["button"]
        },
        "tooltip": {
            js: "jquery-ui/js/widgets/jquery-ui-tooltip.1.11.1.js",
            async: false,
            required: ["jquery-ui-core"]
        },
        "effect": {
            js: "jquery-ui/js/effects/jquery-ui-effect.1.11.1.js",
            async: false,
            required:["jquery"]
        },
        "component-widget": {
            js: "js/component/component-widget.js",
            async: true,
            required: ["jquery"]
        },
        "leftMenu": {
            js: "js/component/leftMenu/js/left-menu.js",
            async: true,
            required: ["component-widget","utils","bootstrap3"]
        },
        "echarts":{
            js:"js/echarts/echarts-all.js",
            async:true,
            required:["jquery"]
        },
        "utils": {
            js: "js/common-utils-1.0.0.js",
            async: false,
            required:["jquery"]
        },
        "datetimepicker":{
            css:"js/component/datetimepicker/css/bootstrap-datetimepicker.min.css",
            js:"js/component/datetimepicker/js/bootstrap-datetimepicker.min.js",
            required:["bootstrap3"],
            async:false
        },
        "json2":{
            js:"js/jquery/json2.js",
            required:["jquery"],
            async:false
        },
        "logRule":{
            js:"js/warden/logRule/logRule.js",
            async:false
        }
    }
});


