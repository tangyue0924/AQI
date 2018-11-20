
const TSLOT = 8; //一天分为8个时间段（3小时）
const DAYNUM = 6; //取6天的数据

const handleNavigationBar = title => {
  wx.setNavigationBarTitle({
    title: title
  })
}

function getIdx(geo){
  return new Promise(function (resolve, reject) {
    wx.request({
      url: `https://ttianquan.com/position`,
      method: 'POST',
      data: {
        lat: geo[0],
        lon: geo[1]
      },
      success: function (res) {
        if (res.data.status === 'ok') {
          resolve(res.data.data.idx);
        } else {
          getIdx(geo)
        }
      }
    })
  })
}

function getForecastMes(idx) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: `https://ttianquan.com/forecast`,
      method: 'POST',
      data: {
        idx: idx
      },
      success: function (res) {
        if (res.statusCode === 200) {
          resolve(res.data.rxs.obs[0].msg)
        } else {
          wx.showToast({
            title: res.data.errMsg + ',请下拉重试',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  })
}

const getData = function(geo,cb) {
  wx.showLoading({
    title: '加载中',
  })
  // 获取idx
  getIdx(geo).then(idx=>{
    getForecastMes(idx).then(data=>{
      wx.hideLoading() // 停止loading
      wx.hideNavigationBarLoading(); // 隐藏导航栏加载框
      wx.stopPullDownRefresh(); // 停止下拉动作
      cb(data)
    })
  })
}

const getWeather = function (geo,cb) {
  wx.request({
    url: `https://ttianquan.com/weather`,
    method: 'POST',
    data: {
      lat: geo[0],
      lon: geo[1]
    },
    success: function (res) {
      // console.log(res)
      wx.setStorage({
        key: 'aqi_weather',
        data: res.data.vt1hourlyForecast,
      })
      cb(res.data.vt1hourlyForecast)
    }
  })  
}

const getDailyWeather = function (geo, cb) {
  wx.request({
    url: `https://ttianquan.com/dailyWeather`,
    method: 'POST',
    data: {
      lat: geo[0],
      lon: geo[1]
    },
    success: function (res) {
      wx.setStorage({
        key: 'aqi_dailyWea',
        data: res.data.vt1dailyforecast,
      })
      cb(res.data.vt1dailyforecast)
    }
  })
}

const distillDate = (obj)=>{
  let dateArr = [];
  for (let i = 0; i < obj.length; i++) {
    dateArr[i] = obj[i].t.substring(0, 10)
  }
  let temp = Array.from(new Set(dateArr));
  let today = formatterDate(new Date());
  
  let index = temp.indexOf(today);
  temp.splice(0, index)
  return temp
}

const analysisData = function (obj){
  //title的数据
  let city = obj.city.name.split(',')
  city = city[city.length - 1];

  let titleMes = {
    curTimeaqi: obj.aqi,
    city: city,
    idx: obj.city.idx,
    geo: obj.city.geo,
    updateT: obj.time.s.en.time,
    primaryP: obj.dominentpol,
    nowW:{
      w:'',
      t:''
    }
  }
  /**
    aqi数据处理(obj.forecast.aqi)
    obj.forecast.aqi共72/64条9/8天数据，当天是从第3/2天开始，取6天数据；
    处理数据的结果如下格式：（其中一天）
  **/
  //6天的数据
  let result = [];
  for (let i = 0; i < DAYNUM; i++){
    result.push({
      aqi: 0,
      minAqi: [],
      maxAqi: [],
      wind:[],
      c:[],
      windDir:[],
      minTemp:0,
      maxTemp: 0,
      minAqiClassName:[],
      maxAqiClassName: []
    })
  }

  let today = formatterDate(new Date());
  let aqiData = obj.forecast.aqi;
  let index;    //obj.forecast.aqi[index* TSLOT]就是当天第一条数据;
  for (let i = 0; i < aqiData.length; i++) {
    if (today == aqiData[i].t.substring(0, 10)) {
      index = Math.floor(i / 8)
      break
    }
  }
  // 第一条数据的时间点
  // console.log(aqiData)
  let firstTime = aqiData[index * TSLOT].t;
  for (let i = index * TSLOT; i < (aqiData.length - index * TSLOT-1); i++) {
    let a = Math.floor((i - index * TSLOT)/8);
    result[a].minAqi.push(aqiData[i].v[0])
    result[a].maxAqi.push(aqiData[i].v[1])
    result[a].maxAqiClassName.push(getClassName(aqiData[i].v[1]))
    result[a].minAqiClassName.push(getClassName(aqiData[i].v[0]))
  }
  
  for (let i = 0; i < result.length; i++) {
    let aqi = (getmin(result[i].minAqi) + getmax(result[i].maxAqi)) / 2;
    result[i].aqi = Math.round(aqi)
  }
  
  let windData = obj.forecast.wind;
  let windIndex;
  for (let i = 0; i < windData.length; i++) {
    if (firstTime == windData[i].t) {
      windIndex = i
      break
    }
  }

  /*titleMes nowW的赋值*/
  let updateT = obj.time.v.substring(0, 13);
  for (let i = 0; i < windData.length; i++) {
    if (windData[i].t.includes(updateT)) {
      titleMes.nowW.w = windData[i - windIndex].w[0];
      titleMes.nowW.t = windData[i - windIndex].c;
      break
    }
  } 


  for (let i = windIndex; i < (24 * DAYNUM + windIndex); i++) {
    let a = Math.floor((i - windIndex) / 24);
    result[a].wind.push(windData[i].w[0])
    result[a].c.push(windData[i].c)
    result[a].windDir.push(windData[i].w[2])
  }
  
  for (let i = 0; i < result.length; i++) {
    result[i].minTemp = getMinAndMax(result[i].c)[0],
    result[i].maxTemp = getMinAndMax(result[i].c)[1]
  }
  return { title: titleMes, forecast: result};
}

function getmin(arr){
  let min = 100000;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < min) {
      min = arr[i]
    }
  }
  return min
}
function getmax(arr) {
  let max = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i]
    }
  }
  return max
}

function getMinAndMax(arr) {
  let max = 0;
  let min = 10000;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i]
    }
    if (arr[i] < max) {
      min = arr[i]
    }
  }
  return [min,max]
}

function formatterDate(date){
  let year = date.getFullYear();
  let month = ('00'+(date.getMonth()+1));
  month = month.substring(month.length-2);
  let day = ('00' + date.getDate());
  day = day.substring(day.length - 2);
  return year + '-' + month + '-' + day;
}

const distillweek = (dateArr, aSpell)=>{
  let weekArr = [];
  let date;
  let weekLetter;
  let weekLetter1;
  weekLetter1 = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  weekLetter = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < dateArr.length; i++) {
    let dateArray = dateArr[i].split("-");
    date = new Date(dateArray[0], parseInt(dateArray[1] - 1), dateArray[2]);
    weekArr.push({
      aw: weekLetter1[date.getDay()],
      w: weekLetter[date.getDay()],
      d: dateArray[2]
    })
  }
  return weekArr
}

const getClassName = (aqi) => {
  if (aqi < 51) {
    return 'level1'
  } else if (50 < aqi && aqi < 101) {
    return 'level2'
  } else if (100 < aqi && aqi < 151) {
    return 'level3'
  } else if (150 < aqi && aqi < 201) {
    return 'level4'
  } else if (200 < aqi && aqi < 301) {
    return 'level5'
  } else if (300 < aqi) {
    return 'level6'
  }
}

const handleChartData = (arr, isTemp) => {
  let item = [[], [], []];
  for (let i = 0; i < item.length; i++) {
    for (let j = 0; j < 8; j++) {
      if (isTemp) {
        item[i].push({
          value: arr[i + 3 * j],
          itemStyle: {
            color: tempColor(arr[i + 3 * j])
          }
        })
      } else {
        item[i].push({
          value: arr[i + 3 * j].toFixed(0),
          itemStyle: {
            color: windColor(arr[i + 3 * j])
          }
        })
      }
    }
  }
  return item;
}

function tempColor(t){
  let color;
  if (t < -10) {
    color = '#f5f500'
  } else if (-10 <= t && t < 0) {
    color = '#f6e400'
  } else if (0 <= t && t < 8) {
    color = '#f4cf05'
  } else if (8 <= t && t < 15) {
    color = '#f2c100'
  } else if (15 <= t && t < 20) {
    color = '#f6ac00'
  } else if (20 <= t && t < 25) {
    color = '#f59604'
  } else if (25 <= t && t < 30) {
    color = '#f77d00'
  } else if (30 <= t && t < 35) {
    color = '#f36400'
  } else if (35 <= t) {
    color = '#f50002'
  }
  return color;
}


function windColor(t){
  let color;
  if (t < 1) {
    color = '#b8cee1'
  } else if (1 <= t && t < 2) {
    color = '#afcae2'
  } else if (2 <= t && t < 3) {
    color = '#acc8e4'
  } else if (3 <= t && t < 4) {
    color = '#9fbeec'
  } else if (4 <= t && t < 5) {
    color = '#97b8f0'
  } else if (5 <= t && t < 6) {
    color = '#91b3f4'
  } else if (6 <= t && t < 7) {
    color = '#84aafc'
  } else if (7 <= t) {
    color = '#7ea6fb'
  }
  return color;
}

module.exports = {
  handleNavigationBar: handleNavigationBar,
  getData: getData,
  distillDate: distillDate,
  distillweek: distillweek,
  getWeather: getWeather,
  analysisData: analysisData,
  handleChartData: handleChartData,
  getDailyWeather: getDailyWeather
}
