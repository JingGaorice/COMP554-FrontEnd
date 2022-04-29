# Project Introduction:
This is a project that provides information about the test rate and positive rate of COVID-19 in the United States. There are two different ways to view the data provided. Map view allows the user to click on different states for the today, quarterly, semi-annually, and historical data of the test results. Search view provides line charts for states selected by the user, and the user is able to select the timestamp to display the data of positive cases / total tests. Data from multiple states with specified timestamp can be displayed on the same chart with different colors for comparison. Simulate view provides a comparison between simulated data and actual data with a specified median filter. There are four different charts provided, historical positive rates (positive cases / total tests) median filter, historical positive rates and moving average, historical number of tests median filter, and historical positive cases median filter. Meanwhile, visualization of specific counties in Texas is supported.


# Project Demo:
![](https://s2.loli.net/2022/04/30/dG72gejkBrXCEtK.gif)


# Get started
```
$ npm install
$ npm run start
```


# Website Link
http://comp590-ft-countryview.surge.sh/


# Reproducibility
This project is deployed with Surge.
For deploying, follow the following steps:
```
$ npm run build
$ cd build
$ cp index.html 200.html   
$ surge
> Running as xxx@rice.edu (Student)
> project: /Users/xxx/COMP554-FrontEnd/
> domain: [target-deploy-domain].surge.sh
> upload: [====================] 100% eta: 0.0s (1880 files, 20048087 bytes)
> CDN: [====================] 100%
> encryption: *.surge.sh, surge.sh (384 days)
> IP: 138.197.xxx.xxx
> Success! - [target-deploy-domain].surge.sh
```

You should input target-deploy-domain as your desired domain for deploy.


# Project Structure:
```
src
├── App.css
├── App.js
├── ...
├── react_usa_map
│   ├── TexasData.csv
│   ├── TexasTests.csv
│   ├── dataset
│   │   ├── MM-dd-YYYY.csv
│   │   ├── README.md
│   │   ├── TexasData.csv
│   │   └── TexasTests.csv
│   ├── mainview.css
│   └── mainview.js
├── reportWebVitals.js
├── setupTests.js
└── util
    ├── modal_chart_util.js
    ├── search_chart_util.js
    ├── simulate_chart_util.js
    └── util_func.js
```


# Important Components & Functions:

## Main Component:

Major part of this view component contains a USA map and a modal.

The USA map displays each state on the map, and each state prompts seperate modal 
based on the local case statistics.

## Map View:
The USA map displays each state on the map.


## Search View:
This view component is the line chart in search view in the main page.

This line chart displays the Historical Cases Per Test (Number of Confirmed Cases / Number of Tests) for selected states. 

Sample rate, data source, moving average days and states can be specified by user.


## Simulate View:
There are four major charts in this view.
1. Displays Historical Cases Per Test (Number of Confirmed Cases / Number of Tests) with median filter.
2. Displays Historical number of confirmed cases days with median filter.
3. Displays Historical number of tests days with median filter.
4. Displays Historical Cases Per Test days with median filter and moving average.



# Dependencies:
1. [React.JS](https://reactjs.org/)
2. [Chart.JS](https://www.chartjs.org/)
3. [faker-js](https://fakerjs.dev/)