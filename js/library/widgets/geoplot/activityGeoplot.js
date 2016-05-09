/*global define,dojo,dojoConfig:true,alert,console,esri,Modernizr,dijit,appGlobals */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
 | Copyright 2015 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/query",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/text!./templates/geoplotTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "dijit/a11yclick",

    "esri/map",
    "esri/toolbars/edit",
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/geometry/webMercatorUtils",

    "esri/geometry/Point",
    "esri/geometry/Polyline",
    "esri/geometry/Polygon",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",

    "dojo/_base/event",
    "dojo/parser",
    "dojo/dom",
    "dojo/_base/connect",
    "dijit/registry",
    "dijit/Menu",

    "dijit/form/ToggleButton",
    "dijit/form/DropDownButton",
    "dijit/form/Button",
    "dijit/WidgetSet",
    "dijit/CheckedMenuItem",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane"


], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, domClass, query, Query, QueryTask, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, a11yclick, Map, Edit, Draw,Graphic,webMercatorUtils,
             Point, Polyline, Polygon,SimpleMarkerSymbol,
             SimpleLineSymbol, SimpleFillSymbol, TextSymbol,
             event, parser, dom, connect,registry, Menu) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,                 // Variable for template string
        sharedNls: sharedNls,                     // Variable for shared NLS
        toolbar:null,
        editToolbar:null,
        isEdit:false,                              //判断是否处在编辑状态
        /**
        * file for creating activity search panel and getting start point from geolocation and calculating route for activity search.
        */




        /**
        * Show Activity result tap
        * @memberOf widgets/searchSetting/activitySearch
        */
        _showActivityTab: function () {
            domStyle.set(this.divActivityContainer, "display", "block");
            domStyle.set(this.divSearchContent, "display", "none");
            domStyle.set(this.divEventContainer, "display", "none");
            domClass.replace(this.divActivityPanel, "esriCTActivityPanelSelected", "esriCTActivityPanel");
            domClass.replace(this.divActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.divSearchPanel, "esriCTSearchPanelSelected", "esriCTDivSearchPanel");
            domClass.replace(this.divEventsPanel, "esriCTEventsPanel", "esriCTDivEventsPanelSelected");
        },

        /**
        * Show/hide locator widget and set default search text
        * @memberOf widgets/searchSetting/activitySearch
        */
        _showLocateContainer: function () {
            if (domGeom.getMarginBox(this.divSearchContainer).h > 1) {
                /**
                * when user clicks on locator icon in header panel, close the search panel if it is open
                */
                domClass.replace(this.domNode, "esriCTHeaderGeoplot", "esriCTHeaderGeoplotSelected");
                domClass.replace(this.divSearchContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            } else {
                /**
                * when user clicks on locator icon in header panel, open the search panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTHeaderGeoplotSelected", "esriCTHeaderGeoplot");
                domClass.replace(this.divSearchContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            }
        },

        /**
        * Display search by address tab
        * @memberOf widgets/searchSetting/activitySearch
        */
        _showAddressSearchView: function () {
            if (domStyle.get(this.imgSearchLoader, "display") === "block") {
                return;
            }
        },

        /**
        * Show search result tap
        * @memberOf widgets/searchSetting/activitySearch
        */
        _showSearchTab: function () {
            domStyle.set(this.divActivityContainer, "display", "none");
            domStyle.set(this.divEventContainer, "display", "none");
            domStyle.set(this.divSearchContent, "display", "block");
            domClass.replace(this.divActivityPanel, "esriCTActivityPanel", "esriCTActivityPanelSelected");
            domClass.replace(this.divEventsPanel, "esriCTEventsPanel", "esriCTEventsPanelSelected");
            domClass.replace(this.divSearchPanel, "esriCTDivSearchPanel", "esriCTSearchPanelSelected");
            domClass.replace(this.divActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
        },

        /**
        * Create activity search panel with selected activity
        * @memberOf widgets/searchSetting/activitySearch
        */
        _showActivitySearchContainer: function () {
            var activitySearchMainContainer, tempDiv, activitySearchContent = [], activityTickMark, activityImageDiv = [], i, activitySearchMainContent, activityEditButton, SearchSettingsLayers, c, activityimgSpan = [];
            activitySearchMainContainer = domConstruct.create("div", { "class": "esriCTActivityMainContainer" }, this.divActivityContainer);
            activitySearchMainContent = domConstruct.create("div", { "class": "esriCTActivityTable" }, activitySearchMainContainer);
            SearchSettingsLayers = appGlobals.configData.ActivitySearchSettings[0];

            if (window.location.href.toString().split("$activitySearch=").length > 1) {
                // Looping for activity search setting for getting selected activity icon

                for (c = 0; c < SearchSettingsLayers.ActivityDrawList.length; c++) {
                    SearchSettingsLayers.ActivityDrawList[c].IsSelected = false;
                    // If coming from share app and found activity search then set selected icon from share url
                    if (window.location.href.toString().split("$activitySearch=")[1].split("$")[0].split(SearchSettingsLayers.ActivityDrawList[c].FieldName.toString()).length > 1) {
                        SearchSettingsLayers.ActivityDrawList[c].IsSelected = true;
                    }
                }
            }
            //张健 start
            this._createToolbar();
            //张健 end
            // Looping for activity list icon for showing image in div
            for (i = 0; i < SearchSettingsLayers.ActivityDrawList.length; i++) {
                tempDiv = domConstruct.create("div", { "class": "esriCTActivityPaneldiv","id":"draw" }, activitySearchMainContent);
                activitySearchContent[i] = domConstruct.create("div", { "class": "esriCTActivityRow", "index": i }, tempDiv);
                activityImageDiv[i] = domConstruct.create("div", { "class": "esriCTActivityImage","id":SearchSettingsLayers.ActivityDrawList[i].DrawAction}, activitySearchContent[i]);
                activityimgSpan[i] = domConstruct.create("span", { "class": "esriCTActivitySpanImg" }, activityImageDiv[i]);
                domConstruct.create("img", { "src": SearchSettingsLayers.ActivityDrawList[i].Image }, activityimgSpan[i]);
                activityTickMark = domConstruct.create("div", { "class": "esriCTActivityTextArea" }, activitySearchContent[i]);
                //this.own(on(activitySearchContent[i], a11yclick, lang.hitch(this, this._selectActivity, activityTickMark, activityimgSpan[i])));
                this.own(on(activityImageDiv[i], "click", lang.hitch(this, this._activateTool,activityImageDiv[i])));
                // If Search setting layer's activity list is selected then set selected image in container.
                if (SearchSettingsLayers.ActivityDrawList[i].IsSelected) {
                    // If in activity search found error then set selected icon disable.
                    if (window.location.href.toString().split("$activitySearch=").length > 1 && window.location.href.toString().split("$activitySearch=")[1].substring(0, 5) === "error") {
                        domClass.remove(activityTickMark, "esriCTTickMark");
                        domClass.remove(activityimgSpan[i], "esriCTUtilityImgSelect");
                    } else {
                        domClass.add(activityTickMark, "esriCTTickMark");
                        domClass.add(activityimgSpan[i], "esriCTUtilityImgSelect");
                    }
                } else {
                    domClass.remove(activityTickMark, "esriCTTickMark");
                    domClass.remove(activityimgSpan[i], "esriCTUtilityImgSelect");
                }
                domConstruct.create("div", { "class": "esriCTActivityText", "innerHTML": SearchSettingsLayers.ActivityDrawList[i].Alias }, activityTickMark);
            }
            activityEditButton = domConstruct.create("div", { "class": "esriCTDeactivityEditButton", "innerHTML": sharedNls.buttons.editButtonText }, this.divActivityContainer);

            this.own(on(activityEditButton, a11yclick, lang.hitch(this, this._changeEditSituation,activityEditButton)));
            // If in share url activity search is clicked then query for layer
            if (window.location.href.toString().split("$activitySearch=").length > 1 && window.location.href.toString().split("$activitySearch=")[1].substring(0, 5) !== "false" && window.location.href.toString().split("$activitySearch=")[1].substring(0, 5) !== "error") {
                if (window.location.href.toString().split("$doQuery=")[1].split("$")[0] === "true") {
                    this._queryForSelectedActivityInList();
                }
                domClass.replace(this.domNode, "esriCTHeaderGeoplot", "esriCTHeaderGeoplotSelected");
                domClass.replace(this.divSearchContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            }
            //query("#draw .esriCTActivityImage").forEach(function(node){
            //    on(node,"click",lang.hitch(this,this._activateTool));
            //});
        },


        /**
         * 创建绘制和编辑图层
         * @memberOf widgets/geoplot/activitySearch
         */
        _createToolbar:function(){
            this.toolbar = new Draw(this.map);
            //toolbar.on("draw-end", lang.hitch(this,this._addToMap));
            this.own(on(this.toolbar, "draw-end", lang.hitch(this, function (evt) {
                this._addToMap(evt);
            })));
            this.editToolbar = new Edit(this.map);
            //Activate the toolbar when you click on a graphic
            this.own(on(this.map.graphics, a11yclick, lang.hitch(this, function (evt) {
                if(this.isEdit==false){
                    return;//判断是否为编辑状态
                }else{
                    this.toolbar.deactivate();
                    event.stop(evt);
                    this._activateToolbar(evt.graphic);
                }
            })));
            //deactivate the toolbar when you click outside a graphic
            this.own(on(this.map,a11yclick,lang.hitch(this,function(evt){
                this.editToolbar.deactivate();
            })));
        },


        /**
         *激活功能
         *
         * @memberOf widgets/geoplot/activitySearch
         */
        _activateTool: function (element) {
            var tool = element.id.toUpperCase();
            this.map.disableMapNavigation();
            this.toolbar.activate(Draw[tool]);
        },

        /**
         *将绘制的图形添加到图层中
         *
         * @memberOf widgets/geoplot/activitySearch
         */
        _addToMap: function (evt) {
            var symbol;
            this.toolbar.deactivate();
            this.map.enableMapNavigation();
            this.map.showZoomSlider();
            switch (evt.geometry.type) {
                case "point":
                case "multipoint":
                    symbol = new SimpleMarkerSymbol();
                    break;
                case "polyline":
                    symbol = new SimpleLineSymbol();
                    break;
                default:
                    symbol = new SimpleFillSymbol();
                    break;
            }
            var graphic = new Graphic(evt.geometry, symbol);
            this.map.graphics.add(graphic);
            var text = new TextSymbol("动态标绘");
            text.font.setSize("20pt");
            switch (evt.geometry.type) {
                case "point":
                case "multipoint":
                    //点的情况
                    var point = new Point(evt.geometry);
                    var graphicText = new Graphic(point, text);
                    this.map.graphics.add(graphicText);
                    break;
                default:
//                        线 和 面的情况
//                            这个只能对线起作用  因为  paths 只涉及两个点。 而面 有很多点！ start
                    var xMax = evt.geometry.cache._extent.xmax;
                    var xMin = evt.geometry.cache._extent.xmin;
                    var yMax = evt.geometry.cache._extent.ymax;
                    var yMin = evt.geometry.cache._extent.ymin;
                    var xText = (xMax + xMin) / 2;//相加 除以2
                    var yText = (yMax + yMin) / 2;
                    var point = new Point(webMercatorUtils.xyToLngLat(xText, yText));
                    this.map.graphics.add(new Graphic(point, text));
                    break;
            }
        },

        /**
         *激活编辑功能
         *
         * @memberOf widgets/geoplot/activitySearch
         */
        _activateToolbar: function (graphic) {
            var tool = 0;

            if (1==1) {
                tool = tool | Edit.MOVE;
            }
            if (1==1) {
                tool = tool | Edit.EDIT_VERTICES;
            }
            if (1==1) {
                tool = tool | Edit.SCALE;
            }
            if (1==1) {
                tool = tool | Edit.ROTATE;
            }
            // enable text editing if a graphic uses a text symbol
            if (graphic.symbol.declaredClass === "esri.symbol.TextSymbol") {
                tool = tool | Edit.EDIT_TEXT;
            }
            //specify toolbar options
            var options = {
                allowAddVertices: true,
                allowDeleteVertices: true,
                uniformScaling: true
            };
            this.editToolbar.activate(tool, graphic, options);
        },

        /**
        * Set the select and unselect in activity search.
        * 被选中的样式
        * param {object} activityTickMark is domNode
        * param {object} activityimgSpan is domNode
        * @memberOf widgets/searchSetting/activitySearch
        */
        _selectActivity: function (activityTickMark, activityimgSpan) {
            // If activity tick mark is  found
            if (domClass.contains(activityTickMark, "esriCTTickMark")) {
                domClass.remove(activityTickMark, "esriCTTickMark");
                domClass.remove(activityimgSpan, "esriCTUtilityImgSelect");
            } else {
                domClass.add(activityTickMark, "esriCTTickMark");
                domClass.add(activityimgSpan, "esriCTUtilityImgSelect");
            }
        },

        /**
        * 判断是否开始编辑
        * @memberOf widgets/searchSetting/activitySearch
        */
        _changeEditSituation: function (element) {
            if(this.isEdit==true){
                this.isEdit=false;
                domClass.remove(element,"esriCTActivityEditButton");
                domClass.add(element,"esriCTDeactivityEditButton");
            }else{
                this.isEdit=true;
                domClass.remove(element,"esriCTDeactivityEditButton");
                domClass.add(element,"esriCTActivityEditButton");
            }
        },

        /**
        * Query for selected activity in Layer
        * @param{object}selectedRow contains the selected feature
        * @memberOf widgets/searchSetting/activitySearch
        */
        _queryForSelectedActivityInLayer: function (selectedRow) {
            var activityQueryString, queryTask, queryForActivity, i, activity, widgetName;
            activityQueryString = "";
            widgetName = "activitySearch";
            this.selectedActivities = selectedRow;
            // Looping for selected row for query on layer
            for (i = 0; i < selectedRow.length; i++) {
                activity = domAttr.get(selectedRow[i], "activity");
                // If selected icons are more then create query.
                if (i === selectedRow.length - 1) {
                    activityQueryString += activity + " = 'Yes'";
                } else {
                    activityQueryString += activity + " = 'Yes' AND ";
                }
            }
            // If query string is not found or created then show error message.
            if (activityQueryString === "") {
                appGlobals.shareOptions.doQuery = "false";
                appGlobals.shareOptions.sharedGeolocation = null;
                alert(sharedNls.errorMessages.activityNotSelected);
                topic.publish("clearGraphicsAndCarousel");
                topic.publish("removeRouteGraphichOfDirectionWidget");
                appGlobals.shareOptions.infowindowDirection = null;
                topic.publish("hideProgressIndicator");
                return;
            }
            if (appGlobals.configData.ActivitySearchSettings[0].QueryURL) {
                // creating query task for firing query on layer.
                queryTask = new QueryTask(appGlobals.configData.ActivitySearchSettings[0].QueryURL);
                queryForActivity = new Query();
                queryForActivity.where = activityQueryString;
                queryForActivity.outFields = ["*"];
                queryForActivity.returnGeometry = true;
                // Execute query on layer.
                queryTask.execute(queryForActivity, lang.hitch(this, function (relatedRecords) {
                    // If related records are found then set date and time according to format
                    if (relatedRecords && relatedRecords.features && relatedRecords.features.length > 0) {
                        this.dateFieldArray = this.getDateField(relatedRecords);
                        topic.publish("hideProgressIndicator");
                        // Call execute query on feature
                        topic.publish("executeQueryForFeatures", relatedRecords.features, appGlobals.configData.ActivitySearchSettings[0].QueryURL, widgetName);
                    } else {
                        alert(sharedNls.errorMessages.invalidSearch);
                        appGlobals.shareOptions.doQuery = "false";
                        appGlobals.shareOptions.infoRoutePoint = null;
                        appGlobals.shareOptions.infowindowDirection = null;
                        topic.publish("clearGraphicsAndCarousel");
                        topic.publish("removeRouteGraphichOfDirectionWidget");
                        topic.publish("hideProgressIndicator");
                    }
                }), function (error) {
                    appGlobals.shareOptions.doQuery = "false";
                    appGlobals.shareOptions.infoRoutePoint = null;
                    appGlobals.shareOptions.infowindowDirection = null;
                    topic.publish("hideProgressIndicator");
                    topic.publish("removeRouteGraphichOfDirectionWidget");
                    alert(error);
                });
            } else {
                appGlobals.shareOptions.doQuery = "false";
                appGlobals.shareOptions.infoRoutePoint = null;
                appGlobals.shareOptions.infowindowDirection = null;
                topic.publish("clearGraphicsAndCarousel");
                topic.publish("removeRouteGraphichOfDirectionWidget");
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.activityLayerNotconfigured);
            }
        }
    });
});
