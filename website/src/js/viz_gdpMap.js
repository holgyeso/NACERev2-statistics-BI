import crossfilter from 'crossfilter2';
import gdpMap from './viz_gdpMap_vega';

export function showGDPMapGuides(display) {
    let flexDisplay = "inline-flex";
    if (display == "else") {
        display = "inline";
        
        let selectedNACE = document.getElementById("nace-cat1").value;
        const subNaces = document.querySelectorAll(".nace-select-cat-subnace");
        subNaces.forEach (element => {
            if (element.value == 'Default') {
                return;
            }
            else selectedNACE = element.value;
        });
                
        let selectedNaceDesc = "";
        
        switch (selectedNACE.length) {
            case 1:
                selectedNaceDesc = "nemzetgazdasági ág";
                break;
            case 3:
                selectedNaceDesc = "ágazat";
                break;
            case 4:
                selectedNaceDesc = "alágazat";
                break;
            case 5:
                    selectedNaceDesc = "szakágazat";
                    break;
            default:
                selectedNaceDesc = "";
            break;
        }

        document.getElementById("viz-GDPMap-title").innerHTML = `A(z) 
        <span id="selected-nace">${selectedNACE}</span>
        <span id="selected-nace-type"> ${selectedNaceDesc} </span>
        hozzáadott értéke`
    }
    else {
        flexDisplay = "none";
        document.getElementById("viz-GDPMap-title").innerHTML = 'Bruttó hozzáadott érték - folyó áron <span id="selected-nace"></span><span id="selected-nace-type"></span>';
    }
    
    document.getElementById("viz-GDPMap-guide").style.display = display;
    document.getElementById("viz-GDPMap-guide-info").style.display = flexDisplay;
    document.getElementById("viz-projection-select").style.display = display;
}


export function prepareDataGdpMap (DATA) {
    
    let filter = crossfilter(DATA);
    
    //filter DATA by indicators
    const dataByIndicator = filter.dimension(function (row) {
        return row['indicators_desc'];
    });
    
    //filter DATA by GDP
    const dataByGDP = dataByIndicator.filter('Value added, gross - current prices').top(Infinity);
    
    //filter DATA by GDP and selected year
    let selectedYear = document.querySelector('input[type="radio"][name="viz-GDPMap-year-select"]:checked').value;

    
    filter = crossfilter(dataByGDP);
    const dataByGDPAndYear = filter.dimension(function (row) {
        return row['year'];
    }).filter(selectedYear).top(Infinity);
    
    let selectedNACE = document.getElementById("nace-cat1").value;
    
    
    let preparedData = [];
    
    if (selectedNACE == 'GDP') {
        
        dataByGDPAndYear.forEach(country => {
            let country_dict = {};
            country_dict['year'] = selectedYear;
            country_dict['nace'] = 'GDP';
            country_dict['country'] = country['country_code'];
            country_dict['country_name'] = country['country_name'];
            country_dict['GDP'] = country['value'];
            country_dict['nace_value'] = NaN;
            country_dict['valueToColorAfter'] = country['value'] // country['value'] == value of GDP
            preparedData.push(country_dict);
        })
        
    } 
    
    else {

        //get indicator of value added at factor cost
        const valueAddedIndicator = dataByIndicator.filter('Value added at factor cost - million euro').top(Infinity);
        
        
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

        //filter for year too
        filter = crossfilter(valAddedBySelectedNace);
        const valAddedBySelectedNaceAndYear = filter.dimension(function (row) {
            return row['year'];
        }).filter(selectedYear).top(Infinity);

        console.log(valAddedBySelectedNaceAndYear)

        const valueToShow = document.getElementById('viz-projection-select').value;

        valAddedBySelectedNaceAndYear.forEach (country => {
            let country_dict = {};
            country_dict['year'] = selectedYear;
            country_dict['nace'] = selectedNACE + " - " + country["nace_r2_desc_hu"];
            country_dict['country'] = country['country_code'];
            country_dict['country_name'] = country['country_name'];
            country_dict['GDP'] = dataByGDPAndYear.filter(function (element) {
                return element["country_code"] == country['country_code'];
            })[0]['value'];
            country_dict['nace_value'] = country['value']; // country['value'] == value added at factor cost of selected NACE

            if (valueToShow == 'absolute') country_dict['valueToColorAfter'] = country_dict['nace_value'];
            else country_dict['valueToColorAfter'] = country_dict['nace_value'] / country_dict['GDP'];

            preparedData.push(country_dict);
        })
        
        console.log(preparedData);

    }
    
    gdpMap(preparedData);
}