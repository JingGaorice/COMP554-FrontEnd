import {Bar, Line} from 'react-chartjs-2';
import React from "react";
import {canpraseint, request_data_by_state, states_map} from './util_func'
import {pad } from "../util/util_func"

const state_get_full = states_map();
export const color_list = ['#ADD8E6', '#87CEEB', '#87CEFA', '#191970','#000080', '#FF7F50', '#FF6347','#FF4500', '#FF0000'];
export const week_list = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function cleanDatafunc(data2020, data2021, statename){
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let a = 0, b = 0; // a would record the confirmed case and b would record  tests each time
    for(let i = 1; i <= 12; i += 1) {
        for(let j = 1; j <= datemap[i]; j += 1) {
            let dataState = data2020[i - 1][j - 1][statename];
            if(dataState){
                const numConfirmed = canpraseint(dataState['Confirmed']);
                let numTests = canpraseint(dataState['Total_Test_Results']);
                if(!numTests){
                    numTests = canpraseint(dataState['People_Tested']);
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
                const numConfirmed = canpraseint(dataState['Confirmed']);
                let numTests = canpraseint(dataState['Total_Test_Results']);
                if(!numTests){
                    numTests = canpraseint(dataState['People_Tested']);
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

function filterHelper(data, dayNum){
    let filter = [];

    for(let i = 0; i < data.length; i += 1) {
        let push_value = data[i], given_array = [];;

        for(let j = i; j < i + dayNum; j += 1){
            let value = data[j % (data.length)]
            if(value > 300000) {
                while(value >= 100000){
                    value = parseInt(value / 10);
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

function applyMedianFilter(confirm, test, dayNum = 3){
    let filter_confirm = [], filter_test = [];

    filter_confirm = filterHelper(confirm, dayNum);
    filter_test = filterHelper(test, dayNum);

    return [filter_confirm, filter_test];
}

export function semiAnnuallyView(data2020, data2021, statename, useYear2020, semester, todaydata) {
    let label_list = [], data = [];
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let semester_map = {"Fall": [7, 12], "Spring":[1, 6]}
    let month_start = semester_map[semester][0], month_end = semester_map[semester][1];


    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let cleanData = cleanDatafunc( mydata2020, mydata2021, statename);
    let data_used_in_quarter_view = useYear2020 === "2020"? JSON.parse(JSON.stringify(cleanData[0])) : JSON.parse(JSON.stringify(cleanData[1]));

    let result = genertateDataAndLabel(month_start, month_end, datemap, data_used_in_quarter_view, statename, useYear2020);
    label_list = result[0];
    data = result[1];
    let testResultData = result[2];


    let mybar_view = {

        labels: label_list,
        datasets: [
            {
                label: 'Percent Positive',
                cubicInterpolationMode: 'monotone',
                fill: false,
                tension: 0.4,
                yAxisID: 'A',
                backgroundColor: returnBorderColor(todaydata, statename),
                borderColor: returnBorderColor(todaydata, statename),
                borderWidth: 2,
                pointRadius: 0,
                data: applyMedianFilter(data, testResultData)[0]
            },
            {
                label: 'Tests',
                yAxisID: 'B',
                cubicInterpolationMode: 'monotone',
                fill: false,
                tension: 0.4,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                pointRadius: 0,
                data: applyMedianFilter(data, testResultData)[1]
            }
        ]
    };
    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return (<div>
        <p>Recent semi-annually data in {state_get_full[statename]}</p>
        <Line
            data={mybar_view}
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
                    A:{
                        position: 'left',
                        ticks: {
                        },
                    },
                    B:{
                        position: 'right',
                        ticks: {
                        },
                    },
                    x: {
                        ticks: {
                            // For a category axis, the val is the index so the lookup via getLabelForValue is needed
                            callback: function(val, index, ticks) {

                                let label = this.getLabelForValue(val);
                                let split_array = label.split("-");
                                let year = split_array[0],month = parseInt(split_array[1]) - 1;
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
                },
            }}
        />
    </div>);
}


export function quarterView(data2020, data2021, statename, useYear2020, quarter, todaydata){


    let quarter_map = {
        "Winter": [12, 2],
        "Spring":[3, 5],
        "Summer": [6, 8],
        "Fall": [9, 11],
    };
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};

    let month_start = quarter_map[quarter][0], month_end = quarter_map[quarter][1];
    let label_list = [], data = [];

    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let cleanData = cleanDatafunc( mydata2020, mydata2021, statename);
    let data_used_in_quarter_view = useYear2020 === "2020"? JSON.parse(JSON.stringify(cleanData[0])) : JSON.parse(JSON.stringify(cleanData[1]));
    let result = genertateDataAndLabel(month_start, month_end, datemap, data_used_in_quarter_view, statename, useYear2020);
    label_list = result[0];
    data = result[1];
    let testResultData = result[2];
    if(useYear2020 === "2021" && quarter === "Winter") {
        let dec_result = genertateDataAndLabel(12, 12, datemap, JSON.parse(JSON.stringify(cleanData[0])), statename, "2020");
        let month_result = genertateDataAndLabel(1, 2, datemap, JSON.parse(JSON.stringify(cleanData[1])), statename, "2021");

        label_list = dec_result[0].concat(month_result[0]);
        data = dec_result[1].concat(month_result[1]);
        testResultData = dec_result[2].concat(month_result[2]);
    }



    let bar_view = {

        labels: label_list,
        datasets: [
            {
                label: 'Percent Positive',
                cubicInterpolationMode: 'monotone',
                fill: false,
                tension: 0.4,
                yAxisID: 'A',
                backgroundColor: returnBorderColor(todaydata, statename),
                borderColor: returnBorderColor(todaydata, statename),
                borderWidth: 2,
                pointRadius: 0,
                data: applyMedianFilter(data, testResultData)[0]
            },
            {
                label: 'Tests',
                yAxisID: 'B',
                cubicInterpolationMode: 'monotone',
                fill: false,
                tension: 0.4,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                pointRadius: 0,
                data: applyMedianFilter(data, testResultData)[1]
            }
        ]
    };
    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return (<div>
        <p>Recent quarterly data in {state_get_full[statename]}</p>
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
                    A:{
                        position: 'left',
                        ticks: {
                        },
                    },
                    B:{
                        position: 'right',
                        ticks: {
                        },
                    },
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
                },
            }}
        />
    </div>);
}


export function todayBarView(select_data, statename){
    let bar_view = {

        labels: ['Today'],
        datasets: [
            {
                label: 'Testing Positive Rate',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(0,0,0,1)',
                borderWidth: 0,

                data: []
            }
        ]
    };
    let state_data_row = request_data_by_state(select_data, states_map()[statename]);
    if(state_data_row){
        let confirmed = canpraseint(state_data_row['Confirmed']),  total_test_result = canpraseint(state_data_row['Total_Test_Results']);
        if(confirmed && total_test_result) {
            let confirm_rate = parseFloat(confirmed/total_test_result);
            if(state_data_row["ratio"]){

                confirm_rate = state_data_row["ratio"];
            }
            let percentage_confirm_rate = confirm_rate * 100;
            let ceil_result = Math.ceil(percentage_confirm_rate/10);
            bar_view.datasets[0].data = [confirm_rate];
            bar_view.datasets[0].backgroundColor = color_list[ceil_result]

        }
    } else {
        console.log("This State not found")
    }

    return (<div>
        <p>Today's data in {state_get_full[statename]}</p>
        <Bar
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
                }
            }}
        />
    </div>);
}

export function historicalView(data2020, data2021, statename, todaydata) {
    let data = [], label_list = [], testResultData = [];
    const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};
    let mydata2020 = JSON.parse(JSON.stringify(data2020)), mydata2021 = JSON.parse(JSON.stringify(data2021));
    let cleanData = cleanDatafunc( mydata2020, mydata2021, statename);
    let result_2020 = genertateDataAndLabel(4, 12, datemap,cleanData[0], statename, '2020');
    let result_2021 = genertateDataAndLabel(1, 12, datemap,cleanData[1], statename, '2021');
    label_list = result_2020[0].concat(result_2021[0]);
    data = result_2020[1].concat(result_2021[1]);
    testResultData = result_2020[2].concat(result_2021[2]);

    let after_applied_filter = applyMedianFilter(data, testResultData);

    const plotData = {
        labels: label_list,
        datasets: [
            {
                label: 'Percent Positive',
                cubicInterpolationMode: 'monotone',
                fill: false,
                tension: 0.4,
                yAxisID: 'A',
                backgroundColor: returnBorderColor(todaydata, statename),
                borderColor: returnBorderColor(todaydata, statename),
                borderWidth: 2,
                pointRadius: 0,
                data: after_applied_filter[0],
            },
            {
                label: 'Tests',
                yAxisID: 'B',
                cubicInterpolationMode: 'monotone',
                fill: false,
                tension: 0.4,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                pointRadius: 0,
                data: after_applied_filter[1]
            }

        ]
    };


    let x_axis_container = {};
    let month_array = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return (<div>
        <p>Historical Percent Positive (Number of Confirmed Cases / Number of Tests) in {state_get_full[statename]}</p>
        <Line
            data={plotData}
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
                    A:{
                        position: 'left',
                        ticks: {
                            // callback: function(value, index, values) {
                            //     let percentage_value = parseFloat(value) * 100;
                            //
                            //     return String(percentage_value.toFixed(2)) + "%"
                            // }
                        },
                    },
                    B:{
                        position: 'right',
                        ticks: {
                            // callback: function(value, index, values) {
                            //     return String((parseInt(value) / 100)).substring(0,3) + "K"
                            // }
                        },
                    },
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
                },
            }}
        />
    </div>);
}

function returnBorderColor(todaydata, statename){
    let state_data_row = request_data_by_state( todaydata, states_map()[statename]);
    let confirmed = canpraseint(state_data_row['Confirmed']),  total_test_result = canpraseint(state_data_row['Total_Test_Results']);
    let confirm_rate = parseFloat(confirmed/total_test_result);
    if(state_data_row["ratio"]){

        confirm_rate = state_data_row["ratio"];
    }
    let percentage_confirm_rate = confirm_rate * 100;
    let ceil_result = Math.ceil(percentage_confirm_rate/10);

    let border_color = color_list[ceil_result]
    return border_color;
}

export function nextNDays(year, month, day, n, datemap) {
    day += n;
    if (day > datemap[month]) {
        day -= datemap[month];
        month += 1;
    }
    if (month > 12) {
        month = 1;
        year += 1;
    }
    return {year, month, day};
}


export function genertateDataAndLabel(month_start, month_end, datemap, data_used, statename, useYear2020, shiftDay = 0, otherData = ""){
    let data = [], label_list = [], num_confirmed_list = [], number_tests_list = [];
    const year = canpraseint(useYear2020);
    for(let i = month_start; i <= month_end; i += 1){
        let monthPadded = pad(i);
        for(let j = 1; j < datemap[i]; j += 1) {
            const stateData = data_used[i - 1][j - 1][statename];

            const dateThreeDaysAfter = nextNDays(year, i, j, shiftDay, datemap);
            const stateDataThreeDaysAfter = year === dateThreeDaysAfter.year ?
                data_used[dateThreeDaysAfter.month - 1][dateThreeDaysAfter.day - 1][statename] :
                otherData[dateThreeDaysAfter.month - 1][dateThreeDaysAfter.day - 1][statename];

            if (!stateDataThreeDaysAfter) {
                continue;
            }

            let dayPadded = pad(j);
            if(stateData) {
                const numConfirmed = canpraseint(stateDataThreeDaysAfter['Confirmed']);

                let numTests = canpraseint(stateData['Total_Test_Results']);
                if(!numTests){
                    numTests = canpraseint(stateData['People_Tested']);
                }
                if (numConfirmed && numTests) {
                    if(numConfirmed> 0 && numTests > 0) {
                        data.push(numConfirmed / numTests);
                        num_confirmed_list.push(numConfirmed);
                        number_tests_list.push(numTests);
                        label_list.push(`${useYear2020}-${monthPadded}-${dayPadded}`)
                    }

                }
            }
        }
    }

    return [label_list, data, num_confirmed_list, number_tests_list];
}