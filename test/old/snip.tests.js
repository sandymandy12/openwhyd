/* global describe, it */

/**
 * snippet tester
 * @author adrienjoly, whyd
 **/

var assert = require('assert');

describe('snip.httpRequest', function () {
  var snip = require('../../app/snip.js');
  //var testRunner = new require("../app/serverTestRunner.js").ServerTestRunner();

  var YOUTUBE_API_KEY = 'AIzaSyDEkfynWx7RpE5Vd0EVubBvl1qq4a6vjio';
  var YOUTUBE_VIDEO_ID = 'aZT8VlTV1YY';

  var url =
    'https://www.googleapis.com/youtube/v3/videos?id=' +
    YOUTUBE_VIDEO_ID +
    '&part=snippet&key=' +
    YOUTUBE_API_KEY;

  function handler(/*err, res*/) {
    //console.log("log", "http response:", res.error || res);
  }

  it('should return a non-null value for google.com', function () {
    assert(snip.httpRequest('https://google.com/', {}, handler));
  });

  it('should run simultaneous requests to google.com', function () {
    var url = 'https://google.com/';
    var req1 = snip.httpRequest(url, {}, handler);
    var req2 = snip.httpRequest(url, {}, handler);
    assert(req1 && req2);
  });

  it('should run simultaneous requests to googleapis.com, until limiter is set', function () {
    var req1 = snip.httpRequestJSON(url, {}, handler);
    var req2 = snip.httpRequestJSON(url, {}, handler);
    var success = req1 && req2;
    snip.httpSetDomain(/youtube\.com/, { queue: [] });
    assert(success);
    // AJ note: what's the meaning of this test? I forgot...
  });
  /*
	testRunner.addTest("youtube.com requests are run sequentially, after limiter is set", function(p, ee, cb){
		var req1 = snip.httpRequestJSON(url, {}, handler);
		var req2 = snip.httpRequestJSON(url, {}, function(err, res){
			var success = req1 && !req2 && res.data.id == "7vlElmIWmNo";
			cb(!success);
		});
	});

	testRunner.addTest("youtube.com requests call back exactly once per call, after limiter is set", function(p, ee, cb){
		var count = 0;
		function counter(cb){
			return function(err, res){
				++count;
				cb && cb(err, res);
			};
		}
		var req1 = snip.httpRequestJSON(url, {}, counter(function(err, res){
			if (count != 1){
				cb(true);
				cb = function(){};
			}
		}));
		var req2 = snip.httpRequestJSON(url, {}, counter(function(err, res){
			setTimeout(function(){
				var success = count == 2;
				cb(!success);
			}, 3000);
		}));
	});
  */
});
