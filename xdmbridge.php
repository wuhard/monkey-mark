<!doctype html>
<html>
    <head>
        <title>Miniplay easyXDM Bridge for external games</title>
        <script type="text/javascript" src="https://ssl.minijuegosgratis.com/lechuck/js/easyxdm/json2.js"></script>
        <script type="text/javascript" src="https://ssl.minijuegosgratis.com/lechuck/js/easyxdm/easyXDM.min.js"></script>
        <script type="text/javascript">
            var newXhr = function(type, url) {
    			var xhr = false;
    			try {
    			   xhr = new XMLHttpRequest();
    			} catch(e) {}
    			if (xhr && "withCredentials" in xhr){
    			    xhr.open(type, url, true);
    			} else if (typeof XDomainRequest != "undefined"){
    			    xhr = new XDomainRequest();
    			    xhr.open(type, url);
    			    xhr.onload = function() {
    			    	this.readyState = 4;
    			    	if (this.onreadystatechange instanceof Function) this.onreadystatechange();
    			    };
    			} else if (xhr) {
    				xhr.open(type, url, true);
    			};
    			return xhr;
    		};
            var proxy = new easyXDM.Rpc(/** The configuration */{
                local: "https://ssl.minijuegosgratis.com/lechuck/js/easyxdm/name.html",
                swf: "https://ssl.minijuegosgratis.com/lechuck/js/easyxdm/easyxdm.swf",
                onReady: function(){
                	/* Send hello message to enable communications */
                	proxy.hello({
	   					env_is_internal: false,
	   					env_parent: document.location.href
                	}, function (response) {/* callback ok */});
                }
            }, {
                local: {
                    get: function (callbackName,url) {
                        var xhr = newXhr("GET",url);
                    	if (xhr) {
        					xhr.onreadystatechange=function() {
        						if (xhr.readyState == 4/* && xhr.responseText!=""*/) {
        							proxy.getCallback(callbackName, xhr.responseText);
        						};
        					};
        					xhr.send(null);
        					return true;
                    	}
                        return false;
                    },
                    openBuyItems: function(url, name, options, origin){
                    	// Check that referrer match the origin
                           assertOrigin(origin);
                        // Open window
                            var win = window.open(url + '&int=0' + '#easyXDM_' + easyXDM.query.xdm_c + '_provider', name, options);
                            if (!win) {
                                proxy.buyItemsBlocked();
                            } else {
                                // Chrome popup blocker check
                                win.onload = function() {
                                    setTimeout(function() {
                                        if (win.screenX === 0)
                                           proxy.loginBlocked();
                                    }, 100);
                                };
                                win.focus();
                            }
                    },
                    openLogin: function(url, name, options, origin){
                        // Check that referrer match the origin
                            assertOrigin(origin);
                        // Open window
                            var win = window.open(url + '&int=0' + '#easyXDM_' + easyXDM.query.xdm_c + '_provider', name, options);
                            if (!win) {
                                proxy.loginBlocked();
                            } else {
                                // Chrome popup blocker check
                                win.onload = function() {
                                    setTimeout(function() {
                                        if (win.screenX === 0)
                                           proxy.loginBlocked();
                                    }, 100);
                                };
                                win.focus();
                            }
                    }
                },
                remote: {
                    hello: {},
                	buyItemsBlocked: {},
                	buyItemsCallback: {},
                    loginBlocked: {},
                    loginCallback: {},
                    getCallback: {}
                }
            });

            function assertOrigin(origin) {
            	var match = document.referrer.match( /^(https?\:\/\/([^\/]+))/ );
                if ( !match || match[1]!=origin ) throw Error("Forbidden"); // We block it: suspicious origin
            }

            function buyItemsCallback (items) {
    	    	proxy.buyItemsCallback(items, function() {}); // Pass the response to the parent (consumer)
    	    };

    	    function loginCallback(user_id,user_token) {
    	    	proxy.loginCallback(user_id,user_token, function() {}); // Pass the response to the parent (consumer)
    	    }

        </script>
    </head>
    <body>
    </body>
</html>