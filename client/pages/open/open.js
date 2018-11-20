// pages/open/open.js
let publicMethod = require("../../utils/util");
let app = getApp();
Page({
  data: {
    authorize: true
  },

  onReady: function (options) {
    // get data
    let time = wx.getStorageSync('aqi_time');
    let now = new Date().getTime();
    let that = this;
    if (now - time > 60*60*1000){
      wx.getLocation({
        success: function (res) {
          that.setData({
            authorize: true
          })
          let geo = [res.latitude, res.longitude];
          app.globalData.geo = geo;
          publicMethod.getData(geo, that.assign)
        },
        fail: function () {
          that.setData({
            authorize: false
          })
        }
      })
    }else{
      let data = wx.getStorageSync('aqi_data');
      let weather = wx.getStorageSync('aqi_weather');
      let dailyWeather = wx.getStorageSync('aqi_dailyWea')
      this.assign(data,true);
    }
  },
  //将接口数据赋值
  assign(data, catches) {
    if (catches===true){
      app.globalData.catches = true;
    }
    app.globalData.data = data;
    app.globalData.nearest = data.nearest;
    wx.switchTab({
      url: '../index/index',
    })
  },

  onPullDownRefresh() {
    let that = this;
    wx.getLocation({
      success: function (res) {
        that.setData({
          authorize: true
        })
        let geo = [res.latitude, res.longitude];
        app.globalData.geo = geo;
        publicMethod.getData(geo, that.assign)
      },
      fail: function () {
        that.setData({
          authorize: false
        })
      }
    })
  }
})