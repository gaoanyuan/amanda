/**
 * Created by anygao on 14-8-26.
 */
YUI().addModule("component-widget",function(Y){
    //Y 是page对象，this 为module对象
    var name = this.name;
    Y.component.Widget = function(srcNode){
        //这里的this为new出来的，所以为widget本身。
        var widget = this;
        if(srcNode){
            /**
             * 所有窗口组件，模块统一为:
             * 外层boundingBox,用来控制位置定位 $moduleName-boundingBox
             * 内层contentBox,用来控制内容显示，如disable,border...... $moduleName-contentBox
             */
            widget.srcNode = srcNode;
            widget.boundingBoxName = name + "-" + "boundingBox";
            widget.contentBoxName = name + "-" + "contentBox";
            widget.boundingBox = $(widget).find("." + this.boundingBoxName);
            widget.contentBox = $(widget).find("." + this.contentBoxName);
        }
        if(!widget.boundingBox || widget.boundingBox.size <= 0){
            widget.boundingBox = $("<div class='" + widget.boundingBoxName + "'></div>");
        }
        if(!widget.contentBox || widget.contentBox.size <= 0){
            widget.contentBox = $("<div class='" + widget.contentBoxName + "'></div>").appendTo(widget.boundingBox);
        }
        /**
         * 外部请调用render方法统一实例化
         * renderUI 为渲染
         * bindUI 为绑定事件
         * syncUI 为同步数据
         */
        widget.renderUI = function(){}
        widget.bindUI = function(){}
        widget.syncUI = function(){}
        widget.render = function(){
            widget.renderUI();
            widget.bindUI();
            widget.syncUI();
        }
    }
    /**
     * Wiget是窗口組件的父类，后面的组件，如果需要可视化，可以调用此方法继承Widget.
     * @param widget
     * @param args
     */
    Y.component.Widget.extend = function (widget, args) {
        Y.component.Widget.apply(widget, args);
    }
});