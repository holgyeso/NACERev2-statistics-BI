import vegaEmbedModule from "vega-embed";

export default function gdpMap (DATA) {
    
    //prepare the tooltip
    let selectedNACE = document.getElementById("nace-cat1").value;
    const valueToShow = document.getElementById('viz-projection-select').value;
    
    
    let tooltipSpec = [
        {
            field: 'country_name',
            type: 'nominal',
            title: 'Ország',
        },
        {
            field: 'year',
            type: 'nominal',
            title: 'Év',
        },
    ];
    
    if (selectedNACE == 'GDP') {
        tooltipSpec.push( 
            {
                field: 'GDP',
                type: 'quantitative',
                title: 'Bruttó hozzáadott érték (millió EUR)',
                format: ',d',
            },
            );
        }
        else {
            tooltipSpec.push( 
                {
                    field: 'nace',
                    type: 'nominal',
                    title: "Iparág",
                },
                {
                    field: 'nace_value',
                    type: "quantitative",
                    title: "Az iparág hozzáadott értéke (millió EUR)",
                    format: ',d',
                }
                );
            }
            if (valueToShow == 'relative') {
                tooltipSpec.push (
                    {
                        field: 'GDP',
                        type: 'quantitative',
                        title: 'Bruttó hozzáadott érték (millió EUR)',
                        format: ',d',
                    }, 
                    {
                        field: 'valueToColorAfter',
                        type: 'quantitative',
                        title: 'Az iparág a GDP arányában (%)',
                        format: '.2%',
                    },
                );
            }
        
        
        
        let  gdpMapSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": 700,
            "height": 500,
            "data": {
                "url": "https://raw.githubusercontent.com/holgyeso/holgyeso.github.io/main/map.json",
                "format": {
                    "type": "topojson",
                    "feature": "counties"
                }
            },
            
            layer: [
                {
                    data: {
                        url: 'https://raw.githubusercontent.com/holgyeso/holgyeso.github.io/main/map.json',
                        format: {
                            type: 'topojson',
                            feature: 'europe',
                        },
                    },
                    projection: {
                        type: 'naturalEarth1',
                    },
                    mark: {
                        type: 'geoshape',
                        fill: '#D9D9D9',
                        stroke: '#fefefe',
                    },
                },
                {
                    data: {
                        url: 'https://raw.githubusercontent.com/holgyeso/holgyeso.github.io/main/map.json',
                        format: {
                            type: 'topojson',
                            feature: 'europe',
                        },
                    },
                    transform: [
                        {
                            lookup: 'id',
                            from: {
                                data: {
                                    values: DATA
                                },
                                key: 'country',
                                fields: ['year', 'nace', 'country_name', 'GDP', 'nace_value', 'valueToColorAfter'], //minden ide kell amit meg akarok jeleníteni akár tooltipben is
                            },
                        },
                    ],
                    projection: {
                        type: 'naturalEarth1',
                    },
                    mark: 'geoshape',
                    encoding: {
                        color: {
                            field: 'valueToColorAfter',
                            type: 'quantitative',
                            title: 'Hozzáadott érték - millió EUR',
                            scale: {
                                range: ['#89B5AF', '#086E7D'],
                            },
                        },
                        tooltip: tooltipSpec,
                    },
                }
            ],
        };
        
        
        vegaEmbedModule("#viz_gdpMap", gdpMapSpec, {
            actions: false
        });
    }