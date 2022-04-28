import {canparseint} from "./util_func";
import {Line} from "react-chartjs-2";
import React from "react";
import {generateDataAndLabel} from "./modal_chart_util";

export const color_list = ['rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)', '#FF4500', '#FF0000'];

/**
 * Reset data set of 2020 and 2021 for modal chart
 */
function cleanDatafunc(data2020, data2021, statename){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let a = 0, b = 0; // a would record the confirmed case and b would record tests each time
    for(let i = 1; i <= 12; i += 1) {
        for(let j = 1; j <= datemap[i]; j += 1) {
            let dataState = data2020[i - 1][j - 1][statename];
            if(dataState){
                const numConfirmed = canparseint(dataState['Confirmed']);
                let numTests = canparseint(dataState['Total_Test_Results']);
                if(!numTests){
                    numTests = canparseint(dataState['People_Tested']);
                }
                if(a === 0 && b === 0 && numConfirmed && numTests){
                    a = numConfirmed;
                    b = numTests;
                } else if(numConfirmed > 0 && numTests > 0){
                    data2020[i - 1][j - 1][statename]['Confirmed'] = String(numConfirmed - a);
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
                const numConfirmed = canparseint(dataState['Confirmed']);
                let numTests = canparseint(dataState['Total_Test_Results']);
                // let found = false;
                if(!numTests){
                    numTests = canparseint(dataState['People_Tested']);
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

/**
 * Helper function for median filter.
 */
function filterHelper(data, dayNum, ratio = false){
    let filter = [];
    if(dayNum === 0) {
        for(let i = 0; i < data.length; i += 1) {
            let value = data[i];
            if(value > 1000000) {
                while(value >= 300000){
                    value = parseInt(value / 10);
                }
            }
            if(ratio) {
                while(value >= 1){
                    value = parseFloat(value / 2.5);
                }
            }
            filter.push(value);
        }
        return filter;
    }

    for(let i = 0; i < data.length; i += 1) {
        let push_value = data[i], given_array = [];

        for(let j = i; j < i + dayNum; j += 1){
            let value = data[j % (data.length)]
            if(value > 1000000) {
                while(value >= 300000){
                    value = parseInt(value / 10);
                }
            }
            if(ratio) {
                while(value >= 1){
                    value = parseFloat(value / 2.5);
                }
            }
            given_array.push(value);
        }

        given_array.sort();
        push_value = given_array[parseInt(dayNum/2)]
        filter.push(push_value);
    }
    return filter;
}

/**
 * Helper function for moving average.
 */
export function movingAverageHelper(data, dayNum, ratio = false){
    let filter = [];
    if(dayNum === 0) {
        for(let i = 0; i < data.length; i += 1) {
            let value = data[i];
            while(value >= 100000){
                value = parseInt(value / 10);
            }
            if(ratio) {
                while(value >= 1){
                    value = parseFloat(value / 2.5);
                }
            }
            filter.push(value);
        }
        return [filter];
    }

    for(let i = 1; i < data.length; i += 1) {
        let push_value = data[i], given_array = [];
        for(let j = i - 1; j < i - 1 + dayNum; j += 1){
            let value = data[j % (data.length)]
            while(value >= 1000000){
                value = parseInt(value / 10);
            }
            if(ratio) {
                while(value >= 1){
                    value = parseFloat(value / 2.5);
                }
            }
            given_array.push(value);
        }
        let sum = given_array.reduce(function(acc, val) { return acc + val; }, 0);
        if(sum !== 0) {
            push_value = sum / dayNum;
        }
        filter.push(push_value);
    }
    return [filter];
}

function applyMedianFilter(confirm, test, dayNum = 3, ratio = false){
    let filter_confirm = [], filter_test = [];

    filter_confirm = filterHelper(confirm, dayNum, ratio);
    filter_test = filterHelper(test, dayNum, ratio);

    return [filter_confirm, filter_test];
}

function getLabel(dayNum, label) {
    if(dayNum === 0 ){
        return "Original Data";
    } else {
        return dayNum + label;
    }
}

/**
 * This view component displays Historical Cases Per Test (Number of Confirmed Cases / Number of Tests) with median filter.
 */
export function simulateChart(data2021, data2020, day_list, stateName, shiftDay, countyMode = false){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let cleaned_data = cleanDatafunc(mydata2020,mydata2021, stateName);
    if(countyMode){
        cleaned_data = [data2020, data2021]
    }
    let result_2020 = generateDataAndLabel(4, 12, datemap,cleaned_data[0], stateName, '2020', shiftDay, cleaned_data[1]);
    let result_2021 = generateDataAndLabel(1, 12, datemap,cleaned_data[1], stateName, '2021', shiftDay, cleaned_data[1]);
    let labels_arr = result_2020[0].concat(result_2021[0]);
    let data_arr = result_2020[1].concat(result_2021[1]);

    let bar_view = {
        labels: labels_arr,
        datasets: []
    };


    for(let i = 0; i < day_list.length; i += 1) {
        let day = day_list[i];
        bar_view.datasets.push({
            label: getLabel(day , " days median filter"),
            backgroundColor: color_list[i % color_list.length],
            borderColor: color_list[i % color_list.length],
            cubicInterpolationMode: 'monotone',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            data: [],
        })
        let data_filter = applyMedianFilter(data_arr, [], day, true);
        bar_view.datasets[i].data = data_filter[0];
    }


    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    //Historical Cases Per Test (Number of Confirmed Cases / Number of Tests)
    return (<div>
        <div className="ui large label">Historical CPT days median filter</div>
        <div className="ui button" data-tooltip="CPT stands for Cases Per Test (Number of Confirmed Cases / Number of Tests) " data-position="top left">
            ?
        </div>
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
                                    let need_return = true, return_label = month_array[month] + " " + year;
                                    if(countyMode){
                                        if(month % 3 !== 0) {
                                            need_return = false;
                                        }
                                    }
                                    if(need_return){
                                        return return_label;
                                    }
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

/**
 * This view component displays Historical number of confirmed cases days with median filter.
 */
export function simulateCasesChart(data2021, data2020, day_list, stateName, shiftDay, countyMode = false){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let cleaned_data = cleanDatafunc(mydata2020,mydata2021, stateName);
    if(countyMode){
        cleaned_data = [data2020, data2021]
    }
    let result_2020 = generateDataAndLabel(4, 12, datemap,cleaned_data[0], stateName, '2020', shiftDay, cleaned_data[1]);
    let result_2021 = generateDataAndLabel(1, 12, datemap,cleaned_data[1], stateName, '2021', shiftDay, cleaned_data[1]);
    let labels_arr = result_2020[0].concat(result_2021[0]);
    let data_arr = result_2020[2].concat(result_2021[2]);

    let bar_view = {
        labels: labels_arr,
        datasets: []
    };


    for(let i = 0; i < day_list.length; i += 1) {
        let day = day_list[i];
        bar_view.datasets.push({
            label: getLabel(day," days median filter"),
            backgroundColor: color_list[i % color_list.length],
            borderColor: color_list[i % color_list.length],
            cubicInterpolationMode: 'monotone',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            data: [],
        })
        let data_filter = applyMedianFilter(data_arr, [], day);
        bar_view.datasets[i].data = data_filter[0];

    }


    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return (<div>
        <div className="ui large label">Historical number of confirmed cases days median filter</div>

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
                                    let need_return = true, return_label = month_array[month] + " " + year;
                                    if(countyMode){
                                        if(month % 3 !== 0) {
                                            need_return = false;
                                        }
                                    }
                                    if(need_return){
                                        return return_label;
                                    }
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

/**
 * This view component displays Historical number of tests days with median filter.
 */
export function simulateTestsChart(data2021, data2020, day_list, stateName, shiftDay, countyMode = false){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let cleaned_data = cleanDatafunc(mydata2020,mydata2021, stateName);
    if(countyMode){
        cleaned_data = [data2020, data2021]
    }
    let result_2020 = generateDataAndLabel(4, 12, datemap,cleaned_data[0], stateName, '2020', 0, cleaned_data[1]);
    let result_2021 = generateDataAndLabel(1, 12, datemap,cleaned_data[1], stateName, '2021', 0, cleaned_data[1]);
    let labels_arr = result_2020[0].concat(result_2021[0]);
    let data_arr = result_2020[3].concat(result_2021[3]);

    let bar_view = {
        labels: labels_arr,
        datasets: []
    };

    for(let i = 0; i < day_list.length; i += 1) {
        let day = day_list[i];
        bar_view.datasets.push({
            label: getLabel(day , " days median filter"),
            backgroundColor: color_list[i % color_list.length],
            borderColor: color_list[i % color_list.length],
            cubicInterpolationMode: 'monotone',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            data: [],
        })
        let data_filter = applyMedianFilter(data_arr, [], day);
        bar_view.datasets[i].data = data_filter[0];
    }


    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return (<div>
        <div className="ui large label">Historical number of tests days median filter</div>
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
                                    let need_return = true, return_label = month_array[month] + " " + year;
                                    if(countyMode){
                                        if(month % 3 !== 0) {
                                            need_return = false;
                                        }
                                    }
                                    if(need_return){
                                        return return_label;
                                    }
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

/**
 * This view component displays Historical Cases Per Test days with median filter and moving average.
 */
export function simulateMovingAverageChart(data2021, data2020, day_list, stateName, shiftDay, movingAverageDay, countyMode = false){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let cleaned_data = cleanDatafunc(mydata2020,mydata2021, stateName);
    if(countyMode){
        cleaned_data = [data2020, data2021]
    }
    let result_2020 = generateDataAndLabel(4, 12, datemap,cleaned_data[0], stateName, '2020', shiftDay, cleaned_data[1]);
    let result_2021 = generateDataAndLabel(1, 12, datemap,cleaned_data[1], stateName, '2021', shiftDay, cleaned_data[1]);
    let labels_arr = result_2020[0].concat(result_2021[0]);
    let data_arr = result_2020[1].concat(result_2021[1]);

    let bar_view = {

        labels: labels_arr,
        datasets: []
    };

    for(let i = 0; i < day_list.length; i += 1) {
        let day = day_list[i];
        bar_view.datasets.push({
            label: getLabel(day , " days median filter and " + movingAverageDay + " day(s) moving average"),
            backgroundColor: color_list[i % color_list.length],
            borderColor: color_list[i % color_list.length],
            cubicInterpolationMode: 'monotone',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            data: [],
        })
        let data_filter = JSON.parse(JSON.stringify(applyMedianFilter(data_arr, [], day)));
        let movingAverage = movingAverageHelper(data_filter[0], movingAverageDay, true)
        bar_view.datasets[i].data = movingAverage[0];
    }

    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return (<div>
        <div className="ui large label">Historical CPT days median filter and moving average</div>
        <div className="ui button" data-tooltip="CPT stands for Cases Per Test (Number of Confirmed Cases / Number of Tests) " data-position="top right">
            ?
        </div>

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
                                    let need_return = true, return_label = month_array[month] + " " + year;
                                    if(countyMode){
                                        if(month % 3 !== 0) {
                                            need_return = false;
                                        }
                                    }
                                    if(need_return){
                                        return return_label;
                                    }
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