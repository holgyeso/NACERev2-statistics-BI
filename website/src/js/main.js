import * as d3 from 'd3v4';
import * as viz_gdpMap from'./viz_gdpMap';
import * as viz_valAdded from './viz_valAdded';
import crossfilter from 'crossfilter2';

d3.queue().defer(d3.csv, 'https://raw.githubusercontent.com/holgyeso/holgyeso.github.io/main/data.csv').await(ready);

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
    
    //ha megváltozik a nemzetgazdasági ágazat, frissítem az "alselecteket" is, hogy csak ebből a kategóriából legyenek a kódok 
    let selectedSubCatDict = {};
    document.getElementById("nace-cat1").addEventListener("change", function (e) {
        selectedSubCatDict = changedNACEOptions(dataByNACE, filteredDataByNACE);
        viz_gdpMap.prepareDataGdpMap(DATA);
        viz_valAdded.prepareDataValAdded(DATA);
    });
    
    //ha megváltozik valamelyik alkategória, ennek megfelelően frissítem a többit is
    const subcats = document.querySelectorAll(".nace-select-cat-subnace");
    subcats.forEach(element => {
        element.addEventListener("change", function (e) {
            refreshNACESubCats(dataByNACE, e, selectedSubCatDict);
            viz_gdpMap.showGDPMapGuides("else");
            viz_gdpMap.prepareDataGdpMap(DATA);
            viz_valAdded.prepareDataValAdded(DATA);
        })
    });

    //ha megváltozik az év
    const years = document.querySelectorAll(".viz-GDPMap-year-select");
    years.forEach(year => {
        year.addEventListener("change", function(e) {
            viz_gdpMap.prepareDataGdpMap(DATA);
        })
    });

    //ha megváltozik a térképnél a projection
    document.getElementById('viz-projection-select').addEventListener("change", function(e) {
        viz_gdpMap.prepareDataGdpMap(DATA);
    });

    //ha megváltozik az év a 2. ábránál
    document.querySelectorAll('input[type="checkbox"][name="val-Added-year-check"]').forEach(element => {
        element.addEventListener("change", function (e) {
            viz_valAdded.prepareDataValAdded(DATA);
        })
    }),

    //ha megváltozik a 2. ábránál a projection
    document.getElementById("viz-valAdded-change-projection-select").addEventListener("change", function(e) {
        viz_valAdded.prepareDataValAdded(DATA);
    })
    
    viz_gdpMap.prepareDataGdpMap(DATA);
    viz_valAdded.prepareDataValAdded(DATA);
}

function getDataByNace (DATA) {
    const filter = crossfilter(DATA);
    const dataByNACE = filter.dimension(function (row) {
        return row['nace_r2'];
    });
    return dataByNACE;
}

function getFilteredDataByNace (dataByNACE) {
    const filteredDataByNACE = dataByNACE.group().top(Infinity);
    return filteredDataByNACE;
}


function selectNACE1Options (dataByNACE, filteredDataByNACE) {
    
    let selectCat = document.getElementById("nace-cat1");
    
    let nace1_codes = [];
    
    filteredDataByNACE.forEach(row => {
        if (row['key'].length == 1) {
            nace1_codes.push(row['key']);
        }
    });
    
    let html = '<option value="GDP">Válasszon NACE nemzetgazdasági ágat!*</option> ';
    
    nace1_codes.sort().forEach(code => {
        let code_desc =  dataByNACE.filter(code).top(Infinity)[0]['nace_r2_desc_hu'];
        html += `<option value="${code}"> ${code} - ${code_desc} </option>`;
    });
    
    selectCat.innerHTML = html;
}

function changedNACEOptions (dataByNACE, filteredDataByNACE) {
    let selectedCat = document.getElementById("nace-cat1").value;
    
    if (selectedCat == 'GDP') {
        const subcats = document.querySelectorAll(".nace-select-cat-subnace");
        subcats.forEach(element => {
            element.style.display = "none";
        });
        viz_gdpMap.showGDPMapGuides("none");
    }
    else {
        const subcats = document.querySelectorAll(".nace-select-cat-subnace");
        subcats.forEach(element => {
            element.style.display = "inline";
        });
        viz_gdpMap.showGDPMapGuides("else");
        
        let selectSubCatDict = {2: [], 3: [], 4:[]}; //egy dictionary ahol a key a nace kategória a value meg azon kategóriák amelyek a kiválasztott nemzetághoz tartózik és key hosszúságú
        
        
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
                let code_desc =  dataByNACE.filter(naceCode).top(Infinity)[0]['nace_r2_desc_hu'];
                html += `<option value="${naceCode}">${naceCode} - ${code_desc}</option>`
            });
            
            naceSelectElement.innerHTML = html;
            
        });
        
        return selectSubCatDict;
        
    }
}

function refreshNACESubCats (dataByNACE, changedElement, selectedSubCatDict) {
    
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
                
                selectedSubCatDict[naceLen].forEach (code => {
                    
                    if (code.substr(0, selectedNACE.length) == selectedNACE) {
                        naceSelectElementCodes.push(code);
                    }
                })
                
                let html_def_index = naceSelectElement.innerHTML.indexOf("</option>");
                let html = naceSelectElement.innerHTML.substring(0, html_def_index + "</option>".length).trim();
                
                naceSelectElementCodes.forEach(code => {
                    let code_desc =  dataByNACE.filter(code).top(Infinity)[0]['nace_r2_desc_hu'];
                    html += `<option value="${code}">${code} - ${code_desc}</option>`
                });
                
                naceSelectElement.innerHTML = html;
                
                
            }
            
        });}
        
    }

    function selectYearOptions() {
        let yearOptionsDiv = document.getElementById("viz-GDPMap-years");
        let html = "";

        for (let year = 2015; year <= 2019; year++) {
            html += `<input type="radio" name="viz-GDPMap-year-select" class="viz-GDPMap-year-select" id="viz-years-radio-${year}" value="${year}">
            <label for="viz-years-radio-${year}">${year}</label>`;
        }

        yearOptionsDiv.innerHTML = html;

        document.getElementById("viz-years-radio-2019").checked = true;
    }
