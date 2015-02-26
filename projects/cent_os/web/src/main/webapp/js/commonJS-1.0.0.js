/**
 * 因为浏览器版本和实现的混乱，此函数是唯一可以判断变量类型的函数  "Array", "Object", "Number", "String" , "Boolean", "Function"
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
     * 所有的组件都是在次对象下管理.
     * @type {{}}
     */
    this.component = {};


    /**
     * 客户调用的核心API，所有页面的逻辑代码被封存在fnc中.
     * @param modules 需要的模块列表,单个字符串或者字符串数组.
     * @param func 需要处理的逻辑代码.
     */
    this.use = function (modules, func) {
        var needModules = [];
        /** 只需要一个模块时，可以传入字符串，否则传字符串数组 **/
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
         * 解析Page的依赖树,会将依赖树 分开为异步的依赖树和同步的依赖树
         */
        resolveDependency(needModules, page);
        console.log(needModules + "已经解析完依赖，同步依赖数组:" + page.syncSortArray);
        /**
         * 先加载异步的模块，异步模块的执行在最后，他的依赖不用解析
         */
        loadAsyncModule(page);
        /**
         * 同步加载模块，有使用document.createElement("script")和ajax 2中方法.
         */
        loadSyncModule(page);
    };
    /**
     * 循环解析模块依赖，模块会被分成异步和同步 2个依赖树保存在page对象上.
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
     * 使用迭代，解析出所有的依赖，并给使用的module添加事件接口
     * @param moduleName
     * @param page
     */
    function doResolveDependency(moduleName, page) {
        var module = intellijLoad.modules[moduleName];
        /**
         * 给使用的module添加事件接口，不用prototype实现是因为每个module的事件要各自不同
         * Module有3种事件:startLoading,completeLoading,completeExec
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
                 * 去掉同步模块依赖css模块的可能
                 */
                if (!((module.async == false) && (requiredModule.async == true))) {
                    dependency.dependOn.push(requiredDepend);
                    requiredDepend.beDependOn.push(dependency);
                }
            }
            /**
             * 每个依赖模块创建以后，会遍历他所有的依赖,然后放在所有依赖的最后
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
     * 完成对异步模块的加载
     * @param page
     */
    function loadAsyncModule(page) {
        /**
         * 合并http请求，需要后台支持。
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
     * 完成对同步模块的下载
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
     * 同步文件的ajax下载模块
     * @param syncSortArray
     * @param page
     */
    function doAjaxSyncModule(syncSortArray, page) {
        /**
         * ajax模式下载同步js，先开始以最大ajax数，并发下载
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
     * 模块加载调用的子模块，用来异步加载JS文件,这里也会将需要同步加载的js文件区分开来.
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
     * 加载模块调用的子模块，用来同步加载Js文件，时机在于，所有依赖模块都解析了，异步模块会直接开始加载，同步模块
     * 由于要控制顺序，所以需要知道所有的同步模块以后，才能开始进行同步模块加载
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
     * ajax 加载js文件，不同于{@link function loadSyncJS()},前者可以同时下载那些同步加载文件，后者只能串行下载
     * 由于每一个浏览器对于最大并发数都有限制，这里取各浏览器中间值 4 最大并发
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
     * 模块加载使用的子模块，用来加载CSS文件
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
     * 添加新的模块，模块分为异步同步2中，对于jquery这种没有使用闭包的，必须使用同步，用来确保多个模块之间的加载顺序
     * 每个模块可能包括js文件和css文件(模块也会有依赖的模块，所以依赖的模块会被优先加载)
     * @param name 模块名
     * @param func 模块功能块
     * @param required 依赖的模块
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
         * 这是第一次调用的时候触发的初始化
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
             * 可以在任何YUI({modules:{newModule：{}}})中添加新的模块
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
         * module 初始化在这里，没有使用$.extend，是因为基础构件没有依赖jquery.
         */
        module["bindPages"] = [];
        if (module.async === undefined) {
            module.async = true;
        }
        /**
         * 将module.required 属性初始化,传入string,会被转成string 数组
         */
        if (!module.required) {
            module.required = [];
        } else if (typeIS(module.required, typeIS.String)) {
            module.required = [module.required];
        }
        /**
         * js 如果以 / 开头则认为是绝对路径
         */
        if (module.js) {
            if (!(module.js.substring(0, 1) === "/")) {
                module.js = intellijLoad.baseJsUrl + module.js;
            }
        }
        /**
         * css路径如果以 / 开头则认为是绝对路径
         */
        if (module.css) {
            if (!(module.css.substring(0, 1) === "/")) {
                module.css = intellijLoad.baseCssUrl + module.css;
            }
        }
    }

    /**
     * 域对象，每次使用use，都会产生一个PageDomain
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
            console.log(moduleName + "下载完成...");
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
                 * 如果依赖的模块都已经加载，则执行，否则添加到dependency，等到依赖模块全部加载完毕触发.
                 */
                if (flag) {
                    headEle.appendChild(module.script);
                    console.log(moduleName + "已经执行...");
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
             * 通知所有依赖自己的模块
             */
            for (var index in beDependOn) {
                /**
                 * 查看依赖自己的模块是否已经可以执行
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
                        delete module.script;//script很大，从内存中移除.
                        delete dependency.script;
                        console.log(module.name + "已经执行");
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
         * 当所有的module都确定加载完毕以后，将需要加载的module按顺序读入.
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


