//app.js
App({
  onLaunch: function () {
    let that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.globalData.windowWidth = res.windowWidth;
      }
    })
  },
  globalData: {
    windowWidth: 375,
    data:{},
    nearest:[],
    geo: [0,0],
    catches: false,
    dailyWeather:null,
    shareCity:''
  }
})