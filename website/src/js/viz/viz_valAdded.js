import crossfilter from "crossfilter2";
import valAddedChart from "./vega-lite/viz_valAdded_vega";

export function yearSelectCheckboxes() {
    const checkboxesDiv = document.getElementById("viz-valAdded-change-year-select");
    let html = "";
    for (let i = 2015; i <= 2019; i++) {
        html += `<input type="checkbox" name="val-Added-year-check" class="viz-valAdded-change-year-select-check-${i}" id="val-Added-year-check-${i}" checked>
        <label for = "val-Added-year-check-${i}">${i}</label>`;
    }
    checkboxesDiv.innerHTML = html;
}


export function prepareDataValAdded (DATA) {
    let filter = crossfilter(DATA);
    
    //filter DATA by indicators
    const dataByIndicator = filter.dimension(function (row) {
        return row['indicators_desc_hu'];
    });
    
    //filter DATA by GDP
    const dataByGDP = dataByIndicator.filter('Bruttó hozzáadott érték - folyó áron').top(Infinity);
    
    let selectedNACE = document.getElementById("nace-cat1").value;
    
    //fitler DATA by GDP and selected years
    let selectedYears = [];
    document.querySelectorAll('input[type="checkbox"][name="val-Added-year-check"]:checked').forEach(element => {
        
        selectedYears.push(element.getAttribute('id').substr(-4));
    });
    
    
    let preparedData = [];
    
    if (selectedNACE == 'GDP') {
        
        dataByGDP.forEach(country => {
            
            if (Object.values(selectedYears).includes(country["year"])) {
                let country_dict = {};
                country_dict["country"] = country["country_code"];
                country_dict['nace'] = 'GDP';
                country_dict["country_name"] = country["country_name"];
                country_dict["year"] = country["year"];
                country_dict["GDP"] = country["value"];
                country_dict['nace_value'] = NaN;
                country_dict['valueToColorAfter'] = country_dict["GDP"];

                const dataForCAGR = dataByGDP.filter(function(row) {
                    return (row['year'] == 2015 || row['year'] == 2019) && row['country_code'] == country['country_code']
                })

                let val_2015 = dataForCAGR[0]['value'];
                let val_2019 = dataForCAGR[1]['value'];

                if(dataForCAGR[0]['year'] == '2019') [val_2015, val_2019] = [val_2019, val_2015];

                country_dict['CAGR'] = (val_2019/val_2015)**(1/(2019-2015+1))-1;

                preparedData.push(country_dict);
            }        
        })
        
    }
    else {
        
        //get indicator of value added at factor cost
        const valueAddedIndicator = dataByIndicator.filter('Hozzáadott érték tényezőköltségen - millió euró').top(Infinity);
        
        
        //get indicator of value added at factor cost of the selected NACE
        const subNaces = document.querySelectorAll(".nace-select-cat-subnace");
        subNaces.forEach (element => {
            if (element.value == 'Default') {
                return;
            }
            else selectedNACE = element.value;
        });
        
        filter = crossfilter(valueAddedIndicator);
        const valAddedBySelectedNace = filter.dimension(function (row) {
            return row['nace_r2'];
        }).filter(selectedNACE).top(Infinity);
        

        
        const valueToShow = document.getElementById("viz-valAdded-change-projection-select").value;
        
        valAddedBySelectedNace.forEach (country => {
            
            if (Object.values(selectedYears).includes(country["year"])) {
                let country_dict = {};
                country_dict["country"] = country["country_code"];
                country_dict["country_name"] = country["country_name"];
                country_dict["year"] = country["year"];
                country_dict['nace'] = selectedNACE + " - " + country["nace_r2_desc_hu"];
                country_dict['nace_value'] = country['value'];
                country_dict['GDP'] = NaN;
                
                if (valueToShow == 'absolute') country_dict['valueToColorAfter'] = country_dict['nace_value'];
                else {
                    country_dict['GDP'] = dataByGDP.filter(function (row) {
                        return row["country_code"] == country["country_code"];
                    })[0]['value'];
                    country_dict['valueToColorAfter'] = country_dict['nace_value'] / country_dict['GDP'];
                }

                const dataForCAGR = valAddedBySelectedNace.filter(function (row) {
                    return (row['year'] == 2015 || row['year'] == 2019) && row['country_code'] == country['country_code']
                });

                if (dataForCAGR.length == 2) {
                    let val_2015 = dataForCAGR[0]['value'];
                    let val_2019 = dataForCAGR[1]['value'];

                    if(dataForCAGR[0]['year'] == '2019') [val_2015, val_2019] = [val_2019, val_2015];

                    country_dict['CAGR'] = (val_2019/val_2015)**(1/(2019-2015+1))-1;

                }

                preparedData.push(country_dict);
            }
            
        });
        
        
    }
    
    valAddedChart(preparedData)
    
}