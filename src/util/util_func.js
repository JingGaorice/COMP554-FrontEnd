export function pad(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}

export function request_data_by_state(list, state){
    for(let i = 0; i < list.length;i += 1) {
        if(list[i].Province_State === state){
            return list[i];
        }
    }
    return [];
}

export function canpraseint(str_num){
    if(isNaN(parseInt(str_num))){
        return 0;
    } else {
        return parseInt(str_num);
    }
}

export function generateColorStateMap(select_date_data){
    let color_list = ['#ADD8E6', '#87CEEB', '#87CEFA', '#191970','#000080', '#FF7F50', '#FF6347','#FF4500', '#FF0000'];
    let color_states = {};

    for(const [key, value] of Object.entries(states_map())){
        color_states[key] = {fill: 'red'} // set default color as red
        let state_data_row = request_data_by_state(select_date_data, value);

        if(state_data_row){
            let confirmed = canpraseint(state_data_row['Confirmed']),  total_test_result = canpraseint(state_data_row['Total_Test_Results']);
            if(confirmed && total_test_result) {

                let confirm_rate = parseFloat(confirmed/total_test_result);
                if(state_data_row["ratio"]){

                    confirm_rate = state_data_row["ratio"];
                }
                let percentage_confirm_rate = confirm_rate * 100;
                let ceil_result = Math.ceil(percentage_confirm_rate/10);

                color_states[key] = {fill: color_list[ceil_result]}

            }
        } else{
            console.log(state_data_row)
        }
    }
    return color_states;
}

export function states_map (){
    return {
        "AL": "Alabama",
        "AK": "Alaska",
        "AS": "American Samoa",
        "AZ": "Arizona",
        "AR": "Arkansas",
        "CA": "California",
        "CO": "Colorado",
        "CT": "Connecticut",
        "DE": "Delaware",
        "DC": "District Of Columbia",
        "FM": "Federated States Of Micronesia",
        "FL": "Florida",
        "GA": "Georgia",
        "GU": "Guam",
        "HI": "Hawaii",
        "ID": "Idaho",
        "IL": "Illinois",
        "IN": "Indiana",
        "IA": "Iowa",
        "KS": "Kansas",
        "KY": "Kentucky",
        "LA": "Louisiana",
        "ME": "Maine",
        "MH": "Marshall Islands",
        "MD": "Maryland",
        "MA": "Massachusetts",
        "MI": "Michigan",
        "MN": "Minnesota",
        "MS": "Mississippi",
        "MO": "Missouri",
        "MT": "Montana",
        "NE": "Nebraska",
        "NV": "Nevada",
        "NH": "New Hampshire",
        "NJ": "New Jersey",
        "NM": "New Mexico",
        "NY": "New York",
        "NC": "North Carolina",
        "ND": "North Dakota",
        "MP": "Northern Mariana Islands",
        "OH": "Ohio",
        "OK": "Oklahoma",
        "OR": "Oregon",
        "PW": "Palau",
        "PA": "Pennsylvania",
        "PR": "Puerto Rico",
        "RI": "Rhode Island",
        "SC": "South Carolina",
        "SD": "South Dakota",
        "TN": "Tennessee",
        "TX": "Texas",
        "UT": "Utah",
        "VT": "Vermont",
        "VI": "Virgin Islands",
        "VA": "Virginia",
        "WA": "Washington",
        "WV": "West Virginia",
        "WI": "Wisconsin",
        "WY": "Wyoming"
    };
}

