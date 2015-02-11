/*���������û��console���󣬻��߲��������֧��console,�������û�а�F12�򿪿���̨
 ��console����Ҳ�����ڣ���ʱ����������console����Ĵ���ͻ��׳�NullPoint�쳣*/
 /**
 ��תJSON��֧�ֶ����ͬname�� input
 **/
(function($){
    $.fn.serializeJson=function(){
        var serializeObj={};
        var array=this.serializeArray();
        $(array).each(function(){
            if(serializeObj[this.name]){
                if($.isArray(serializeObj[this.name])){
                    serializeObj[this.name].push(this.value);
                }else{
                    serializeObj[this.name]=[serializeObj[this.name],this.value];
                }
            }else{
                serializeObj[this.name]=this.value;
            }
        });
        return serializeObj;
    };
})(jQuery);
 
function ConsoleFnc() {
    if (console) {
        ConsoleFnc.prototype = console.constructor.prototype;
    } else {
        //�������û��console����ʱ�������ṩ��ʵ�֣���ֹNullPoint.
        this.log = function () {
        }
        this.debug = function () {
        }
        this.warn = function () {
        }
        this.error = function () {
        }
        this.info = function () {
        }
    }
    window.Console = this;
}
ConsoleFnc();
/**
 * JS��HashMapֻ֧��keyΪstring,����Ƕ���Ĳ��䣬������ObjectΪkey
 * @constructor
 */
function HashMap() {
    this.array = [];
    this.push = function (key, value) {
        for (var index in this.array) {
            if (this.array.hasOwnProperty(index)) {
                if (key === this.array[index].key) {
                    this.array[index].value = value;
                    return;
                }
            }
        }
        this.array.push({
            key: key,
            value: value
        });
    };
    this.get = function (key) {
        for (var index in this.array) {
            if (this.array.hasOwnProperty(index)) {
                if (key === this.array[index].key) {
                    return this.array[index].value;
                }
            }
        }
        return null;
    }
}
/**
 * js û��set��������չ��array���ڲ�Ԫ�ز����ظ�.ע����ʱ����Ԫ���Ƿ���ȵ��ж������� === (��ͬ��==��ǰ�߲����������ת��)��
 * @constructor
 */
function Set() {
    var array = Array.apply(null, arguments);
    for (var i = 0, l = array.length; i < l; i++) {
        this[i] = array[i];
    }
    this.length = array.length;
}
Set.prototype = new Array();
Set.prototype.push = function (obj) {
    var flag = false;
    for (var name in this) {
        if (this.hasOwnProperty(name)) {
            if (this[name] === obj) {
                flag = true;
                break;
            }
        }
    }
    if (!flag)
        Array.prototype.push.apply(this, [obj]);
};
/**
 * This module need Jquery module.
 */
function BROWSERTYPE() {
    var IE = "msie";
    var FIREFOX = "mozilla";
    var CHROME = "chrome";
    var SAFARI = "safari";
    BROWSERTYPE.isIE = function () {
        return $.browser[IE] || false;
    };
    BROWSERTYPE.isChrome = function () {
        return $.browser[CHROME] || false;
    };
    BROWSERTYPE.isSafari = function () {
        return $.browser[SAFARI] || false;
    };
    BROWSERTYPE.isFireFox = function () {
        return $.browser[FIREFOX] || false;
    };
}


/**
 * js ����ԭ�οؼ�
 * @param fmt
 * @returns {*}
 * @constructor
 */
Date.prototype.format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //�·�
        "d+": this.getDate(), //��
        "H+": this.getHours(), //Сʱ
        "m+": this.getMinutes(), //��
        "s+": this.getSeconds(), //��
        "q+": Math.floor((this.getMonth() + 3) / 3), //����
        "S": this.getMilliseconds() //����
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};
Date.parseFormat = function (dateStr, format) {
    var year = Number(dateStr.substr(format.indexOf("yyyy"),4));
    var moth = Number(dateStr.substr(format.indexOf("MM"),2));
    var date = Number(dateStr.substr(format.indexOf("dd"),2));
    var hour = Number(dateStr.substr(format.indexOf("HH"),2));
    var second = Number(dateStr.substr(format.indexOf("mm"),2));
    var mis = Number(dateStr.substr(format.indexOf("ss"),2));
    return new Date(year,moth-1,date,hour,second,mis);
};

function toFixed(arg1, arg2){
    if(arg2 == 0){
        return 0.00
    }
    return (arg1/arg2).toFixed(4);
}

function slideFrom(node,direction){
    var $node = $(node);
    var $parent = $(node).parent();
    var reDirection = direction == "left"?"right":"left";
    var speed = 500;
    var callback = undefined;
    var option = {};
    var minSlide = 100;

    var parentWidth = $parent.offset().left + $parent.width();
    var nodeWidth = $node.offset().left + $node.width();
    if(parentWidth-nodeWidth >= 100){
        option.top=$node.css("top");
        option.bottom=$node.css("bottom");
        option.left=$node.css("left");
        option.right=$node.css("right");

        for(var name in option){
            if(option[name] == "auto" || !option[name]){
                option[name] = 0;
            }
        }

        $node.show().position({my:direction,at:direction,of:$parent,collision:"none"});

        if(typeIS(arguments[2],typeIS.Number)){
            speed = arguments[2];
        }else if(typeIS(arguments[2],typeIS.Function)){
            callback = arguments[2];
        }
        if(typeIS(arguments[3],typeIS.Function)){
            callback = arguments[3];
        }
        $node.animate(option,speed,callback);
    }else{
        $node.show();
    }
}

function kepInView(ele){
    var originH = $(ele).offset()["top"];
    $(window).scroll(function(){
        var scroll = $(this).scrollTop();
        var offset = $(ele).offset()["top"];
        if(scroll > offset){
            $(ele).offset({top:scroll});
        }else if(scroll < offset && scroll > originH){
            $(ele).offset({top:scroll});
        }else if(scroll <= originH){
            $(ele).offset({top:originH});
        }
    });
}

/* ===================================================================================
*   ����Ĵ��������ж������֧����һ�ֶ���.
*/
var div = document.createElement("div");
var supports = {"webkitTransform":"-webkit-transform","mozTransform":"-moz-transform",
                            "oTransform":"-o-transform","transform":"transform"};
$.support["transform"] = null;
for(var name in supports){
    if(div.style[name] != undefined){
        $.support["transform"] = supports[name];
        break;
    }
}
delete window.div;delete window.supports;

/**
 * ���css3 transform ����תԪ�أ����ڷ���ֵ�͵Ķ�����jquery ��֧��.
 * scaleX ��1��-1������˷�ת
 * @param node
 * @param func
 */
function turnOver(node,func){
    var transformer = $.support["transform"];
    if(transformer){
        var mills = 1000;
        $(node).addClass("transition3");
        $(node).css(transformer, "scaleX(-1)");
        setTimeout(function(){
            $(node).removeClass("transition3");
            $(node).css(transformer, "none");
            _func();
        },mills);
    }else{
        $(node).effect("slide", {direction: "left"},_func);
    }
    function _func(){
        if(func){
            func(node);
        }
    }
}
function ajaxNotify(){
    $(document).ajaxSend(function(evt, ajax, options){
        if(options.title){
            notify(options.title);
        }
        this.stopNotify = options["stopNotify"] == undefined?true:options["stopNotify"];
        //ajax ���� isAjax=true ��־ ��̨ ʹ��utf-8 decode.
        var contentType = options.contentType;
        if(contentType.indexOf("x-www-form-urlencoded") >= 0){
            options.data = options.data + "&isAjax=true";
        }
    }).ajaxStop(function(){
        if(this.stopNotify){
           hideNotify();
        }
    });
}
ajaxNotify();
function notify(str){
    var flagShow = $("#notifyModal").is(":visible");
    if("show" == str){
        $("#notifyModal .modal-body").remove();
    }else{
        if($("#notifyModal .modal-body").size() <= 0){
            $("<div></div>").addClass("modal-body").appendTo($("#notifyModal .modal-content"));
        }
        $("#notifyModal .modal-body").text(str);
    }
    if(!flagShow){
        $("#notifyModal").modal({
            show:true,
            keyboard:false,
            backdrop:false
        });
    }
}
function hideNotify(){
    var flagShow = $("#notifyModal").is(":visible");
    if(flagShow){
        $("#notifyModal .modal-body").empty();
        $("#notifyModal").modal("hide");
    }
}
function RMB(number){
    var s = "";
    if(typeIS(number, typeIS.Number)){
        s+=number;
    }else{
        s = number;
    }
    if(/[^0-9\.]/.test(s)) return "invalid value";
    s=s.replace(/^(\d*)$/,"$1.");
    s=(s+"00").replace(/(\d*\.\d\d)\d*/,"$1");
    s=s.replace(".",",");
    var re=/(\d)(\d{3},)/;
    while(re.test(s))
        s=s.replace(re,"$1,$2");
    s=s.replace(/,(\d\d)$/,".$1");
    var result = s.replace(/^\./,"0.");
    return result.substring(0, result.length-3);
}
/** ������� **/
function Comet(){
    this.polling = polling;
    this.stop = function(){
        if(timeOutNumber){
            clearTimeout(timeOutNumber);
        }
    };
    var timeOutNumber;
    function polling(url,timeOut,func){
        timeOutNumber = setTimeout(function(){
            $.ajax(url).success(function(data){
                var deferred = $.Deferred();
                func(data,deferred);
                deferred.done(function(){
                    polling(url, timeOut, func);
                });
            });
        },timeOut);
    }
}