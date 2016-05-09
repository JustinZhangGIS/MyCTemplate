/*global define,dojo,dojoConfig:true,alert,esri,console,Modernizr,dijit,appGlobals */
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
    "dojo/window",
    "dojo/dom-geometry",
    "dojo/dom",
    "dojo/_base/array",
    "dojo/dom-class",
    "esri/tasks/query",
    "dojo/Deferred",
    "esri/tasks/QueryTask",
    "esri/geometry/Point",
    "esri/dijit/Measurement",
    "dojo/text!./templates/geoMeasureTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/urlUtils",
    "../geoMeasure/activitySearch",
    "esri/request",
    "../geoMeasure/eventPlannerHelper",
    "widgets/locator/locator",
    "dijit/a11yclick",
    "dojo/date/locale"

], function (declare, domConstruct, domStyle, domAttr, lang, on, win, domGeom, dom, array, domClass, Query, Deferred, QueryTask, Point,Measurement, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, urlUtils, ActivitySearch, esriRequest, EventPlannerHelper, LocatorTool, a11yclick, locale) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, ActivitySearch, EventPlannerHelper], {
        measurement:null,                                                 // 测量
        templateString: template,                                         // Variable for template string
        sharedNls: sharedNls,                                             // Variable for shared NLS
        acitivityListDiv: null,                                           // Variable store the activity list div
        locatorAddress: "",                                               // Variable for locator address
        isExtentSet: false,                                               // Variable for set the extent in share case
        todayDate: new Date(),                                            // Variable for getting today's date
        widgetName: null,                                                 // Variable to store the widget name
        selectedLayerTitle: null,                                         // Variable for selected layer title
        myListStore: [],                                                  // Array to store myList data
        geoLocationGraphicsLayerID: "geoLocationGraphicsLayer",           // Geolocation graphics layer id
        locatorGraphicsLayerID: "esriGraphicsLayerMapSettings",           // Locator graphics layer id
        /**
        * Display locator, activity and event search in one panel
        *
        * @class
        * @name widgets/searchSetting/searchSetting
        */
        postCreate: function () {
            var contHeight, locatorParams, locatorObject, routeObject, objectIDField, getSearchSettingsDetails, mapPoint, isTrue = false, settingsName, objectIDValue, index, URL, settings;
            this.myFromDate.constraints.min = this.todayDate;
            this.myToDate.constraints.min = this.todayDate;
            // Setting panel's title from config file
            this.searchPanelTitle.innerHTML = appGlobals.configData.SearchPanelTitle;
            this.activityPanelTitle.innerHTML = appGlobals.configData.ActivityPanelTitle;
            this.eventsPanelTitle.innerHTML = appGlobals.configData.EventPanelTitle;
            domAttr.set(this.searchPanelTitle, "title", appGlobals.configData.SearchPanelTitle);
            domAttr.set(this.activityPanelTitle, "title", appGlobals.configData.ActivityPanelTitle);
            domAttr.set(this.eventsPanelTitle, "title", appGlobals.configData.EventPanelTitle);
            domStyle.set(this.divActivityPanel, "display", "none");
            domStyle.set(this.divEventsPanel, "display", "none");
            /**
            * Close locator widget if any other widget is opened
            * @param {string} widget Key of the newly opened widget
            */
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "geoMeasure") {
                    if (domGeom.getMarginBox(this.divSearchContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                        domClass.replace(this.divSearchContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                    }
                } else {
                    if (domClass.contains(this.divSearchContainer, "esriCTHideContainerHeight")) {
                        contHeight = domStyle.get(this.divSearchResultContent, "height");
                        domStyle.set(this.divSearchContainer, "height", contHeight + 2 + "px");
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.search, "class": "esriCTHeaderSearch" }, null);

            domConstruct.place(this.divSearchContainer, dom.byId("esriCTParentDivContainer"));
            this.own(on(this.domNode, a11yclick, lang.hitch(this, function () {
                /**
                * Minimize other open header panel widgets and show locator widget
                */
                this.isExtentSet = true;
                this.isInfowindowHide = true;
                topic.publish("extentSetValue", true);
                topic.publish("toggleWidget", "geoMeasure");
                if (win.getBox().w <= 766) {
                    topic.publish("collapseCarousel");
                }
                this._showLocateContainer();
                // Checking for feature search data of event search if it is present then
                if (this.featureSet && this.featureSet.length > 0) {
                    this._showActivitiesList();
                }
            })));
            //启用量测工具
            this.Measure();
            // Subscribing to store value for extent from other widget.
            topic.subscribe("extentSetValue", lang.hitch(this, function (value) {
                this.isExtentSet = value;
            }));
            domAttr.set(this.divSearchContainer, "title", "");
            // Click for activity tab in search header panel
            this.own(on(this.divActivityPanel, a11yclick, lang.hitch(this, function () {
                this._showActivityTab();
            })));
            // calling function for create carousel pod is ActivitySearchSettings is enable
            if (appGlobals.configData.ActivitySearchSettings[0].Enable) {
                this._showActivitySearchContainer();
            }
            // Click for unified search tab in search header panel
            this.own(on(this.divSearchPanel, a11yclick, lang.hitch(this, function () {
                this._showSearchTab();
            })));
            // Click for event tab in search header panel
            this.own(on(this.divEventsPanel, a11yclick, lang.hitch(this, function () {
                this._showEventTab();
            })));
            // click on "GO" button in activity search
            this.own(on(this.buttonGo, a11yclick, lang.hitch(this, function () {
                topic.publish("removeBuffer");
                topic.publish("clearGraphicsAndCarousel");
                topic.publish("removeRouteGraphichOfDirectionWidget");
                topic.publish("hideInfoWindow");
                topic.publish("extentSetValue", true);
                this.featureSet.length = 0;
                this._activityPlannerDateValidation();
            })));
            // Change event for date in event planner
            this.own(on(this.myFromDate, "change", lang.hitch(this, function () {
                this.myToDate.reset();
                this.myToDate.constraints.min = this.myFromDate.value;
            })));
            // Proxy setting for route services
            urlUtils.addProxyRule({
                urlPrefix: appGlobals.configData.DrivingDirectionSettings.RouteServiceURL,
                proxyUrl: appGlobals.configData.ProxyUrl
            });
            // Calling function to showing the search tab
            this._showSearchTab();
        },
        /**
         * measurement
         */
        Measure:function(){
            this.measurement = new Measurement({
                map: this.map
            }, document.getElementById("measurementDiv"));
            this.measurement.startup();
        }
    });
});
