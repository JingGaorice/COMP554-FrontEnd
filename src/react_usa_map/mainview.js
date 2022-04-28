import USAMap from "react-usa-map";
import React, { Component } from "react";
import {Button, Modal} from 'semantic-ui-react'
import "./mainview.css"
import faker from 'faker'
import _ from 'lodash'
import {pad, states_map, generateColorStateMap} from "../util/util_func"
import { SegmentedControl } from 'segmented-control'
import {
    historicalView,
    semiAnnuallyView,
    todayBarView,
    quarterView,
    generateDataAndLabel, nextNDays
} from '../util/modal_chart_util'
import Multiselect from 'multiselect-react-dropdown';
import { Dropdown, Menu } from 'semantic-ui-react'
import {cleanDatafunc, searchChart} from "../util/search_chart_util";
import {
    simulateCasesChart,
    simulateChart, simulateMovingAverageChart,
    simulateTestsChart
} from "../util/simulate_chart_util";

const map_get_full = states_map()

let multilestyle = {
    chips: { // To change css chips(Selected options)
        background: '#191970',
        alignItems: 'center',
        borderRadius: '5px',
        border: '1px solid #191970',
    },

}
const options = [
    { text: '2020', value: 0 },
    { text: '2021', value: 1 },
    { text: 'Both', value: 2 },
]

const option_data = [
    { text: 'Overall', value: 0 },
    { text: 'Daily', value: 1 },
]

/**
 * Major part of this view component contains a USA map and a modal.
 * The USA map displays each state on the map, and each state prompts seperate modal 
 * based on the local case statistics.
 */
export default class MainView extends Component{
    constructor(props) {
        super(props);

        this.state = {
            data_2021: Array(12).fill(0).map(row => new Array(31).fill({})),
            data_2020: Array(12).fill(0).map(row => new Array(31).fill({})),
            data_2021_texas: Array(12).fill(0).map(row => new Array(31).fill({})),
            data_2020_texas: Array(12).fill(0).map(row => new Array(31).fill({})),
            selectMonth:12,
            selectDay:11,
            selectYear:2021,
            select_date_data:[],

            loading: true,
            loading2: true,
            open:false,
            fill_color_state_map:{},

            segment_control_background: { width: 500,  color: 'red',  fontSize: '15px', borderRadius: "10px 10px 10px 10px",  }, // background color of segment
            tab:1,
            main_tab:10,
            select_state:"",

            selectText: "Select Or Enter Text",
            options: [{name: 'Option 1️⃣', id: 1},{name: 'Option 2️⃣', id: 2}, {name: 'Option 3', id: 2}],
            select_state_list:[],
            selectedValue:[],
            selectYearInSearch:2,

            select_day_list:[],
            selectedStateValue:"",

            selectYearInQuarter: '2021',
            selectQuarterInQuarter: "Fall",
            selectYearInSemiannually: '2021',
            selectSemesterInSemiannually: "Fall",
            selectedShiftDay: 0,
            selectedMovingAverageDaySimulateView:0,
            selectedMovingAverageDaySearchView:0,
            selecteddaily: 1,
            texasCountiesName:[],
            selectStatesOrTexasInSimulateView: 0,
        }
        //onSelect
        this.onSelect = this.onSelect.bind(this);

        //onRemove
        this.onRemove = this.onRemove.bind(this);

    }

    /**
     * Lifecycle function, request data when 
     * component is mounted.
     */
    componentDidMount() {
        this.requestAllData();
        this.requestDataByDate();
        this.fillSearchBarData();
    }

    /***********************functions used for map*/

    /**
     * Request data for each day. The data is stored in /dataset/MM-dd-YYYY.csv
     * Request case data for each county on each day in Texas. The data is stored in /dataset/TexasData.csv
     * Request test data for each county on each day in Texas. The data is stored in /dataset/TexasTests.csv
     */
    requestAllData(){
        let datemap = {1: 31, 2: 28, 3:31, 4:30, 5:31, 6:30, 7: 31, 8:31, 9:30, 10:31, 11:30, 12:31};
        let map_parsed = {};
        for(let i = 1 ; i <= 12; i += 1) {
            let month = pad(i);

            for(let j = 1; j <= datemap[i]; j += 1) {
                let day = pad(j);
                const filename = "./dataset/" + month + "-" + day + "-" + 2021 + ".csv";

                if( i === 12 && j >= 12) {
                    break;
                } else {
                    import(`${filename}`)
                        .then(async module => {
                            await fetch(module.default)
                                .then(rs => rs.text())
                                .then(text => {
                                    let info_list = text.split("\n"), day_map = {};
                                    let row_identifer = info_list[0].split(",");
                                    for(let k = 1; k < info_list.length; k += 1) {
                                        let splited_data = info_list[k].split(",");
                                        for (let l = 0; l < splited_data.length; l += 1) {
                                            map_parsed[row_identifer[l]] = splited_data[l];
                                        }
                                        map_parsed['Province_State'] = String(splited_data[0]);
                                        let state_name = map_parsed['Province_State'];
                                        if(state_name) {
                                            for(const [key, value] of Object.entries(map_get_full)){
                                                if(state_name === value){
                                                    day_map[key] = map_parsed;
                                                    break;
                                                }
                                            }
                                        }
                                        map_parsed = {};
                                    }
                                    this.state.data_2021[i - 1][j - 1] = day_map;
                                });
                        })
                }
            }
            for(let j = 1; j <= datemap[i]; j += 1) {
                let day = pad(j);
                const filename = "./dataset/" + month + "-" + day + "-" + 2020 + ".csv";
                if((i === 4 && j >= 12) || i >= 5){
                    import(`${filename}`)
                        .then(async module => {
                            await fetch(module.default)
                                .then(rs => rs.text())
                                .then(text => {
                                    let info_list = text.split("\n"), day_map = {};
                                    let row_identifer = info_list[0].split(",");
                                    for(let k = 1; k < info_list.length; k += 1) {
                                        let splited_data = info_list[k].split(",");
                                        for (let l = 0; l < splited_data.length; l += 1) {
                                            map_parsed[row_identifer[l]] = splited_data[l];
                                        }
                                        map_parsed['Province_State'] = String(splited_data[0]);
                                        let state_name = map_parsed['Province_State'];
                                        if(state_name) {
                                            for(const [key, value] of Object.entries(map_get_full)){
                                                if(state_name === value){
                                                    day_map[key] = map_parsed;
                                                    break;
                                                }
                                            }
                                        }
                                        map_parsed = {};
                                    }
                                    this.state.data_2020[i - 1][j - 1] = day_map;
                                });
                        })
                }
            }
        }
        const filename = "./dataset/TexasData.csv";
        import(`${filename}`)
            .then(async module => {
                await fetch(module.default)
                    .then(rs => rs.text())
                    .then(text => {
                        let split_info = text.split("\n");
                        let split_county = split_info[0].split(",");
                        for(let i = 1; i < split_info.length; i += 1) {
                            let row = split_info[i].split(",");
                            let date = row[0];
                            let month = date.split("/")[0] - 1, day = date.split("/")[1] - 1, year = date.split("/")[2];
                            let county_map = {};
                            for(let j = 1; j < row.length; j += 1) {
                                let data = row[j], county_name = split_county[j],data_map = {};

                                data_map["Confirmed"] = data - '0';

                                county_map[county_name] = data_map;

                            }
                            if(year === "20") {
                                this.state.data_2020_texas[month][day] = county_map;
                            } else {
                                this.state.data_2021_texas[month][day] = county_map;
                            }
                        }
                    });
            })
        this.setState({data_2020_texas: this.state.data_2020_texas, data_2021_texas: this.state.data_2021_texas })
        const filename2 = "./dataset/TexasTests.csv";
        import(`${filename2}`)
            .then(async module => {
                await fetch(module.default)
                    .then(rs => rs.text())
                    .then(text => {
                        let split_info = text.split("\n");
                        let split_county = split_info[0].split(",");
                        for(let i = 1; i < split_county.length; i += 1) {
                            this.state.texasCountiesName.push(split_county[i]);
                        }
                        this.setState({texasCountiesName: this.state.texasCountiesName})
                        for(let i = 1; i < split_info.length; i += 1) {
                            let row = split_info[i].split(",");
                            let date = row[0];
                            let month = date.split("/")[0] - 1, day = date.split("/")[1] - 1, year = date.split("/")[2];

                            let county_map = {};
                            if(year === "20"){
                                county_map = this.state.data_2020_texas[month][day];
                            } else {
                                county_map = this.state.data_2021_texas[month][day];
                            }

                            for(let j = 1; j < row.length; j += 1) {
                                let data = row[j], county_name = split_county[j];
                                county_map[county_name]["Total_Test_Results"] = data - '0';
                            }

                            if(year === "20") {
                                this.state.data_2020_texas[month][day] = county_map;
                            } else {
                                this.state.data_2021_texas[month][day] = county_map;
                            }
                        }
                    });
            })
        this.setState({data_2020_texas: this.state.data_2020_texas, data_2021_texas: this.state.data_2021_texas })
        this.setState({data_2021: this.state.data_2021, data_2020: this.state.data_2020, loading2:false});
    }

    /**
     * Initialize data with certain selectMonth, selectDay and selectYear.
     */
    requestDataByDate(){
        let list_map = []

        const filename = "./dataset/" + pad(this.state.selectMonth) + "-" + pad(this.state.selectDay) + "-" + this.state.selectYear + ".csv";

        import(`${filename}`)
            .then(async module => {
                await fetch(module.default)
                    .then(rs => rs.text())
                    .then(text => {

                        let list = text.split("\n");

                        let row_identifer = list[0].split(",");
                        let map_parsed = {}
                        for (let i = 1; i < list.length; i += 1) {
                            let splited_data = list[i].split(",");
                            for (let j = 0; j < splited_data.length; j += 1) {
                                map_parsed[row_identifer[j]] = splited_data[j];
                            }

                            map_parsed['Province_State'] = String(splited_data[0]);
                            if(list_map.length <= 60) {
                                list_map.push(map_parsed);
                            }

                            map_parsed = {};
                        }
                        let state_full_name_to_init_map = {};
                        for (const [key, value] of Object.entries(states_map())) {
                            state_full_name_to_init_map[value] = key;
                        }
                        const datemap = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31};

                        for(let i = 0; i < list_map.length; i += 1) {
                            let full_state_name = list_map[i].Province_State;
                            if(state_full_name_to_init_map[full_state_name]){
                                let state_name = state_full_name_to_init_map[full_state_name];
                                let cleaned_data = cleanDatafunc(JSON.parse(JSON.stringify(this.state.data_2020)),JSON.parse(JSON.stringify(this.state.data_2021)), state_name);
                                let result_2021 = generateDataAndLabel(1, 12, datemap,cleaned_data[1], state_name, '2021', 0, cleaned_data[1]);
                                if(this.state.selectYear === 2021) {
                                    let result_label = result_2021[0];
                                    let result_ratio = result_2021[1];
                                    let found = false;
                                    for(let n = 0; n <= 30; n += 1){
                                        let returndate = nextNDays(this.state.selectYear, this.state.selectMonth, this.state.selectDay, n, datemap);
                                        let label_date = returndate.year + "-" + returndate.month + "-" + returndate.day;
                                        for(let j = 0; j < result_label.length; j += 1) {
                                            if(result_label[j] === label_date){
                                                let ratio = result_ratio[j];
                                                while(ratio >= 1) {
                                                    ratio /= 2.5;
                                                }
                                                if(state_name === "ME") {
                                                    ratio = 0.094;
                                                }
                                                list_map[i]["ratio"] = ratio;

                                                found = true;
                                                break;
                                            }
                                        }
                                    }
                                    if(found === false){

                                        for(let n = this.state.day; n >= 0; n -= 1){
                                            let returndate = nextNDays(this.state.selectYear, this.state.selectMonth, n, 0, datemap);
                                            let label_date = returndate.year + "-" + returndate.month + "-" + returndate.day;
                                            for(let j = 0; j < result_label.length; j += 1) {
                                                if(result_label[j] === label_date){
                                                    let ratio = result_ratio[j];
                                                    while(ratio >= 1) {
                                                        ratio /= 2.5;
                                                    }

                                                    list_map[i]["ratio"] = ratio;
                                                    console.log(list_map[i])
                                                    found = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        this.setState({select_date_data: list_map, loading:false})
                    });
            })
    }

    /**
     * Load all state names, data are specified states_map() in util_func.js
     */
    fillSearchBarData(){
        function* entries(obj) {
            for (let key in obj)
                yield [key, obj[key]];
        }
        const map = new Map(entries(map_get_full));
        let searchOptionArray = [];

        for (let [key, value] of map){
            let object = {};
            object.name = value;
            object.id = key;
            searchOptionArray.push(object);
        }
        this.setState({options: JSON.parse(JSON.stringify(searchOptionArray))})
    }

    /**
     * Handler function response to the click of specific state in the map.
     * This opens the modal and remembers the color for the state (which indicates the level of cases).
     */
    mapHandler = event => {
        let selectState = event.target.dataset.name, select_state_color = generateColorStateMap(this.state.select_date_data)[selectState];
        let _segment_control_background = this.state.segment_control_background;
        _segment_control_background.color = select_state_color.fill;
        this.setState({open: true, segment_control_background: _segment_control_background, select_state:selectState})
    };

    /**
     * Displays the user selected chart view component int the modal.
     */
    showTab(){
        switch (this.state.tab){
            case 2:
                return quarterView(this.state.data_2020, this.state.data_2021,this.state.select_state, this.state.selectYearInQuarter, this.state.selectQuarterInQuarter,  this.state.select_date_data)
            case 3:
                return semiAnnuallyView(this.state.data_2020, this.state.data_2021, this.state.select_state, this.state.selectYearInSemiannually, this.state.selectSemesterInSemiannually, this.state.select_date_data)
            case 4:
                return historicalView(this.state.data_2020,this.state.data_2021, this.state.select_state, this.state.select_date_data)
            default:
                return todayBarView(this.state.select_date_data, this.state.select_state)
        }
    }

    /**
     * Display different tabs selected by the user.
     */
    showSelection(){
        if(this.state.tab === 2) {
            return (
                <div>
                    <Menu compact style = {{position: 'absolute',
                        right: "10px",}}>
                        <Dropdown value = {this.state.selectQuarterInQuarter} options={[ {text: "Winter", value: 'Winter'}, { text: 'Spring', value: 'Spring' }, {text: "Summer", value: "Summer"}, { text: 'Fall', value: 'Fall' },]}  onChange={(event, {value})=>{
                            this.setState({selectQuarterInQuarter: value});
                            console.log(this.state.selectQuarterInQuarter);
                        }} simple item />
                    </Menu>
                    <Menu compact style = {{position: 'absolute',
                        right: "130px",}}>
                        <Dropdown value = {this.state.selectYearInQuarter} options={[{ text: '2020', value: '2020' }, { text: '2021', value: '2021' },]}  onChange={(event, {value})=>{
                            this.setState({selectYearInQuarter: value});
                            console.log(this.state.selectYearInQuarter);
                        }} simple item />
                    </Menu>
                </div>


            );
        } else if (this.state.tab === 3) {
            return (
                <div>
                    <Menu compact style = {{position: 'absolute',
                        right: "10px",}}>
                        <Dropdown value = {this.state.selectSemesterInSemiannually} options={[{ text: 'Jan-June', value: 'Spring' }, { text: 'July-Dec', value: 'Fall' },]}  onChange={(event, {value})=>{
                            this.setState({selectSemesterInSemiannually: value});
                            console.log(value)
                        }} simple item />
                    </Menu>

                    <Menu compact style = {{position: 'absolute',
                        right: "130px",}}>
                        <Dropdown value = {this.state.selectYearInSemiannually} options={[{ text: '2020', value: '2020' }, { text: '2021', value: '2021' },]}  onChange={(event, {value})=>{
                            this.setState({selectYearInSemiannually: value});
                            console.log(this.state.selectYearInSemiannually);
                        }} simple item />
                    </Menu>

                </div>

            );
        } else {
            return null;
        }
    }

    /**
     * Displays the user selected main view component int the modal.
     */
    showMainTab(){
        switch (this.state.main_tab){
            case 30:
                return this.simulateView()
            case 20:
                return this.mainSearchView()
            default:
                return this.mainMapView()
        }
    }

    /**
     * Decides the color for each state in the map.
     */
    statesCustomConfig = () => {
        return generateColorStateMap(this.state.select_date_data);
    };

    setOpen(value){
        this.setState({open:value,  selectYearInQuarter: '2021',
            selectQuarterInQuarter: "Fall",
            selectYearInSemiannually: '2021',
            selectSemesterInSemiannually: "Fall",});
    }

    setTab(value){
        this.setState({tab:value})
    }

    setMainTab(value){
        this.setState({main_tab: value});
        this.setState({select_state_list:[], select_day_list:[]});
        this.setState({selectedMovingAverageDaySimulateView: 0});
    }

    mainMapView(){
        return <div className="App" width="200">

            <USAMap
                customize={this.statesCustomConfig()}
                onClick={this.mapHandler}
            />
            <Modal
                onClose={() => this.setOpen(false)}
                onOpen={() => this.setOpen(true)}
                open={this.state.open}
            >
                <Modal.Header>
                    <div style={{display: 'flex',  justifyContent:'center', alignItems:'center' }}>
                        <SegmentedControl
                            className = "modal_segmentedControl"
                            name="oneDisabled"
                            options={[
                                { label: "Today", value: 1, default: true },
                                { label: "Quarterly", value: 2 },
                                { label: "Semi-annually", value: 3},
                                { label: "Historical", value: 4 }
                            ]}
                            setValue={newValue => this.setTab(newValue)}
                            style={ this.state.segment_control_background} // purple400
                        />
                        <div className="ui button" data-tooltip="Data missing? That's because some states may not provide detail data" data-position="top center">
                            ?
                        </div>
                    </div>
                </Modal.Header>

                <Modal.Content>
                    {this.showSelection()}
                    {this.showTab()}
                </Modal.Content>
                <Modal.Actions>
                    <Button color='black' onClick={() => this.setOpen(false)}>
                        Suggestions
                    </Button>
                    <Button
                        content="Yep, that's great"
                        labelPosition='right'
                        icon='checkmark'
                        onClick={() => this.setOpen(false)}
                        positive
                    />
                </Modal.Actions>
            </Modal>
        </div>
    }

    /**
     * Function will trigger on select event of search view.
     */
    onSelect(selectedList, selectedItem) {
        let _selectText = '';
        if(selectedList && selectedList.length >= 1) {
            _selectText = "Backspace to remove ";
        } else {
            _selectText = "Select...";
        }
        this.setState({selectText: _selectText, select_day_list:[],select_state_list: selectedList})
    }

    /**
     * Function will trigger on remove event of search view.
     */
    onRemove(selectedList, removedItem) {
        let _selectText = '';
        if(selectedList && selectedList.length >= 1) {
            _selectText = "Backspace to remove ";
        } else {
            _selectText = "Select...";
        }
        this.setState({selectText: _selectText, select_day_list:[] ,select_state_list: selectedList})
    }

    /**
     * Funtion will return the renderred HTML of the search options specified by the user
     */
    searchChartResult(){
        return searchChart(this.state.data_2021, this.state.data_2020, this.state.select_state_list, this.state.selectYearInSearch, this.state.selecteddaily, this.state.selectedMovingAverageDaySearchView);
    }

    /**
     * This renders the main search with the moving average specified by the user
     */
    mainSearchView(){
        let movingAverageOption = []
        movingAverageOption.push({
            key: 'Original',
            text: 'Original',
            value: 0,
        })
        for(let i = 3; i <= 30; i += 1) {
            movingAverageOption.push(
                {
                    key: i,
                    text: i,
                    value: i,
                }
            );
        }
        return (
            <div style={{marginLeft: "50px", marginRight: "50px"}}>

                <Dropdown placeholder='Moving Average Days' search selection options={movingAverageOption}
                              onChange={this.handleChangeSelectMovingAverageDaySearchView.bind(this)}/>

                <Multiselect
                    options={this.state.options} // Options to display in the dropdown
                    selectedValues={this.state.selectedValue} // Preselected value to persist in dropdown
                    onSelect={this.onSelect} // Function will trigger on select event
                    onRemove={this.onRemove} // Function will trigger on remove event
                    displayValue="name"
                    showCheckbox ={true}
                    placeholder = {this.state.selectText}// Property name to display in the dropdown options
                    style={multilestyle}
                />
                <Menu compact style = {{position: 'absolute',
                    right: "150px",}}>
                    <Dropdown value = {this.state.selecteddaily} options={option_data}  onChange={(event, {value})=>{
                        this.setState({selecteddaily: value});

                    }} simple item />
                </Menu>
                <Menu compact style = {{position: 'absolute',
                    right: "50px",}}>
                    <Dropdown value = {this.state.selectYearInSearch} options={options}  onChange={(event, {value})=>{
                        this.setState({selectYearInSearch: value});
                        console.log(value)
                    }} simple item />
                </Menu>
                {this.searchChartResult()}
            </div>
        );
    }

    handleChangeSelectDay = (e, {value}) => {
        this.setState({select_day_list: value})
    }

    handleChangeSelectState = (e, {value}) =>{
        this.setState({selectedStateValue: value})
    }

    handleChangeSelectShiftDays = (e, {value}) =>{
        this.setState({selectedShiftDay: value})
    }

    handleChangeSelectMovingAverageDaySearchView = (e, {value}) =>{
        this.setState({selectedMovingAverageDaySearchView: value})
    }

    handleChangeSelectMovingAverageDaySimulateView = (e, {value}) =>{
        this.setState({selectedMovingAverageDaySimulateView: value})
    }

    handleChangeSelectStateModeSimulateView = (e, {value}) =>{
        this.setState({ selectStatesOrTexasInSimulateView: value})
    }

    simulateChartRatioResult(){
        return simulateChart(this.returnStateOrTexas2021(), this.returnStateOrTexas2020(), this.state.select_day_list, this.state.selectedStateValue, this.state.selectedShiftDay, this.state.selectStatesOrTexasInSimulateView);
    }

    simulateChartTestsResult(){
        return simulateTestsChart(this.returnStateOrTexas2021(), this.returnStateOrTexas2020(), this.state.select_day_list, this.state.selectedStateValue, this.state.selectedShiftDay, this.state.selectStatesOrTexasInSimulateView);
    }

    simulateChartCasesResult(){
        return simulateCasesChart(this.returnStateOrTexas2021(), this.returnStateOrTexas2020(), this.state.select_day_list, this.state.selectedStateValue, this.state.selectedShiftDay, this.state.selectStatesOrTexasInSimulateView);
    }

    simulateMovingAverageResult(){
        return simulateMovingAverageChart(this.returnStateOrTexas2021(), this.returnStateOrTexas2020(), this.state.select_day_list, this.state.selectedStateValue, this.state.selectedShiftDay, this.state.selectedMovingAverageDaySimulateView, this.state.selectStatesOrTexasInSimulateView);
    }
    
    /**
     * Function that fetch data from user specified input to display simulate view and return rendered HTML
     */
    simulateView(){
        let simulateOptions = [];
        simulateOptions.push({key: 0, text: "Original", value: 0});
        for(let i = 3; i <= 30; i += 1) {
            simulateOptions.push({key: i, text: i + " Days", value: i});
        }

        const addressDefinitions = faker.definitions.address
        const stateOptions = _.map(addressDefinitions.state, (state, index) => ({
            key: addressDefinitions.state_abbr[index],
            text: state,
            value: addressDefinitions.state_abbr[index],
        }))

        let texasCountiesOptions = [];
        for(let i = 0; i < this.state.texasCountiesName.length; i += 1){
            texasCountiesOptions.push({
                key: this.state.texasCountiesName[i],
                text: this.state.texasCountiesName[i],
                value: this.state.texasCountiesName[i],
            })
        }

        let shiftDayOptions = [], movingAverageOption = [];
        shiftDayOptions.push(
            {
                key: 0,
                text: "Shift Day: 0 (Original)",
                value: 0,
            }
        );
        for(let i = 1; i <= 10; i += 1) {
            shiftDayOptions.push(
                {
                    key: i,
                    text: i,
                    value: i,
                }
            );
        }
        movingAverageOption.push(
            {
                key: 0,
                text: "Moving average Day: 0 (Original)",
                value: 0,
            }
        );
        for(let i = 3; i <= 30; i += 1) {
            movingAverageOption.push(
                {
                    key: i,
                    text: i,
                    value: i,
                }
            );
        }
        let optionTexas = [];
        optionTexas.push({
            key: 0,
            text: "States mode",
            value: 0,
        });

        optionTexas.push({
            key: 1,
            text: "Texas counties mode",
            value: 1,
        });
        let input = "State", inputSelectStatesCountiesOption = JSON.parse(JSON.stringify(stateOptions));
        if(this.state.selectStatesOrTexasInSimulateView) {
            input = "County";
            inputSelectStatesCountiesOption = JSON.parse(JSON.stringify(texasCountiesOptions));
        }

        return (
            <div>
                <div style={{marginLeft: "50px", marginRight: "50px"}}>


                    <div>
                        <Dropdown placeholder= {input} search selection options={inputSelectStatesCountiesOption} onChange={this.handleChangeSelectState.bind(this)}/>

                        <Dropdown placeholder='Shift Days' search selection options={shiftDayOptions} onChange={this.handleChangeSelectShiftDays.bind(this)} />
                        <Dropdown placeholder='Moving Average Days' search selection options={movingAverageOption} onChange={this.handleChangeSelectMovingAverageDaySimulateView.bind(this)} />
                        <Dropdown placeholder='States Mode' search selection options={optionTexas} onChange={this.handleChangeSelectStateModeSimulateView.bind(this)} />

                    </div>

                    <Dropdown
                        placeholder='Please enter the number of days for the median filter'
                        fluid
                        multiple
                        search
                        selection
                        options={simulateOptions}
                        onChange={this.handleChangeSelectDay.bind(this)}
                    />
                </div>

                <br/>
                <div className="row">
                    <div className="column">
                        {this.simulateChartRatioResult()}
                    </div>
                    <div className="column">
                        {this.simulateMovingAverageResult()}
                    </div>
                </div>
                <br/>
                <div className="row">
                    <div className="column">
                        {this.simulateChartTestsResult()}
                    </div>
                    <div className="column">
                        {this.simulateChartCasesResult()}
                    </div>
                </div>
            </div>
        );
    }
    /**
     * Retrieve data from specifed state or Texas state in 2020
     */
    returnStateOrTexas2020(){
        if(this.state.selectStatesOrTexasInSimulateView){
            return JSON.parse(JSON.stringify(this.state.data_2020_texas));
        }
        return JSON.parse(JSON.stringify(this.state.data_2020));
    }

    /**
     * Retrieve data from specifed state or Texas state in 2021
     */
    returnStateOrTexas2021(){
        if(this.state.selectStatesOrTexasInSimulateView){
            return JSON.parse(JSON.stringify(this.state.data_2021_texas));
        }
        return JSON.parse(JSON.stringify(this.state.data_2021));
    }
    /*********************** functions used for map *****************************/

    render(){
        if(this.state.loading || this.state.loading2){
            return <h1>Loading...</h1>
        }
        return(
            <div>
                <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', marginTop: "100px"}}>
                    <SegmentedControl
                        className = "modal_segmentedControl"
                        name="oneDisabled"
                        options={[
                            { label: "Map View", value: 10, default: true },
                            { label: "Search View", value: 20 },
                            { label: "Simulate View", value: 30 },
                        ]}
                        setValue={newValue => this.setMainTab(newValue)}
                        style ={{width: 450, color: '#191970', fontSize: '15px', borderRadius: "10px 10px 10px 10px",}}
                    />

                </div>
                {this.showMainTab()}
            </div>
        );
    }
}
