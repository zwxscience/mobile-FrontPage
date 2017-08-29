var visitCount = null;

(function () {
    loadVisit();

    var AUTHOR = {
        XIANZHE: 'xianzhe',
        ME: 'me'
    };

    var TYPING_MSG_CONTENT = "<div class='dot'></div><div class='dot'></div><div class='dot'></div>";

   // let msgSendingHandler = null;

    var vm = new Vue({
        el: '#mobile',

        data: {
            messages: [],
            dialogs: null,
            lastDialog: null,
            msgChain: Promise.resolve(),
            isXianzheTyping: false,
            nextTopics: [],
            hasPrompt: false,
            latestMsgContent: null
        },

        mounted:function () {
            $.getJSON('./assets/funnyDialog.json', function(data){
                vm.dialogs = data;

                vm.nextTopics = vm.dialogs.fromUser;

                vm.appendDialog('0000');
            });
        },

        methods: {
            appendDialog: function(id) {
                if (typeof id === 'object' && id.length > 0) {
                    id.forEach(function(id){return vm.appendDialog(id);});
                    return;
                }
                else if (id == null) {
                    this.lastDialog.responses = null;
                    return;
                }

                this.isXianzheTyping = true;

                var dialog = this.getDialog(id);

                getRandomMsg(dialog.details)
                    .forEach(function(content){
                       return vm.msgChain = vm.msgChain
                            .then(function() {return delay(700)})
                            .then(function() {return vm.sendMsg(content, AUTHOR.XIANZHE)});
                    });

                return dialog.nextXianzhe
                    ? vm.appendDialog(dialog.nextXianzhe)
                    : vm.msgChain.then(function(){
                        vm.lastDialog = dialog;
                        vm.isXianzheTyping = false;
                    });
            },

            sendMsg: function(message, author) {
                switch (author) {
                    case 'me':
                        return this.sendUserMsg(message);
                    default:
                        return this.sendFriendMsg(message, author);
                }
            },

            sendFriendMsg: function(message, author) {
                var content = getRandomMsg(message);
                var length = content.replace(/<[^>]+>/g,"").length;
                var isImg = /<img[^>]+>/.test(content);
                var isTyping = length > 5 || isImg;
				
                var msg = {
                    author: author,
                    content: isTyping ? TYPING_MSG_CONTENT : content,
                    isImg: isImg
                };
                this.messages.push(msg);

                if (isTyping) {
                    this.markMsgSize(msg,null);
                    setTimeout(updateScroll);

                    return delay(Math.min(100 * length, 2000))
                        .then(function(){
                            return vm.markMsgSize(msg, content);
                        })
                        .then(function(){return delay(150)})
                        .then(function(){
                            msg.content = content;
                            onMessageSending();
                        });
                }

                onMessageSending();

                return Promise.resolve();
            },

            sendUserMsg: function(message) {
                this.messages.push({
                    author: AUTHOR.ME,
                    content: message
                });

                onMessageSending();

                return Promise.resolve();
            },

            markMsgSize:function(msg, content) {
                this.latestMsgContent = content || msg.content;

                return delay(0)
                    .then(function() { return msg.isImg && onImageLoad($('#mock-msg img'))})
                    .then(function(){
                        Object.assign(msg, getMockMsgSize());
                        //vm.messages = [...vm.messages];
						vm.messages = vm.messages.splice(',');
						
                    });
            },

            getDialog: function(id) {
                var dialogs = this.dialogs.fromXianzhe
                    .filter(function(dialog){return dialog.id === id});
                return dialogs ? dialogs[0] : null;
            },
			
            getDialogFromUser: function(id) {
                var dialogs = this.dialogs.fromUser
                    .filter(function(dialog){return dialog.id === id});
                return dialogs ? dialogs[0] : null;
            },

            togglePrompt: function(toShow) {
                if (this.isXianzheTyping) {
                    return;
                }

                this.hasPrompt = toShow;
            },

            respond: function(response) {
                return this.say(response.content, response.nextXianzhe);
            },

            ask: function(fromUser) {

                var content = getRandomMsg(fromUser.details);
                return this.say(content, fromUser.nextXianzhe);
            },

            say: function(content, dialogId) {
                this.hasPrompt = false;

                return delay(200)
                    .then(function() { vm.sendMsg(content, AUTHOR.ME);})
                    .then(function() {return delay(300)})
                    .then(function() {vm.appendDialog(dialogId);});
            }
        }
        });

    function loadVisit() {
        $.ajax({
            url: 'http://www.zhangweixiang.com/visitInfo.ashx?method=get&from=mobile',
	    dataType: 'jsonp',
            timeout: 1000 * 3, // 3 sec
	    jsonp: "callback",  
    	    jsonpCallback: "jsonpCallback",
            success: function(data) {
                processPageView(data);
            },
            error: function(xhr,status,error) {
                console.log('Failed to get page view from my site!');	
            }
        });

    }
    function processPageView(rows) {
        if (rows == undefined) {
            return;
        }
        var queryId = window.location.pathname.indexOf('?');
        var mainPath = queryId >= 0 ? window.location.pathname.slice(0, queryId) : window.location.pathname;
        mainPath = mainPath == "/"? window.location.href:mainPath;
        var myPath = mainPath;
        if (myPath) {
                var len = rows.length;
                var cnt = 0;
                for (var i = 0; i < len; ++i) {
                    if(rows[i].Page === null) continue;
                    var thatPath = rows[i].Page["@URL"];
                    var queryId = thatPath.indexOf('?');
                    var mainPath = queryId >= 0 ? thatPath.slice(0, queryId) : thatPath;
                    if ((thatPath === myPath || mainPath === myPath 
                            || mainPath === myPath + 'index.html' 
                            || myPath === mainPath + 'index.html') && rows[i].Page["@visitCount"]!= null) {
                        cnt += parseInt(rows[i].Page["@visitCount"]);
                    }
                }
                visitCount = cnt;
        }

    }
    function     dealContent(content)
	{
		   if(content == "诶，你来啦？"&& visitCount != null)
		   { 
				content += "你可是这里第"+ visitCount +"个过来的呢";
				return content;
			
		   }
		   else
		   {
			   return content;
		   }
	}
    /**
     * get a random message from message array
     */
    function getRandomMsg(messages) {
        // single item
        if (typeof messages === 'string' || !messages.length) {
            return dealContent(messages);
        }

        var id = Math.floor(Math.random() * messages.length);
        return messages[id];
    }


    /**
     * UI updating when new message is sending
     */
    function onMessageSending() {
        setTimeout(function() {
            // update scroll position when vue has updated ui
            updateScroll();

            var $latestMsg = $('#mobile-body-content .msg-row:last-child .msg');

            // add target="_blank" for links
            $latestMsg.find('a').attr('target', '_blank');

            // update scroll position when images are loaded
            onImageLoad($latestMsg).then(updateScroll);
        });
    }

    function updateScroll() {
        var $chatbox = $('#mobile-body-content');

        var distance = $chatbox[0].scrollHeight - $chatbox.height() - $chatbox.scrollTop();
        var duration = 250;
        var startTime = Date.now();

        requestAnimationFrame(function step() {
            var p = Math.min(1, (Date.now() - startTime) / duration);
            $chatbox.scrollTop($chatbox.scrollTop() + distance * p);
            p < 1 && requestAnimationFrame(step);
        });
    }

    function delay(amount) {
        return new Promise(function(resolve) {
            setTimeout(resolve, amount);
        });
    }

    function getMockMsgSize() {
        var $mockMsg = $('#mock-msg');
        return {
            width: $mockMsg.width(),
            height: $mockMsg.height()
        };
    }

    function onImageLoad($img) {
        return new Promise(function(resolve) {
            $img.one('load', resolve)
                .each(function(index, target){
                    // trigger load when the image is cached
                    target.complete && $(target).trigger('load');
                });
        });
    }

})();
