// pages/map/map.js
let handleNavigationBar = require("../../utils/util").handleNavigationBar;
let app = getApp();
Page({
  data: {
    nearest: {},
    markers: [],
    latitude:null,
    longitude:null,
    scale:13,
    hasMarkers:true
  },
  onLoad(){

    this.mapCtx = wx.createMapContext('map')
    //setNavigationBar
    handleNavigationBar('Air Pollution Map')

    this.setData({
      latitude: app.globalData.data.title.geo[0],
      longitude: app.globalData.data.title.geo[1]
    })
    //从全局变量取值
    this.data.nearest = app.globalData.nearest;
    //处理数据
    this.refresh(this.data.nearest)
  },
  addScale() {
    if (this.data.scale<18){
      this.data.scale++;
      this.setData({
        scale: this.data.scale
      })
    }
  },
  minusScale() {
    if (this.data.scale > 5) {
      this.data.scale--;
      this.setData({
        scale: this.data.scale
      })
    }
  },
  //视野改变
  regionchange(e) {
    console.log(e)
    if(e.type=='end'){
      let that = this;
      //获取当前地图的视野范围
      this.mapCtx.getRegion({
        success: function (res) {
          wx.request({
            url: `https://ttianquan.com/map`,
            method: 'POST',
            data: {
              slatitude: res.southwest.latitude,
              slongitude: res.southwest.longitude,
              nlatitude: res.northeast.latitude,
              nlongitude: res.northeast.longitude,
            },
            success: function (res) {
              that.changeMarkers(res.data)
            }
          })
        }
      })
    }
  },
 
  refresh(nearest){
    for (let i = 0; i < nearest.length;i++){
      nearest[i].color = this.getBgColor(nearest[i].aqi);
      if (nearest[i].aqi != '-') {
        this.data.markers.push({
          id: nearest[i].id,
          latitude: nearest[i].geo[0],
          longitude: nearest[i].geo[1],
          iconPath: '../img/map_mark.png',
          width: 40,
          height: 34,
          label: {
            content: nearest[i].aqi,
            color: '#ffffff',
            fontSize: 14,
            x: -20,
            y: -34,
            borderWidth: 2,
            borderRadius: 5,
            bgColor: nearest[i].color,
            padding: 6
          }
        })
      }
    }
   
    this.setData({
      markers:this.data.markers
    })
  },
  
  getBgColor(aqi) {
    if (aqi < 51) {
      return '#009966'
    } else if (50 < aqi && aqi < 101) {
      return '#ffde33'
    } else if (100 < aqi && aqi < 151) {
      return '#ff9933'
    } else if (150 < aqi && aqi < 201) {
      return '#cc0033'
    } else if (200 < aqi && aqi < 301) {
      return '#660099'
    } else if (300 < aqi) {
      return '#7e0023'
    }
  },

  markertap(e) {
    //通过id找nearest里对应的geo，赋值给全局变量
    for (let i = 0; i < this.data.markers.length;i++){
      if (e.markerId == this.data.markers[i].id){
        app.globalData.geo = [this.data.markers[i].latitude, this.data.markers[i].longitude];
      }
    }
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  changeMarkers(data){
    this.data.markers =[];
    for (let i = 0; i < data.length; i++) {
      data[i].color = this.getBgColor(data[i].aqi);
      if (data[i].aqi != '-') {
        this.data.markers.push({
          id: data[i].idx,
          latitude: data[i].lat,
          longitude: data[i].lon,
          iconPath: '../img/map_mark.png',
          width: 40,
          height: 34,
          label: {
            content: data[i].aqi,
            color: '#ffffff',
            fontSize: 14,
            x: -20,
            y: -34,
            borderWidth: 2,
            borderRadius: 5,
            bgColor: data[i].color,
            padding: 6
          }
        })
      }
    }
    this.setData({
      markers: this.data.markers
    })
  },
  onShareAppMessage: function (res) {
    let city = app.globalData.shareCity;
    return {
      title: `${city}的天气及空气`,
      path: '/pages/open/open',
      imageUrl: '../img/share.png'
    }
  }
})