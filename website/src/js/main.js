import * as d3 from 'd3v4';
import * as viz_gdpMap from './viz/viz_gdpMap';
import * as viz_valAdded from './viz/viz_valAdded';
import * as viz_coNrRev from './viz/viz_coNrRev';
import crossfilter from 'crossfilter2';

d3.queue().defer(d3.csv, 'https://raw.githubusercontent.com/holgyeso/holgyeso.github.io/main/data/data.csv').await(ready);

let DATA = {}

function ready(error, data) {
    if (error) {
        return console.warn(error);
    }

    DATA = data;

    const dataByNACE = getDataByNace(DATA);
    const filteredDataByNACE = getFilteredDataByNace(dataByNACE);

    //kiiratom a nemzetgazdasági ágazatokat
    selectNACE1Options(dataByNACE, filteredDataByNACE);
    selectYearOptions();
    viz_valAdded.yearSelectCheckboxes();
    window.onscroll = function () { scrollbarFixed() };

    //ha megváltozik a nemzetgazdasági ágazat, frissítem az "alselecteket" is, hogy csak ebből a kategóriából legyenek a kódok 
    let selectedSubCatDict = {};
    document.getElementById("nace-cat1").addEventListener("change", function (e) {
        selectedSubCatDict = changedNACEOptions(dataByNACE, filteredDataByNACE);
        viz_gdpMap.prepareDataGdpMap(DATA);
        viz_valAdded.prepareDataValAdded(DATA);
        viz_coNrRev.prepareDataCoNrRev(DATA);
    });

    //ha megváltozik valamelyik alkategória, ennek megfelelően frissítem a többit is
    const subcats = document.querySelectorAll(".nace-select-cat-subnace");
    subcats.forEach(element => {
        element.addEventListener("change", function (e) {
            refreshNACESubCats(dataByNACE, e, selectedSubCatDict);
            showGDPMapGuides("else");
            viz_gdpMap.prepareDataGdpMap(DATA);
            viz_valAdded.prepareDataValAdded(DATA);
            viz_coNrRev.prepareDataCoNrRev(DATA);
        })
    });

    // viz_coNrRev.availableCountries(DATA);

    //ha megváltozik az év
    const years = document.querySelectorAll(".viz-GDPMap-year-select");
    years.forEach(year => {
        year.addEventListener("change", function (e) {
            viz_gdpMap.prepareDataGdpMap(DATA);
        })
    });

    //ha megváltozik a térképnél a projection
    document.getElementById('viz-projection-select').addEventListener("change", function (e) {
        viz_gdpMap.prepareDataGdpMap(DATA);
    });

    //ha megváltozik az év a 2. ábránál
    document.querySelectorAll('input[type="checkbox"][name="val-Added-year-check"]').forEach(element => {
        element.addEventListener("change", function (e) {
            viz_valAdded.prepareDataValAdded(DATA);
        })
    }),

        //ha megváltozik a 2. ábránál a projection
        document.getElementById("viz-valAdded-change-projection-select").addEventListener("change", function (e) {
            viz_valAdded.prepareDataValAdded(DATA);
        })

    //ha megváltozik a 3. ábránál az év
    document.querySelectorAll(".viz-coNrRev-year-select").forEach(year => {
        year.addEventListener("change", function (e) {
            viz_coNrRev.prepareDataCoNrRev(DATA);
        });
    })

    //ha megváltozik a 3. ábránál a projection
    document.getElementById("viz-coNrRev-projection-select").addEventListener("change", function (e) {
        viz_coNrRev.prepareDataCoNrRev(DATA);
    })

    viz_gdpMap.prepareDataGdpMap(DATA);
    viz_valAdded.prepareDataValAdded(DATA);
    viz_coNrRev.prepareDataCoNrRev(DATA);

    setTimeout(() => {
        document.getElementById('loader').classList.add('hide');
    }, 2000);
}
let naceDiv = document.getElementById("nace-select-div");
let height = naceDiv.offsetTop;

function scrollbarFixed() {

    if (window.pageYOffset >= height) {
        naceDiv.classList.add("fixed");
    } else {
        naceDiv.classList.remove("fixed");
    }

}

function getDataByNace(DATA) {
    const filter = crossfilter(DATA);
    const dataByNACE = filter.dimension(function (row) {
        return row['nace_r2'];
    });
    return dataByNACE;
}

function getFilteredDataByNace(dataByNACE) {
    const filteredDataByNACE = dataByNACE.group().top(Infinity);
    return filteredDataByNACE;
}


function selectNACE1Options(dataByNACE, filteredDataByNACE) {

    let selectCat = document.getElementById("nace-cat1");

    let nace1_codes = [];

    filteredDataByNACE.forEach(row => {
        if (row['key'].length == 1) {
            nace1_codes.push(row['key']);
        }
    });

    let html = '<option value="GDP">Válasszon NACE nemzetgazdasági ágat!*</option> ';

    nace1_codes.sort().forEach(code => {
        let code_desc = dataByNACE.filter(code).top(Infinity)[0]['nace_r2_desc_hu'];
        html += `<option value="${code}"> ${code} - ${code_desc} </option>`;
    });

    selectCat.innerHTML = html;
}

function changedNACEOptions(dataByNACE, filteredDataByNACE) {
    let selectedCat = document.getElementById("nace-cat1").value;

    if (selectedCat == 'GDP') {
        const subcats = document.querySelectorAll(".nace-select-cat-subnace");
        subcats.forEach(element => {
            element.style.display = "none";
        });
        showGDPMapGuides("none");
    }
    else {
        const subcats = document.querySelectorAll(".nace-select-cat-subnace");
        subcats.forEach(element => {
            element.style.display = "inline";
        });
        showGDPMapGuides("else");

        let selectSubCatDict = { 2: [], 3: [], 4: [] }; //egy dictionary ahol a key a nace kategória a value meg azon kategóriák amelyek a kiválasztott nemzetághoz tartózik és key hosszúságú


        filteredDataByNACE.forEach(row => {

            if (row['key'][0] == selectedCat && row['key'].length > 1) {
                let naceLen = row['key'].length;
                selectSubCatDict[naceLen - 1].push(row['key']);
            }

        });

        Object.keys(selectSubCatDict).forEach(naceLength => {

            let naceSelectElement = document.getElementById("nace-cat" + naceLength);


            let html_def_index = naceSelectElement.innerHTML.indexOf("</option>");
            let html = naceSelectElement.innerHTML.substring(0, html_def_index + "</option>".length).trim();


            selectSubCatDict[naceLength].sort().forEach(naceCode => {
                let code_desc = dataByNACE.filter(naceCode).top(Infinity)[0]['nace_r2_desc_hu'];
                html += `<option value="${naceCode}">${naceCode} - ${code_desc}</option>`
            });

            naceSelectElement.innerHTML = html;

        });

        return selectSubCatDict;

    }
}

function refreshNACESubCats(dataByNACE, changedElement, selectedSubCatDict) {

    let selectedNACE = changedElement.target.value;

    if (selectedNACE != 'Default') {

        Object.keys(selectedSubCatDict).forEach(naceLen => {

            if (naceLen < (selectedNACE.length - 1)) {
                let naceSelectElement = document.getElementById("nace-cat" + naceLen);
                naceSelectElement.value = selectedNACE.substr(0, parseInt(naceLen) + 1);

            }
            else if (naceLen > (selectedNACE.length - 1)) {
                let naceSelectElement = document.getElementById("nace-cat" + naceLen);

                let naceSelectElementCodes = [];

                selectedSubCatDict[naceLen].forEach(code => {

                    if (code.substr(0, selectedNACE.length) == selectedNACE) {
                        naceSelectElementCodes.push(code);
                    }
                })

                let html_def_index = naceSelectElement.innerHTML.indexOf("</option>");
                let html = naceSelectElement.innerHTML.substring(0, html_def_index + "</option>".length).trim();

                naceSelectElementCodes.forEach(code => {
                    let code_desc = dataByNACE.filter(code).top(Infinity)[0]['nace_r2_desc_hu'];
                    html += `<option value="${code}">${code} - ${code_desc}</option>`
                });

                naceSelectElement.innerHTML = html;


            }

        });
    }

}

function selectYearOptions() {
    let yearOptionsDiv = document.getElementById("viz-GDPMap-years");
    let yearOprionsCoNrRev = document.getElementById("viz-coNrRev-years");
    let htmlGDPMap = "";
    let htmlCoNrRev = "";

    for (let year = 2015; year <= 2019; year++) {
        htmlGDPMap += `<input type="radio" name="viz-GDPMap-year-select" class="viz-GDPMap-year-select" id="viz-years-radio-${year}" value="${year}">
            <label for="viz-years-radio-${year}">${year}</label>`;
        htmlCoNrRev += `<input type="radio" name="viz-coNrRev-year-select" class="viz-coNrRev-year-select" id="viz-years-coNrRev-radio-${year}" value="${year}">
            <label for="viz-years-coNrRev-radio-${year}">${year}</label>`;
    }

    yearOptionsDiv.innerHTML = htmlGDPMap;
    yearOprionsCoNrRev.innerHTML = htmlCoNrRev;

    document.getElementById("viz-years-radio-2019").checked = true;
    document.getElementById("viz-years-coNrRev-radio-2019").checked = true;
}

function showGDPMapGuides(display) {
    let flexDisplay = "inline-flex";
    if (display == "else") {
        display = "inline";

        let selectedNACE = document.getElementById("nace-cat1").value;
        const subNaces = document.querySelectorAll(".nace-select-cat-subnace");
        subNaces.forEach(element => {
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
            hozzáadott értéke Európában`;

        document.getElementById("viz-valAdded-change-title").innerHTML = `A(z) 
            <span id="selected-nace">${selectedNACE}</span>
            <span id="selected-nace-type"> ${selectedNaceDesc} </span>
            hozzáadott értékének változása 2015-2019`;

        document.getElementById("viz-coNrRev-title").innerHTML = `A(z) 
            <span id="selected-nace">${selectedNACE}</span>
            <span id="selected-nace-type"> ${selectedNaceDesc} </span>
            vállalatainak jövedelmezősége`;

    }
    else {
        flexDisplay = "none";
        document.getElementById("viz-GDPMap-title").innerHTML = 'Bruttó hozzáadott érték Európában- folyó áron <span id="selected-nace"></span><span id="selected-nace-type"></span>';
        document.getElementById("viz-valAdded-change-title").innerHTML = 'Bruttó hozzáadott érték változása Európában- folyó áron <span id="selected-nace"></span><span id="selected-nace-type"></span>';
    }

    document.getElementById("viz-GDPMap-guide").style.display = display;
    document.getElementById("viz-GDPMap-guide-info").style.display = flexDisplay;
    document.getElementById("viz-projection-select").style.display = display;

    document.getElementById("viz-valAdded-change-guide").style.display = display;
    document.getElementById("viz-valAdded-change-guide-info").style.display = flexDisplay;
    document.getElementById("viz-valAdded-change-projection-select").style.display = display;

    document.getElementById("viz-coNrRev-div").style.display = flexDisplay;
    document.getElementById("viz-coNrRev-guide").style.display = display;
    document.getElementById("viz-coNrRev-guide-info").style.display = flexDisplay;
    document.getElementById("viz-coNrRev-projection-select").style.display = display;

}
