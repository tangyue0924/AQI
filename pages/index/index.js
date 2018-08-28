//index.js

import * as echarts from '../../ec-canvas/echarts';
let publicMethod = require("../../utils/util");
let moon = require("../../utils/moon");
let app = getApp();
let position = [0,0];

Page({
  data: {
    titleMes:{},
    forecastData:[],
    dailyWeather:[],
    polDescribe:null,
    hours: [0, 3, 6, 9, 12, 15, 18, 21],
    ec: {
      lazyLoad: true
    },
    nowW:{},
    currentWeaSRC:'',
    weaMes:[],
    mask:false,
    width:'100%',
    height:'100%',
    animationData:{},
    chartOption:{},
    showOne:0
  },
  close(){
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
  scale(e) {

    let index = e.currentTarget.dataset.index;
    this.setData({
      mask: true,
      width: 0,
      height: 0,
      showOne: index
    })

    let num = index==0?5:7;
    let result = this.data.chartOption;
    result[0].series[1].label.fontSize = 18;
    result[2].series[1].label.fontSize = 18;
    setTimeout(function(){
      for (let i = num; i <= num+1; i++) {
        this.selectComponent('#mychart-dom-bar' + i).init((canvas, width, height) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height
          });
          chart.setOption(result[i - 5]);
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

  onLoad:function(){
    let geo = app.globalData.geo;
    position = geo;
    if(app.globalData.catches===true){
      let weather = wx.getStorageSync('aqi_weather');
      let dailyWeather = wx.getStorageSync('aqi_dailyWea');
      this.handelDailyWeather(dailyWeather)
      this.getIcon(weather)
    }else{
      publicMethod.getDailyWeather(geo, this.handelDailyWeather)
      publicMethod.getWeather(geo, this.getIcon)
    }
  },

  onReady: function () {
    let pollutionData = app.globalData.data;
    this.handleData(pollutionData);
  },

  getIcon(weather){
    //handleweather
    if (app.globalData.catches !== true) {
      wx.setStorage({
        key: 'aqi_weather',
        data: weather,
      })
    }
    let weaMes = this.getWeaMes(weather);
    this.setData({
      weaMes: weaMes
    })
  },

  handleData(pollutionData) {
    app.globalData.shareCity = pollutionData.i18n.name['zh-CN'];
    let allData = publicMethod.analysisData(pollutionData);
    //setNavigationBar
    publicMethod.handleNavigationBar(allData.title.city + ' AQI');
    // handle title 
    this.handleTitle(pollutionData.aqi)
    
    let forecastDate = publicMethod.distillDate(pollutionData.forecast.aqi);
    let forecastWeek = publicMethod.distillweek(forecastDate);
    //月相
    setTimeout(function(){
      for (let i = 0; i < 2; i++) {
        this.showMoon(forecastDate[i], i)
      }
    }.bind(this),500)
    
    
    for (let i = 0; i < allData.forecast.length; i++) {
      allData.forecast[i].T = forecastWeek[i];
      allData.forecast[i].cloudPic = this.getCloudPic(allData.forecast[i].aqi);
      allData.forecast[i].averageTepm = this.averageTepm(allData.forecast[i].c);
      allData.forecast[i].windDir = this.averageWinDir(allData.forecast[i].windDir)
    }
    this.data.forecastData = allData.forecast;
    this.data.titleMes = allData.title;
    app.globalData.data = allData;

    this.setData({
      polDescribe: this.data.polDescribe,
      forecastData: this.data.forecastData,
      titleMes: this.data.titleMes
    })
    
    let result = this.getOption(allData.forecast);
    this.data.chartOption = result;
    // 获取组件 初始化图表
    for (let i = 1; i <= result.length; i++) {
      this.selectComponent('#mychart-dom-bar' + i).init((canvas, width, height) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height
        });
        chart.setOption(result[i - 1]);
        return chart;
      });
    }
  },

  getCloudPic(aqi){
    let imgSrc;
    if (aqi < 51) {
      imgSrc = '../img/cloud1.png'
    } else if (50 < aqi && aqi < 101) {
      imgSrc ='../img/cloud2.png'
    } else if (100 < aqi && aqi < 151) {
      imgSrc ='../img/cloud3.png'
    } else if (150 < aqi && aqi < 201) {
      imgSrc ='../img/cloud4.png'
    } else if (200 < aqi && aqi < 301) {
      imgSrc ='../img/cloud5.png'
    } else {
      imgSrc ='../img/cloud6.png'
    }
    return imgSrc
  },

  getOption(apiData) {
    let optionArr = [];
    let optionArr1 = [];
    for (let i = 0; i < 2; i++) {
      optionArr[i] = {
        grid: {
          top: '40%',
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
        clickable: false,
        animation: false,
        series: [{
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].wind,false)[0]
        }, {
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].wind, false)[1],
          label:{
            show: true,
            position: 'insideBottom',
            distance:0,
            color: '#000000'
          }, 
          z: 3
        }, {
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].wind, false)[2]
        }]
      }
    }
    for (let i = 0; i < 2; i++) {
      optionArr1[i] = {
        grid: {
          top: '40%',
          bottom: '0%',
          left: '0%',
          right: '0%'
        },
        xAxis: {
          data: ["", "", "", "", "", "", "", ""],
          show: false
        },
        yAxis: {
          show: false,
          scale: true
        },
        animation: false,
        clickable: false,
        series: [{
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].c, true)[0],
        }, {
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].c, true)[1]
        }, {
          type: 'bar',
          barGap: 0,
          data: publicMethod.handleChartData(apiData[i].c, true)[2]
        }]
      }
    }
    return [optionArr[0], optionArr1[0], optionArr[1], optionArr1[1]];
  },

  averageWinDir(arr) {
    let item = [];
    for (let j = 0; j < 8; j++) {
      let t = Math.round(arr[1 + 3 * j])
      item.push(t);
    }
    return item
  },

  averageTepm(arr){
    let item = [];
    for (let j = 0; j < 8; j++) {
      let t = Math.round(arr[1 + 3 * j])
      item.push({
        color:'#000000',
        t:t
      });
    }
    let min = 100;
    let max = -100;
    for (let i = 0; i < item.length; i++) {
      if (item[i].t < min) {
        min = item[i].t
      }
      if (item[i].t > max) {
        max = item[i].t
      }
    }
    for (let i = 0; i < item.length; i++) {
      if (item[i].t == min) {
        item[i].color = '#4444FF'
      }
      if (item[i].t == max) {
        item[i].color = '#FF4444'
      }
    }
    return item
  },

  handleTitle(aqi){
    if (aqi < 51) {
      this.data.polDescribe = {
        text: 'Good',
        color: '#009966'
      }
    } else if (50 < aqi && aqi < 101) {
      this.data.polDescribe = {
        text: 'Moderate',
        color: '#ffde33'
      }
    } else if (100 < aqi && aqi < 151) {
      this.data.polDescribe = {
        text: 'Unhealthy for Sensitive Groups',
        color: '#ff9933'
      }
    } else if (150 < aqi && aqi < 201) {
      this.data.polDescribe = {
        text: 'Unhealthy',
        color: '#cc0033'
      }
    } else if (200 < aqi && aqi < 301) {
      this.data.polDescribe = {
        text: 'Very Unhealthy',
        color: '#660099'
      }
    } else if (300 < aqi) {
      this.data.polDescribe = {
        text: 'Hazardous',
        color: '#7e0023'
      }
    }
  },
  
  onShow(){
    if (position[0] !== app.globalData.geo[0] && position[1] !== app.globalData.geo[1]){
      position = app.globalData.geo
      publicMethod.getDailyWeather(app.globalData.geo, this.handelDailyWeather)
      publicMethod.getWeather(app.globalData.geo, this.getIcon)
      publicMethod.getData(app.globalData.geo, this.handleData)
    }
  },

  swichToForecast(){
    wx.switchTab({
      url: '../forecast/forecast'
    })
  },

  handelDailyWeather(data) {
    if(app.globalData.catches!==true){
      wx.setStorage({
        key: 'aqi_dailyWea',
        data: data,
      })
    }
    
    if (data.day.phrase[0]==null){
      data.day.phrase[0] = data.night.phrase[0]
    }

    for (let i = 0; i < data.day.phrase.length;i++){
      this.data.dailyWeather.push({
        phrase: data.day.phrase[i],
        sunrise: data.sunrise[i].substring(11, 16),
        sunset: data.sunset[i].substring(11, 16),
        weaIcon: this.getImgSrc(data.day.phrase[i], 3)
      })
    }
    app.globalData.dailyWeather = this.data.dailyWeather;
    this.setData({
      dailyWeather: this.data.dailyWeather
    })
  },

  getWeaMes(weather){
    let index = Number(weather.processTime[0].substring(11,13));
    if(index==0) index=24;
    let curWea = weather.phrase[index];
    this.setData({
      currentWeaSRC: this.getImgSrc(curWea, index / 3)
    })
    let first = [];
    let second = [];
    let result = [[],[]];
    for (let i = 0; i < index; i++){
      first.push('')
    }
    for (let i = index; i < 24; i++) {
      first.push(weather.phrase[i])
    }
    for (let i = 24; i < 48; i++) {
      second.push(weather.phrase[i])
    }
    
    for(let i=0;i<8;i++){
      result[0].push(first[i*3+1]);
      result[1].push(second[i * 3 + 1])
    }
    
    for (let i = 0; i < 8; i++) {
      result[0][i] = this.getImgSrc(result[0][i],i);
      result[1][i] = this.getImgSrc(result[1][i],i);
    }
    return result;
  },

  //由天气描述得到天气图标
  getImgSrc(strings,index){
    if(strings=='') return;
    if (1 < index && index < 6) {
      index = '_d'
    } else {
      index = '_n'
    }

    if (strings.includes('Clear') || strings.includes('Sunny')) {
      strings = 'qing'
    } else if (strings.includes('Cloudy')) {
      if (strings == 'Cloudy' || strings.includes('Overcast')) {
        index = ''; strings = 'yin'
      } else {
        strings = 'duoyun'
      }
    } else if (strings.includes('Showers')) {
      index = ''; strings = 'zhenyu' 
    } else if (strings.includes('Drizzle')) {
      index = ''; strings = 'xiaoyu'
    }else if (strings.includes('Rain')) {
      index = ''
      if (strings.includes('Light')) {
        strings = 'xiaoyu'
      } else if (strings.includes('Moderate') || strings=='Rain') {
        strings = 'zhongyu'
      } else if (strings.includes('Heavy')) {
        strings = 'dayu'
      } else if (strings.includes('storm')){
        strings = 'baoyu'
      }
    } else if (strings.includes('Thunderstorms')) {
      index = ''; strings = 'leizhenyu'
    } else if ((strings.includes('Snow') && strings.includes('Rain')) || strings.includes('Sleet')) {
      strings = 'yujiaxue'
    } else if (strings.includes('Snow')) {
      index = ''
      if (strings.includes('Light')) {
        strings = 'xiaoxue'
      } else if (strings.includes('Moderate') || strings == 'Snow') {
        strings = 'zhongxue'
      } else {
        strings = 'daxue'
      } 
    } else if (strings.includes('Hail')) {
      strings = 'bingbao'
    } else if (strings.includes('Fog') || strings.includes('Haze')) {
      strings = 'wu'
    } else if (strings.includes('Sand')) {
      strings = 'yangsha'
    } else {
      strings = 'duoyun'
    }
    // console.log(strings)
    return strings = '../img/' + strings + index+ '.png'
  },
  // 下拉刷新
  onPullDownRefresh(){
    if (this.data.mask){
      this.setData({
        mask: false,
        width: '100%',
        height: '100%'
      })
    }
    let that = this;
    wx.getLocation({
      success: function (res) {
        let geo = [res.latitude, res.longitude]
        position = geo;
        app.globalData.geo = geo;
        publicMethod.getDailyWeather(geo, that.handelDailyWeather);
        publicMethod.getWeather(geo, that.getIcon);
        publicMethod.getData(geo, that.handleData);
      }
    })
    wx.showNavigationBarLoading();
  },

  onShareAppMessage: function (res) {
    let city = app.globalData.shareCity;
    return {
      title: `${city}的天气及空气`,
      path: '/pages/open/open'
    }
  },

  showMoon(date,index){
    let strDate = date.replace(/-/g,'');
    let result = this.getTranslate(strDate);
    let scale = app.globalData.windowWidth/375;
    let R = 12.4 * scale;
  
    const ctx = wx.createCanvasContext('myCanvas' + index)
    ctx.save()
    if (result.percent==0.5){
      ctx.beginPath()
      ctx.arc(R, R, R, 0, 2 * Math.PI)
      ctx.setFillStyle('#ffffff')
      ctx.fill()
      ctx.clip()

      ctx.beginPath()
      if (result.minus===false){
        ctx.arc(R, R, R, Math.PI / 2, 3 * Math.PI / 2)
      }else{
        ctx.arc(R, R, R, -Math.PI / 2, Math.PI / 2)
      }
      ctx.setFillStyle('#a7a7a7')
      ctx.fill()
      ctx.restore()
      ctx.draw()
    }else{
      
      let point = (2 * R * (1 - result.percent))
      let x1 = (point * point - 2 * R * R) / 2 / (point - R);
      let r = Math.abs(point - x1);

      let color1,color2;
      if (point - x1 > 0){
        if (result.minus == false){
          color1 = '#ffffff';
          color2 = '#a7a7a7'
        }else{
          color1 = '#a7a7a7';
          color2 = '#ffffff'
        }
      } else{
        if (result.minus == false) {
          color1 = '#a7a7a7';
          color2 = '#ffffff'
        } else {
          color1 = '#ffffff';
          color2 = '#a7a7a7'
        }
      }
      ctx.beginPath()
      ctx.arc(R, R, R, 0, 2 * Math.PI)
      ctx.setFillStyle(color1)
      ctx.fill()
      ctx.clip();
      ctx.beginPath()
      ctx.arc(x1, R, r, 0, 2 * Math.PI)
      ctx.setFillStyle(color2)
      ctx.fill()
      ctx.restore()
      ctx.draw()
     
    }
    
  },

  getTranslate(date){
    let newMoon = moon.newMoon;
    let fullMoon = moon.fullMoon;
    for (let i = 0; i < newMoon.length;i++){
      if (Number(newMoon[i]) > Number(date) && Number(fullMoon[i-1]) >= Number(date)){
        // console.log('上半月')
        let cycle = this.diffDate(fullMoon[i-1], newMoon[i - 1])
        let Dvalue = this.diffDate(date, newMoon[i - 1]);
        let result = {
          minus: false,
          percent: Dvalue / cycle
        }
        return result
      }
      if (Number(newMoon[i]) > Number(date) && Number(date) >= Number(fullMoon[i - 1])) {
        // console.log('下半月')
        let cycle = this.diffDate(newMoon[i], fullMoon[i - 1])
        let Dvalue = this.diffDate(date, fullMoon[i - 1]);
        let result = {
          minus: true,
          percent: Dvalue / cycle
        }
        return result
      }
    }
  },

  diffDate(month1, month2){
    if (month1.substring(4, 6) == month2.substring(4, 6)){
      return Number(month1.substring(6, 8)) - Number(month2.substring(6, 8))
    }else{
      let month = month2.substring(4, 6);
      if (month == '01' || month == '03' || month == '05' || month == '07' || month == '08' || month == '10' || month == '12') {
        return Number(month1.substring(6, 8)) + 31 - Number(month2.substring(6, 8))
      } else {
        return Number(month1.substring(6, 8)) + 30 - Number(month2.substring(6, 8))
      }
    }
  }
})
