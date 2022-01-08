import crossfilter from "crossfilter2";
import vegaEmbedModule from "vega-embed"

export default function coNrRevChart(DATA) {

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
            field: 'nace',
            type: 'nominal',
            title: "Iparág",
        },
    ];

    if (document.getElementById("viz-coNrRev-projection-select").value == 'average') {
        tooltipSpec.push (
            {
                field: 'coNr',
                type: 'quantitative',
                title: "Vállalatok száma",
                format: ',d',
            },
            {
                field: 'revenue',
                type: 'quantitative',
                title: "Átlag-árbevétel vagy -bruttó díjbevétel - millió euró",
                format: ',d',
            },
            {
                field: 'expenses',
                type: 'quantitative',
                title: "Átlagkiadások összesen - millió euró",
                format: ',d',
            },
            {
                field: 'margin',
                type: 'quantitative',
                title: "Átlagbruttó működési eredmény - millió euró",
                format: ',d',
            },
        );
    }
    else {
        tooltipSpec.push(
            {
                field: 'revenue',
                type: 'quantitative',
                title: "Árbevétel vagy bruttó díjbevétel - millió euró",
                format: ',d',
            },
            {
                field: 'expenses',
                type: 'quantitative',
                title: "Kiadások összesen - millió euró",
                format: ',d',
            },
            {
                field: 'margin',
                type: 'quantitative',
                title: "Bruttó működési eredmény - millió euró",
                format: ',d',
            },
        );
    }

    let scaleMax = 0;

    let filter = crossfilter(DATA);

    let filteredData = filter.dimension(function (row) {
        return row['expenses'];
    }).group().top(Infinity);
    

    let coNrRevSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        width: 900,
        height: 600,
        data: {
            values: DATA,
        },
        params: [{
            name: "grid",
            select: "interval",
            bind: "scales"
        }],
        config: {
            legend: {
                padding: 25,
                labelFont: "'Encode Sans', sans-serif",
                titleFont: "'Encode Sans', sans-serif",
                titleFontSize: 12,
                // titleAlign: "center",
                // labelAlign: "center",
                titleLimit: 1500,
                titlePadding: 15,
                titleAnchor: "middle",
                orient: "bottom",
                "layout": {"bottom": {"anchor": "middle"}},
            },
        },
        mark: "circle",
        encoding: {
            x: {
                field: "expenses", 
                type: "quantitative",
                axis: {
                    title: "Termék és szolgáltatás vásárlások és személyzeti kiadások összesen (millió EUR)",
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
                }
            },
            y: {
                field: "revenue", "type": "quantitative",
                axis: {
                    title: "Árbevétel vagy bruttó díjbevétel - millió euró",
                    gridColor: '#C9DDDA',
                    domainColor: '#C9DDDA',
                    tickColor: '#C9DDDA',
                    labelFontSize: 11,
                    labelFont: "'Encode Sans', sans-serif",
                    labelPadding: 10,
                    titleFont: "'Encode Sans', sans-serif",
                    titlePadding: 15,
                    titleFontSize: 13,
                    format: ',d',
                },
            },
            size: { "field": "margin", "type": "quantitative", title: "Bruttó működési eredmény (millió EUR)",},
            color: {
                value: "#086E7D",

            },
            tooltip: tooltipSpec,
        }
    }

    vegaEmbedModule("#viz_coNrRev", coNrRevSpec, {
        actions: false,
    })

}