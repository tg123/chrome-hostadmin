HostAdmin
=====================
Saving your time when you switch domain-ip mapping between different environment

Installing
-----------------------------
 * [Chrome WebStore](https://chrome.google.com/webstore/detail/oklkidkfohahankieehkeenbillligdn)
 * [Firefox AddonSite](https://addons.mozilla.org/firefox/addon/hostadmin)
 * [Download from Google Code](http://code.google.com/p/fire-hostadmin/downloads/list)


How HostAdmin analyze the Hosts file
------------------------------------
 [Syntax detail](http://code.google.com/p/fire-hostadmin/wiki/HOST_SYNTAX)
 
 * ``Common`` 

  IP DOMAIN [#COMMENT]
  
  *Example:*

        127.0.0.1       localhost #comment here

  NOTE: A line with a comment, 'hide' (case-insensitive), would be hiden from HostAdmin.
 
 * ``Grouping``

        #==== Groupname 
        
        # some mappings
        
        #====
   
   *Example:*
 
        #==== Project 1
        #127.0.0.1       localhost1
        127.0.0.1       localhost2
        127.0.0.1       localhost3
        #====
    
        #==== Project 2
        #127.0.0.1       localhost1
        #127.0.0.1       localhost2
        #127.0.0.1       localhost3
        #====
        
     
 * ``Bulk Hide``


        #hide_all_of_below 
        ...
        
        #All text here will be parsed as comment
        
        ...
   
  

WRITE Permission to Hosts File
------------------------------
*WRITE Permission* to Hosts is needed, thus HostAdmin could modify your Host Files.
XP users need NO additional setting.
Here is a guide for you to gain write privilege for Vista/7/Linux/MacOS users

http://code.google.com/p/fire-hostadmin/wiki/GAIN_HOSTS_WRITE_PERM

DNS Auto refreshing
-------------------

 * ``Firefox``

   HostAdmin borrowed code from [DNS flusher](https://addons.mozilla.org/en-US/firefox/addon/dns-flusher/) 
   to refresh dns when hosts file is modified.
   
 * ``Chrome``
   
   Since Chrome 21, Chrome will auto refresh dns by itself.
   More info at this [ticket](http://code.google.com/p/chromium/issues/detail?id=125599)
   
   > _KNOWN ISSUE_
   >  
   > DNS may not refresh as soon as hosts file changes due to a Chrome bug 
   > reused socket pools by domain even if hosts changes
   >
   > To avoid this, open chrome://net-internals/#sockets and flush your host
   >
   > More info at Chrome Bug [152906](https://code.google.com/p/chromium/issues/detail?id=152906) [268059](https://code.google.com/p/chromium/issues/detail?id=268059) [288061](https://code.google.com/p/chromium/issues/detail?id=288061)
 
 

 
