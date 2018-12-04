var map;

require([
    "esri/config",
    "esri/map",
    "esri/SnappingManager",
    "esri/dijit/LayerList",
    "esri/dijit/Legend",
    "esri/layers/FeatureLayer",
    "esri/tasks/GeometryService",
    "esri/request",
    "esri/SpatialReference",
    "esri/InfoTemplate",
    "esri/graphicsUtils",
    "esri/geometry/Point",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "dojo/parser",
    "dojo/_base/array",
    "dojo/i18n!esri/nls/jsapi",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dijit/layout/TabContainer",
    "dojo/domReady!"
], function (
    esriConfig, Map, SnappingManager, LayerList, Legend, FeatureLayer, GeometryService,
    esriRequest, SpatialReference, InfoTemplate, graphicsUtils, Point, SimpleRenderer, SimpleMarkerSymbol, parser, arrayUtils, i18n
) {

        parser.parse();

        //snapping is enabled for this sample - change the tooltip to reflect this
        i18n.toolbars.draw.start += "<br/>Press <b>CTRL</b> to enable snapping";
        i18n.toolbars.draw.addPoint += "<br/>Press <b>CTRL</b> to enable snapping";

        //This sample requires a proxy page to handle communications with the ArcGIS Server services. You will need to
        //replace the url below with the location of a proxy on your machine. See the 'Using the proxy page' help topic
        //for details on setting up a proxy page.
        // esriConfig.defaults.io.proxyUrl = "/proxy/";
        // esri.config.defaults.io.corsEnabledServers = ['181.59.4.4'];

        //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications
        esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

        map = new Map("map", {
            basemap: "topo",
            center: [-73.78, 6.95],
            zoom: 12
        });

        map.infoWindow.resize(400, 300);

        var layerList = new LayerList({
            map: map,
            removeUnderscores: true,
            showLegend: true,
            showOpacitySlider: true,
            showSubLayers: true
        }, "layerList");
        layerList.startup();

        var Legend = new Legend({
            map: map
        }, "legend");
        Legend.startup();

        var options = {
            usePost: false,
            useProxy: false
        };
        var request = {
            url_: 'http://181.59.4.4:9090/api/Tarjeta/getHistorico/ddce301d-b6a0-41de-a13c-21eee5d53773/ac867543-94a9-46d0-9812-08a0c1cff79d/2018-09-01/2018-10-08',
            url: 'data.json'
        };

        var layersRequest = esriRequest(request, options);
        // layersRequest.setRequestPreCallback()
        layersRequest.then(
            response => {
                console.log('Success...', response);
                makeFeatureLayer(response);
            },
            error => { console.log('Error..', error) }
        );

        var makeFeatureLayer = function (data) {
            var nameLayer = 'Demo layer';
            var layerTemp = this.map.getLayer(nameLayer);
            var geometryType = 'esriGeometryPoint';
            var localSpatialReference = new SpatialReference({ wkid: 4326 });
            var makeFieldArray = datum => Object.keys(datum).map(d => ({
                "name": d,
                "type": "esriFieldTypeString",
                "alias": d,
                "length": 30
            }));
            // var makeInfoTemplate = datum => Object.keys(datum).map(d => `${d}: \$\{${d}\}<br/>`).join('');
            var makeInfoTemplate = datum => datum.map(d => `${d}: \$\{${d}\}<br/>`).join('');

            if (layerTemp) {
                this.map.removeLayer(layerTemp)
            };

            var symbol = new SimpleMarkerSymbol();
            var renderer = new SimpleRenderer(symbol);

            var featureCollection = {
                "layerDefinition": {
                    "geometryType": geometryType,
                    "objectIdField": "objectid",
                    'spatialReference': localSpatialReference,
                    'defaultVisibility': true,
                    'fields': [
                        { "name": "objectid", "type": "esriFieldTypeOID", "alias": "objectid" }
                    ]
                },
                "featureSet": {
                    "features": [],
                    "geometryType": geometryType
                }
            };

            featureCollection.layerDefinition.fields = featureCollection.layerDefinition.fields.concat(makeFieldArray(data[0]));
            var keyFields = featureCollection.layerDefinition.fields.map(d => d.name);
            // infoTemplate = new InfoTemplate("Punto", makeInfoTemplate(data[0]));
            infoTemplate = new InfoTemplate("Punto", makeInfoTemplate(keyFields));

            var coordinates = data.map((d, i) => {
                var retorno = {
                    'attributes': {},
                    'geometry': new Point(+d.Longitud, +d.Latitud)
                };
                keyFields.map(d2 => { retorno.attributes[d2] = (d2 === 'objectid') ? i : d[d2] });
                return retorno;
            });


            // featureCollection.featureSet.features = coordinates.slice(1, 51);
            featureCollection.featureSet.features = coordinates;

            var tID = nameLayer.split(' ').join('_');
            console.log('featureCollection', featureCollection);

            var featureLayerk = new FeatureLayer(featureCollection, {
                id: tID,
                title: tID,
                infoTemplate: infoTemplate
            });

            featureLayerk.attr("label", nameLayer);
            var extentResultado = graphicsUtils.graphicsExtent(featureCollection.featureSet.features);
            console.log("extentResultado", extentResultado);

            extentResultado = extentResultado.expand(2);

            this.map.setExtent(extentResultado);
            featureLayerk.setRenderer(renderer);
            this.map.addLayer(featureLayerk);
        }
    });