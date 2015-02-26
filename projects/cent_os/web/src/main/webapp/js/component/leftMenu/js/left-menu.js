// JavaScript Document
YUI().addModule("leftMenu",function(Y){
    Y.component.LeftMenu = function (srcNode, selected) {
        Y.component.Widget.extend(this, arguments);
        this.bindUI = function(){

        };
        this.renderUI = function () {
            var $leftMenuNode = $(srcNode);
            var leftContainer = $leftMenuNode.parent();
            var rightContainer = $leftMenuNode.parent().next();

            var marginLeft = $leftMenuNode.find(".panel").offset().left;
            //ʱ�䲻�������� ·������ û�ж����һ��ģ��ȥ��д��
            var $crumbNode = $("#navigator-items");
            var $crumb_ol = $crumbNode.find("ol");
            var $wardenIndex = $("<li><a data-url='/grail/tabs'>Warden</a></li>");


            //����û�зŵ�utils.js��������ȫ��ajax����һ����Ҫ����crumbû�е�����Ϊһ��ģ�飬��Ҫ�����Ż�.
            $(document).ajaxSend(function(evt, ajax, options){
                var crumb = options["crumb"];
                if(crumb){
                    if(typeIS(crumb, typeIS.String)){
                        $crumb_ol.find("li:last").removeClass("active");
                        var $a = $("<a>" + options["crumb"] + "</a>").data("url", options.url);
                        $("<li class='active' />").append($a).appendTo($crumb_ol);
                    }else if(typeIS(crumb, typeIS.Number)){
                        if(crumb < 0){
                            crumb = Math.abs(crumb);
                            for(var i=0; i< crumb; i++){
                                $crumb_ol.find("li:last").remove();
                            }
                            $crumb_ol.find("li:last").addClass("active");
                        }
                    }

                }
            });
            $("#navigator-items").on("click", "a" ,function (event) {
                event.preventDefault();
                if($(this).parent().hasClass("active")){
                    return;
                }
                var $li = $(this).parent();
                var url = "/grail/tabs";
                if($li.index() == 0){
                    $("#navigator-items").find("ol").empty().end().hide();
                }else{
                    $li.nextAll().remove();
                    url = $(this).data("url");
                }

                $.ajax(Y.basePath + url,{
                    title:"show"
                }).done(function (html) {
                    $("#container").empty().html(html);
                })
            });

            function h4Click(h4){
                var url = $(h4).data("url");
                if(!url){
                    return;
                }
                //��������� �Ƿ���ʾ ·����������Ϊ��Ӱ�������ʾ������ ���˴��� ��Ĭ����ʾ,�����߼� �����left-menu�Ľṹ
                if($(h4).parents(".panel-body").size() > 0){
                    $("#navigator-items").show();
                    $crumb_ol.empty();
                    $crumb_ol.append($wardenIndex);
                    var $liNodes = $(h4).parent().parents("li");
                    $liNodes.each(function(){
                        var $a = $("<a>" + $(this).children("h4").text() + "<a/>").data("url", $(this).children("h4").data("url"));
                        $("<li></li>").append($a).appendTo($crumb_ol);
                    });
                    $("<li class='active'/>").append("<a data-url='" + $(h4).data("url") + "'>" + $(h4).text() + "</a>").appendTo($crumb_ol);
                }else{
                    $("#navigator-items").find("ol").empty().end().hide();
                }


                if($(h4).hasClass("active")){
                    return;
                }else{
                    $leftMenuNode.find(".active").removeClass("active");
                    $(h4).addClass("active");
                }

                if (url) {
                    $.ajax(Y.basePath + url,{
                        title:"show"
                    }).done(function (html) {
                        $("#container").empty().html(html);
                    });
                }
            }

            $leftMenuNode.on("click", "h4", function () {
                var freshFlag = $(this).data("fresh");
                if(freshFlag){
                    //%23 ����#��url ����#�����⺬�壬����ת����htmlʵ��
                    window.location.href = window.location.origin+window.location.pathname+"?firstMenu=%23"+$(this).attr("id");
                    return;
                }
                h4Click(this);
            });

            $leftMenuNode.on("click", "ul:first>li>h4", function () {
                var ul = $(this).siblings("ul");
                if (ul.size() > 0) {
                    var flag = $(this).hasClass("add-btn");
                    if (flag) {
                        $(this).removeClass("add-btn").addClass("minus-btn");
                        ul.stop(true).slideDown(300);
                    } else if ($(this).hasClass("minus-btn")) {
                        $(this).removeClass("minus-btn").addClass("add-btn");
                        ul.stop(true).slideUp(300);
                    }
                }
            });
            if(selected){
                var firstSel = $(selected, $leftMenuNode);
                h4Click(firstSel);
            }
            kepInView($leftMenuNode);
            //todo ������ʵ��Ҫ�Լ���resize���������LeftMenu���ݣ���Ϊ�����˵���չʾ���䶯ʱ��handle�ĳ���Ҳ��Ҫ���ű䡣
            //todo jquery��resize�¼� ֻ֧��window��div����Ҫ�Լ�дtimeoutȥ֧��

            $("#handle",$leftMenuNode).height($leftMenuNode.find(".panel").innerHeight());

            var span = $("#handle").find("span");
            $("#handle").hover(function(){
                if(span.hasClass("glyphicon-chevron-right")){
                    showLeftMenu();
                }else if(span.hasClass("glyphicon-chevron-left")){
                    $(this).css("opacity",0.3);
                }
            },function(){
                if(span.hasClass("glyphicon-chevron-left")){
                    $(this).css("opacity",0);
                }
            });

            var timeout = null;
            $leftMenuNode.find(".panel").hover(function(){
                if(null != timeout){
                    clearTimeout(timeout);
                    timeout = null;
                    showLeftMenu();
                }
            }, function () {
                timeout = setTimeout(hideLeftMenu,5000);
            });
            timeout = setTimeout(hideLeftMenu, 5000);
            $leftMenuNode.on("click", "#handle", function () {
                if($(this).find("span.glyphicon-chevron-left").size() > 0){
                    hideLeftMenu();
                }
            });

            $(window).resize(function(){
                if(!$("#handle").hasClass("left-show")){
                    var width = $leftMenuNode.find(".panel").width() + marginLeft;
                    leftContainer.css("left", -width);
                }
            });

            function showLeftMenu(){
                if(!$("#handle").hasClass("left-show")){
                    leftContainer.stop(true).animate({left:0},300,function(){
                        $("#handle").addClass("left-show").css("opacity", 0);
                        $("#arrow-span").attr("class","glyphicon glyphicon-chevron-left");
                        leftContainer.css("position","relative");
                        rightContainer.removeClass("col-md-12").addClass("col-md-10");
                        rightContainer.removeClass("center-show");
                    });
                }
            }
            function hideLeftMenu(){
                if($("#handle").hasClass("left-show")){
                    //width �����ڲ㣬��ֹ�������С�ı�.
                    var width = $leftMenuNode.find(".panel").width() + marginLeft;
                    leftContainer.stop(true).animate({left:-width},300,function(){
                        $("#handle").removeClass("left-show").css("opacity", 0.3);
                        $("#arrow-span").attr("class","glyphicon glyphicon-chevron-right");
                        leftContainer.css("position","absolute");
                        rightContainer.removeClass("col-md-10").addClass("col-md-12");
                        rightContainer.addClass("center-show");
                    });
                }
            }
        }

    }
});