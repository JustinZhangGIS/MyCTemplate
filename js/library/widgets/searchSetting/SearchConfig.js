/**
 * Created by Esri on 2016/01/05.
 * 因为每个微件是否配置不知道，所以把微件中用到的配置信息配置到 微件里面。 最后如果放到外面的config.js里 也好放。
 */
dojoSearchConfig = {
    Title : "通用查询widget的配置文件",
    featureServers : [
        //第一个图层信息
        {
            //能源充电站
            layerName:"BeiJing",
            url: "http://services.arcgis.com/AegVO92BkdKrxZ0V/arcgis/rest/services/PublicStationMapService/FeatureServer/0",
            //查询字段  今后可能扩展成数组  模糊查询字段可以是多个
            searchFields: "stationName",
            //充电站的名称 字段
            displayField: "stationName"
        },
        //第二个图层信息
        {
            //天津医院
            layerName:"TianJin",
            url: "http://services.arcgis.com/AegVO92BkdKrxZ0V/ArcGIS/rest/services/Pz0za/FeatureServer/0",
            //查询字段
            searchFields: "f1",
            //医院名称 字段
            displayField: "f1"
        }
        //如果有其他的图层信息  ，请 继续添加。
    ],
    ShowLayer : "true"
};
