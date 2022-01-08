import crossfilter from "crossfilter2";
import coNrRevChart from "./vega-lite/viz_coNrRev_vega";


export function prepareDataCoNrRev(DATA) {



    let selectedNACE = document.getElementById("nace-cat1").value;

    let filter = crossfilter(DATA);

    if (selectedNACE != 'GDP') {

        const subNaces = document.querySelectorAll(".nace-select-cat-subnace");
        subNaces.forEach(element => {
            if (element.value == 'Default') {
                return;
            }
            else selectedNACE = element.value;
        });




        //filter DATA by selectedNACE

        const dataByNace = filter.dimension(function (row) {
            return row['nace_r2'];
        }).filter(selectedNACE).top(Infinity);



        const selectedYear = document.querySelector('input[type="radio"][name="viz-coNrRev-year-select"]:checked').value;

        //filter by year too
        filter = crossfilter(dataByNace);
        const dataByNaceAndYear = filter.dimension(function (row) {
            return row['year'];
        }).filter(selectedYear).top(Infinity);



        //filter by indicator
        filter = crossfilter(dataByNaceAndYear);
        const dataByIndicator = filter.dimension(function (row) {
            return row['indicators_desc_hu'];
        });


        const dataByRev = dataByIndicator.filter('Árbevétel vagy bruttó díjbevétel - millió euró').top(Infinity);

        const dataByExp = dataByIndicator.filter("Termék és szolgáltatás vásárlások és személyzeti kiadások összesen").top(Infinity);
        const dataByMargin = dataByIndicator.filter("Bruttó működési eredmény - millió euró").top(Infinity);

        let dataByCoNr = null;

        if (document.getElementById("viz-coNrRev-projection-select").value == 'average')
            dataByCoNr = dataByIndicator.filter("Vállalatok száma").top(Infinity);

        let preparedData = []

        let selected_countries = [];
        let countries = ['AT', 'BA', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL',
        'ES', 'FI', 'FR', 'HR', 'HU', 'LI',
        'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'MK', 'MT', 'NL', 'NO',
        'PL', 'PT', 'RO', 'RS', 'SE', 'SI', 'SK', 'UK'];

        if (document.getElementById("viz-country").innerHTML != "") {
            document.querySelectorAll(".viz-country-check").forEach(element => {
                if (element.checked) selected_countries.push(element.value);
            })
        }

        if (selected_countries.length == 0) selected_countries = countries;

        dataByRev.forEach(country => {

            if (selected_countries.includes(country["country_code"])) {

                let country_dict = {};
                country_dict['country'] = country["country_code"];
                country_dict["country_name"] = country["country_name"];
                country_dict["year"] = country["year"];
                country_dict['nace'] = country["nace_r2"] + " - " + country["nace_r2_desc_hu"];

                country_dict['revenue'] = country['value'] * 1;

                let margin = dataByMargin.filter(function (row) {
                    return row['country_code'] == country["country_code"];
                });
                if (margin.length > 0) {
                    country_dict['margin'] = margin[0]['value'] * 1;

                    let expenses = dataByExp.filter(function (row) {
                        return row['country_code'] == country["country_code"];
                    });
                    if (expenses.length > 0) {
                        country_dict["expenses"] = expenses[0]['value'] * 1;

                        if (document.getElementById("viz-coNrRev-projection-select").value == 'average') {

                            let coNumber = dataByCoNr.filter(function (row) {
                                return row['country_code'] == country["country_code"];
                            });

                            if (coNumber.length > 0) {
                                country_dict["coNr"] = coNumber[0]['value'];
                                country_dict["revenue"] = country_dict["revenue"] / country_dict["coNr"];
                                country_dict["expenses"] = country_dict["expenses"] / country_dict["coNr"];
                                country_dict["margin"] = country_dict["margin"] / country_dict["coNr"];

                                preparedData.push(country_dict);

                            }

                        } else {
                            preparedData.push(country_dict);
                        }


                    }
                }
            }


        });

        if (document.getElementById("viz-country").innerHTML == "") {   
            filter = crossfilter(preparedData)

            let preparedDataFilter = filter.dimension(function (row) {
                return row['country'];
            }).group().top(Infinity);

            let html = "";

            Object.values(preparedDataFilter).forEach(country => {
                let code = country['key'];
                html += `
            <input type="checkbox" class="viz-country-check" value=${code} id="viz-coNrRev-countries-${code}" unchecked>
            <label for="viz-coNrRev-countries-${code}">${code}</label>
            `;
            });

            document.getElementById("viz-country").innerHTML = html;

            document.querySelectorAll(".viz-country-check").forEach(element => {
                element.addEventListener("change", function () {
                    prepareDataCoNrRev(DATA);
                })
            })
        }



        coNrRevChart(preparedData);
    }
}