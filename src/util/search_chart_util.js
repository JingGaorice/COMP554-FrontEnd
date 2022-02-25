import {canpraseint, pad, request_data_by_state, return_label_array, states_map} from "./util_func";
import {Bar, Line} from "react-chartjs-2";
import React from "react";
import {genertateDataAndLabel, week_list} from "./modal_chart_util";
import {movingAverageHelper} from "./simulate_chart_util";

export const color_list = ['rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)', '#FF4500', '#FF0000'];
const state_get_full = states_map();


export function cleanDatafunc(data2020, data2021, statename){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let a = 0, b = 0; // a would record the confirmed case and b would record  tests each time
    for(let i = 1; i <= 12; i += 1) {
        for(let j = 1; j <= datemap[i]; j += 1) {
            let dataState = data2020[i - 1][j - 1][statename];
            if(dataState){
                const numConfirmed = canpraseint(dataState['Confirmed']);
                let numTests = canpraseint(dataState['Total_Test_Results']);
                // let found = false;
                if(!numTests){
                    numTests = canpraseint(dataState['People_Tested']);
                    // found = true;
                }
                if(a === 0 && b === 0 && numConfirmed && numTests){
                    a = numConfirmed;
                    b = numTests;
                } else if(numConfirmed > 0 && numTests > 0){
                    data2020[i - 1][j - 1][statename]['Confirmed'] = String(numConfirmed - a);
                    // if(found) { // in 2020 csv, there will be either People_Tested or Total_Test_Results field name
                    //     data2020[i - 1][j - 1][statename]['People_Tested'] = String(numTests - b);
                    // } else {
                    //     data2020[i - 1][j - 1][statename]['Total_Test_Results'] = String(numTests - b);
                    // }
                    data2020[i - 1][j - 1][statename]['Total_Test_Results'] = String(numTests - b);
                    a = numConfirmed;
                    b = numTests;
                } else {
                    data2020[i - 1][j - 1][statename]['Confirmed'] = '0'
                    data2020[i - 1][j - 1][statename]['People_Tested'] = '0'
                    data2020[i - 1][j - 1][statename]['Total_Test_Results'] = '0';
                }
            }
        }
    }
    // as current a and b will record the 12/31/2020 or the last day of 2020's confirmed and tests, can directly use
    for(let i = 1; i <= 12; i += 1) {
        for(let j = 1; j <= datemap[i]; j += 1) {
            let dataState = data2021[i - 1][j - 1][statename];
            if(dataState){
                const numConfirmed = canpraseint(dataState['Confirmed']);
                let numTests = canpraseint(dataState['Total_Test_Results']);
                // let found = false;
                if(!numTests){
                    numTests = canpraseint(dataState['People_Tested']);
                    // found = true;
                }
                if(numConfirmed > 0 && numTests > 0){
                    data2021[i - 1][j - 1][statename]['Confirmed'] = String(numConfirmed - a);
                    data2021[i - 1][j - 1][statename]['Total_Test_Results'] = String(numTests - b);
                    a = numConfirmed;
                    b = numTests;
                } else {
                    data2021[i - 1][j - 1][statename]['Confirmed'] = '0'
                    data2021[i - 1][j - 1][statename]['People_Tested'] = '0'
                    data2021[i - 1][j - 1][statename]['Total_Test_Results'] = '0';
                }
            }
        }
    }

    return [data2020, data2021]


}
function generateLabelName(statename, usewhich){
    let str = "cumulated";
    if(usewhich){
        str = "daily";
    }


    return statename + " CPT" + " (" + str + ")";
}
export function searchChart(data2021, data2020, state_list, picknum = 2, usedDaily = true, movingaverage = 0){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let my_cleaned_data = cleanDatafunc(JSON.parse(JSON.stringify(data2020)), JSON.parse(JSON.stringify(data2021)), 'CA');
    if(usedDaily === false){
        my_cleaned_data = [data2020, data2021]
    }
    let result_2020 = genertateDataAndLabel(4, 12, datemap,my_cleaned_data[0], 'CA', '2020', 0, my_cleaned_data[1]);
    let result_2021 = genertateDataAndLabel(1, 12, datemap,my_cleaned_data[1], 'CA', '2021', 0, my_cleaned_data[1]);
    let labels_arr = result_2020[0].concat(result_2021[0]);
    if(picknum === 0) {
        labels_arr = result_2020[0];
    } else if(picknum === 1){
        labels_arr = result_2021[0];
    }
    let bar_view = {

        labels: labels_arr,
        datasets: []
    };


    for(let i = 0; i < state_list.length; i += 1) {
        let statename = state_list[i].name, stateinit = state_list[i].id;
        bar_view.datasets.push({
            label: generateLabelName(statename, usedDaily),
            backgroundColor: color_list[i % color_list.length],
            borderColor: color_list[i % color_list.length],
            data: [],
            cubicInterpolationMode: 'monotone',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,


        })

        let cleaned_data = cleanDatafunc(mydata2020,mydata2021, stateinit);
        if(!usedDaily){
            cleaned_data = [data2020, data2021]
        }
        const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
        let result_2020 = genertateDataAndLabel(4, 12, datemap,cleaned_data[0], stateinit, '2020', 0, cleaned_data[1]);
        let result_2021 = genertateDataAndLabel(1, 12, datemap,cleaned_data[1], stateinit, '2021', 0, cleaned_data[1]);

        let data_arr = result_2020[1];
        if(picknum === 1) {
            data_arr = result_2021[1];
        } else if(picknum === 2) {
            data_arr = result_2020[1].concat(result_2021[1]);
        }



        for(let i = 0; i < data_arr.length; i += 1) {
            let value = data_arr[i];
            while(value >= 1) {
                value = parseFloat(value / 2.5);
            }
            data_arr[i] = value;
        }

        let data = data_arr;

        let movingAverage = movingAverageHelper(JSON.parse(JSON.stringify(data)), movingaverage, true)[0]
        bar_view.datasets[i].data = movingAverage;

    }

    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return (<div>
        <div className="ui large label">Historical Cases Per Test (Number of Confirmed Cases / Number of Tests)</div>

        <Line
            data={bar_view}
            options={{

                title:{
                    display:true,
                    text:'Today\'s Confirm Rate',
                    fontSize:20
                },
                legend:{
                    display:true,
                    position:'right'
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                scales:{
                    x: {
                        ticks: {
                            // For a category axis, the val is the index so the lookup via getLabelForValue is needed
                            callback: function(val, index, ticks) {

                                let label = this.getLabelForValue(val);

                                let split_array = label.split("-");
                                let year = split_array[0], month = parseInt(split_array[1]) - 1;
                                if(!x_axis_container[year + month]){
                                    x_axis_container[year + month] = 1;
                                    return month_array[month] + " " + year;
                                }
                                if(index === ticks.length - 1) {
                                    x_axis_container = {};
                                }


                            },

                        }
                    }
                }


            }}
        />
    </div>);

}

function returnStateData(data2021, statename){
    let data = []
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    for(let month = 1; month <= 12; month += 1) {
        const monthPadded = pad(month);
        for(let day = 1; day <= datemap[month]; day += 1) {
            const dayPadded = pad(day);
            const stateData = data2021[month - 1][day - 1][statename];
            if (stateData) {
                const numConfirmed = canpraseint(stateData['Confirmed']);
                let numTests = canpraseint(stateData['Total_Test_Results']);

                if(!numTests){
                    numTests = canpraseint(stateData['People_Tested']);
                }

                if (numConfirmed && numTests) {
                    let result = numConfirmed / numTests;
                    if(result >= 1) {
                        if(data.length >= 1){
                            result = data[data.length - 1]
                        } else {
                            result -= 1;
                        }
                    }
                    data.push(result);
                }
            }
        }
    }
   return data;
}

function returneachday(data2021, statename, year){
    let data = []
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    for(let month = 1; month <= 12; month += 1) {
        const monthPadded = pad(month);
        for(let day = 1; day <= datemap[month]; day += 1) {
            const dayPadded = pad(day);
            const stateData = data2021[month - 1][day - 1][statename];

            if (stateData) {

                const numConfirmed = canpraseint(stateData['Confirmed']);
                let numTests = canpraseint(stateData['Total_Test_Results']);
                if(!numTests){
                    numTests = canpraseint(stateData['People_Tested']);
                }
                if (numConfirmed && numTests) {
                    if(numConfirmed> 0 && numTests > 0) {
                        data.push(`${year}-${monthPadded}-${dayPadded}`);
                    }
                }
            }
        }
    }
    return data;
}


