// pages/forecast/forecast.js
import * as echarts from '../../ec-canvas/echarts';
let publicMethod = require("../../utils/util");
let app = getApp();
let idx = null;

Page({
  data: {
    useData:[],
    dailyWeather:[],
    hours: [0,3,6,9,12,15,18,21],
    mask: false,
    width: '100%',
    height: '100%',
    whichOne: 0,
    ec: {
      lazyLoad: true
    }
  },
  onLoad: function (options) {
    //setNavigationBar
    publicMethod.handleNavigationBar('Air Quality Forecast')
    
    this.data.dailyWeather = app.globalData.dailyWeather;
    this.data.useData = app.globalData.data.forecast;
    idx = app.globalData.data.title.idx;

    this.setData({
      useData: this.data.useData,
      dailyWeather: this.data.dailyWeather
    })

    let result = this.getOption(this.data.useData);
    setTimeout(function () {
      this.loadCharts(this.data.useData, result)
    }.bind(this), 500)
  },

  onShow(){
    if (idx !== app.globalData.data.title.idx){

      this.data.dailyWeather = app.globalData.dailyWeather;
      this.data.useData = app.globalData.data.forecast;
      idx = app.globalData.data.title.idx;
     
      this.setData({
        useData: this.data.useData,
        dailyWeather: this.data.dailyWeather
      })

      let result = this.getOption(this.data.useData);
      setTimeout(function () {
        this.loadCharts(this.data.useData, result)
      }.bind(this), 500)
    }
  },

  loadCharts(apiData, result){
    for (let i = 0; i < apiData.length; i++) {
      this.selectComponent('#mychart-dom-bar' + i).init((canvas, width, height) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height
        });
        chart.setOption(result[i]);
        return chart;
      });
    }
  },

  getOption(apiData) {
    let optionArr = [];
    for (let i = 0; i < apiData.length;i++){
      optionArr.push({
        grid: {
          top: '30%',
          bottom: '0%',
          left: '0%',
          right: '0%'
        },
        xAxis: {
          data: ["", "", "", "", "", "", "", ""],
          show: false
        },
        yAxis: {
          show: false
        },
        animation: false,
        clickable: false,
        series: [{
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].wind, false)[0]
        }, {
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].wind, false)[1],
          label: {
            show: true,
            position: 'insideBottom',
            distance: 0,
            color:'#000000'
          },
          z:3
        }, {
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].wind, false)[2]
        }]
      })
    }
    
    return optionArr
  },

  onShareAppMessage: function (res) {
    let city = app.globalData.shareCity;
    return {
      title: `${city}的天气及空气`,
      path: '/pages/open/open',
      imageUrl: '../img/share.png'
    }
  },

  scale(e) {
    let index = e.currentTarget.dataset.index;

    this.setData({
      mask: true,
      width: 0,
      height: 0,
      whichOne: index
    })

    let result = this.getBigOption(this.data.useData[index])
    setTimeout(function () {
      for (let i = 6; i <= 7; i++) {
        this.selectComponent('#mychart-dom-bar' + i).init((canvas, width, height) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height
          });
          chart.setOption(result[i-6]);
          return chart;
        });
      }
    }.bind(this), 1300)

    // 添加动画
    var animation = wx.createAnimation({
      transformOrigin: "50% 50%",
      duration: 800,
      timingFunction: "ease",
      delay: 100
    })
    setTimeout(function () {
      animation.scale(1).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 100)

  },

  close() {
    this.setData({
      mask: false
    })
    setTimeout(function () {
      this.setData({
        width: '100%',
        height: '100%'
      })
    }.bind(this), 100)
    var animation = wx.createAnimation({
      transformOrigin: "50% 50%",
      duration: 100,
    })

    animation.scale(0.01).step()
    this.setData({
      animationData: animation.export()
    })
  },

  getBigOption(data){
    let arr = [];
    for (let i = 0; i < 2; i++) {
      arr.push({
        grid: {
          top: '30%',
          bottom: '0%',
          left: '0%',
          right: '0%'
        },
        xAxis: {
          data: ["", "", "", "", "", "", "", ""],
          show: false
        },
        yAxis: {
          show: false
        },
        animation: false,
        clickable: false,
        series: []
      })
    }
    arr[0].series = [{
      type: 'bar',
      barGap: 0,
      data: publicMethod.handleChartData(data.wind, false)[0]
    }, {
      type: 'bar',
      barGap: 0,
      data: publicMethod.handleChartData(data.wind, false)[1],
      label: {
        show: true,
        position: 'insideBottom',
        distance: 0,
        color: '#000000',
        fontSize: 18
      },
      z: 3
    }, {
      type: 'bar',
      barGap: 0,
      data: publicMethod.handleChartData(data.wind, false)[2]
    }];

    arr[1].yAxis.scale = true;
    arr[1].series = [{
      type: 'bar',
      barGap: 0,
      data: publicMethod.handleChartData(data.c, true)[0]
    }, {
      type: 'bar',
      barGap: 0,
      data: publicMethod.handleChartData(data.c, true)[1],
    }, {
      type: 'bar',
      barGap: 0,
      data: publicMethod.handleChartData(data.c, true)[2]
    }]

    return arr;
  },

  handleTitle(aqi) {
    let color;
    if (aqi < 51) {
      color = '#009966'
    } else if (50 < aqi && aqi < 101) {
      color = '#ffde33'
    } else if (100 < aqi && aqi < 151) {
      color = '#ff9933'
    } else if (150 < aqi && aqi < 201) {
      color = '#cc0033'
    } else if (200 < aqi && aqi < 301) {
      color = '#660099'
    } else if (300 < aqi) {
      color = '#7e0023'
    }
    return color;
  },
})