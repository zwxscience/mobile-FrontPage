setTimeout(function() {
	var queryId = window.location.pathname.indexOf('?');
	var mainPath = queryId >= 0 ? window.location.pathname.slice(0, queryId) : window.location.pathname;
	mainPath = mainPath == "/"? window.location.href:mainPath;//frontPage
	var title = ($(document).attr("title") == null) ? $('title').text() : $(document).attr("title");
		 $.ajax({
			url: 'http://www.zhangweixiang.com/visitinfo.ashx?url='+mainPath+'&from=mysite&title=' + $.trim(title),
			dataType: 'jsonp',
			timeout: 1000 * 3, // 3 sec
			jsonp: "callback",  
    			jsonpCallback: "jsonpCallback",
			success: function(data) {
				console.log('update site visit result:'+data);
			},
			error: function(xhr,status,error) {
				// if fail to get up-to-date data from mysite, get cached local version
				console.log('Failed to get page view from my site!');	
			}
		});	
        }, 2000);
