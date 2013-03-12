Contributing to HostAdmin
=========================
Patchs are welcomed. Follow instructions below to make some change to HostAdmin

Envirment
---------

### Getting sources

		
	git clone https://github.com/tg123/chrome-hostadmin.git
		


### Firefox

 1. Create your dev profile. You can get detail from [Setting up an extension development environment](https://developer.mozilla.org/en/docs/Setting_up_extension_development_environment)

 1. Link HostAdmin to Firefox dev profile (Linux)

		
	ln -s /path/to/chrome-hostadmin/ ~/.mozilla/firefox/YOURDEVPROFILENAME/extensions/\{bd54afa8-b14a-4d7a-aecf-37e34e882796\}


 1. Start dev firefox with dev profile


	firefox -P dev



### Chrome

 1. Open [chrome://extensions/](chrome://extensions/)
 1. Enable `Developer mode` and use `Load unpacked extension` to load HostAdmin. You can get more help from [Getting Started: Building a Chrome Extension](https://developer.chrome.com/extensions/getstarted.html)

 1. NPAPI (Optional)


    You may want edit NPAPI, you can find source at `npapi/src`
    * Build on Linux (gcc, Just make to build hostadmin.so)
    * Mac (open hostadmin.xcodeproj with XCode, Command + B to build hostadmin.plugin)
    * Windows (open hostadmin.sln with Visual Studio Express 2008, build .dll)



Build Distributions
-------------------

You can build .xpi(Firefox) and .zip(Chrome) using dist script. *Notice:* If you are building on Mac, you need `gnu coreutils` ratcher built-in `BSD coreutils`. 


Build all 

	./dist 


Clean up
		
	./dist clean


Sometimes, you may want .crx version.

	./dist-chrome.sh crx
