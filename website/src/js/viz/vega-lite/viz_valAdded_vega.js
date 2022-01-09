import vegaEmbedModule from "vega-embed"

export default function valAddedChart(DATA) {

    // console.log(DATA);

    let year_colors = {
        "2015": '#639D95',
        "2016": '#3FA796',
        "2017": '#406882',
        "2018": '#086E7D',
        "2019": '#04293A',
    }

    let yAxisFormat = ",d";
    let yAxisScaleSpec = {
        domainMin: 0,
    }

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
        {
            field: 'CAGR',
            type: 'quantitative',
            title: "CAGR 2015-2019",
            format: ".4%",
        }
    ];

    if (document.getElementById("nace-cat1").value == 'GDP') {
        tooltipSpec.push({
            field: 'GDP',
            type: 'quantitative',
            title: 'Bruttó hozzáadott érték (millió EUR)',
            format: ',d',
        })
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
                format: ',.2f',
            }
            );
        if ( document.getElementById("viz-valAdded-change-projection-select").value == 'relative') {
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
            yAxisFormat = '.2%';
            yAxisScaleSpec = {domain: [0, 1],};
        }
    }

    let valAddedSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        width: 1000,
        height: 500,
        config: {
            background: "transparent",
        },
        data: {
            values: DATA,
        },
        selection: {
            grid: {
                type: "interval", "bind": "scales"
            }
        },
        mark: "point",
        encoding: {
            y: {
                field: "valueToColorAfter",
                type: "quantitative",
                scale: yAxisScaleSpec,
                axis: {
                    title: "Hozzáadott érték (millió EUR)",
                    gridColor: '#C9DDDA',
                    domainColor: '#C9DDDA',
                    tickColor: '#C9DDDA',
                    labelFontSize: 11,
                    labelFont: "'Encode Sans', sans-serif",
                    labelPadding: 10,
                    titleFont: "'Encode Sans', sans-serif",
                    titlePadding: 15,
                    titleFontSize: 13,
                    format: yAxisFormat,
                }
            },
            x: { 
                field: "country", 
                type: "nominal", 
                axis: {
                    title: "Ország",
                    grid: true,
                    gridColor: '#EAF2F1',
                    domainColor: '#C9DDDA',
                    labelFont: "'Encode Sans', sans-serif",
                    labelFontSize: 12,
                    labelPadding: 10,
                    tickColor: '#C9DDDA',
                    titleFont: "'Encode Sans', sans-serif",
                    titlePadding: 15,
                    titleFontSize: 13,
                },
                sort: {
                    field: "CAGR",
                    order: "ascending"
                },
                },
            color: {
                field: "year",
                type: "nominal",
                scale: {
                    domain: Object.keys(year_colors),
                    range: Object.values(year_colors),
                },
                legend: null,
            },
            tooltip: tooltipSpec,
            size: {
                value: 100,
            }
        }
    }

    vegaEmbedModule("#viz_valAddedChart", valAddedSpec, {
        actions: false,
    })

}