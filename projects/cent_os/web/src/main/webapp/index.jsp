<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title></title>
    <script type="text/javascript" src="js/jquery/jquery-1.11.1.js"></script>
    <script type="text/javascript" src="js/underscore/underscore.js"></script>
    <script type="text/javascript" src="js/backbone/backbone.js"></script>
</head>
<body>
    <div id="divTip">click me</div>
    <script type="text/javascript">
        var divView = {
            ele:"#divTip",
            tip:"hello,underscore",
            onClick:function(){
                $(this.ele).html(this.tip);
            }
        };
        _.bindAll(divView, "onClick");
        $(divView.ele).bind("click",divView.onClick);
    </script>
</body>
</html>
