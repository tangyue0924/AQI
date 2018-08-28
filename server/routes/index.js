var express = require('express');
var path = require('path');
var router = express.Router();
var request = require('request')
var request_timer = null;

router.post('/position', function (req, res, next) {
    let timeout = false;
    if(request_timer!=null){
        clearTimeout(request_timer);
    }
    response_timer = res.setTimeout(6000, ()=>{
        if(!timeout){
            timeout = true;
            return res.json({ status: 408, mes: '请求超时' });
        }
     });
    
    let url = `https://api.waqi.info/feed/geo:${req.body.lat};${req.body.lon}/?token=fb3955d54407a523cf9ef7e026d3b92d49503703`
    
    request({
        url: url,  
        method: "GET",
        headers: {
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        } 
    }, function (error, response, body) {
        if(request_timer!=null){
            clearTimeout(request_timer);
        }
        if (!error && response.statusCode == 200) {
            if(!timeout){
                timeout = true
                res.send(body)
            }
        }
    });
});

router.post('/forecast', function (req, res, next) {
    let timeout = false;
    if(request_timer!=null){
        clearTimeout(request_timer);
    }
    response_timer = res.setTimeout(12000, ()=>{
        if(!timeout){
            timeout = true;
            return res.json({ status: 408, mes: '请求超时' });
        }
    });
    let url = `https://api.waqi.info/api/feed/@${req.body.idx}/obs.en.json`
    request({
        url: url,
        method: "GET",
        headers: {
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        } 
    }, function (error, response, body) {
        if(request_timer!=null){
            clearTimeout(request_timer);
        }
        if (!error && response.statusCode == 200) {
            if(!timeout){
                timeout = true
                res.send(body)
            }
        }
    });
});

router.post('/map', function (req, res, next) {
    let url = `https://api.waqi.info/mapq/bounds/?bounds=${req.body.slatitude},${req.body.slongitude},${req.body.nlatitude},${req.body.nlongitude}&inc=placeholders&k=_2Y2EvEhx2DVkdMysJSCJWXmpjfAM+LSdXFngZZg==&_=`
    request({
        url: url,
        method: "GET",
        headers: {
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        } 
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body) 
        }
    });
});

router.post('/weather', function (req, res, next) {
    let url = `https://api.weather.com/v2/turbo/vt1hourlyForecast?apiKey=d522aa97197fd864d36b418f39ebb323&format=json&geocode=${req.body.lat}%2C${req.body.lon}&language=en-US&units=e`
    request({
        url: url,
        method: "GET",
        headers: {
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        } 
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body)
        }
    });
});

router.post('/dailyWeather', function (req, res, next) {
    let url = `https://api.weather.com/v2/turbo/vt1dailyforecast?apiKey=d522aa97197fd864d36b418f39ebb323&format=json&geocode=${req.body.lat}%2C${req.body.lon}&language=en-US&units=e`
    request({
        url: url,
        method: "GET",
        headers: {
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        } 
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body)
        }
    });
});
module.exports = router;
