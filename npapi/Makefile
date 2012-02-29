FLAG = -Wall -fPIC -DXP_UNIX=1 -O2
CC = cc

define SO
hostadmin.$(1).so: hostadmin.$(1).o
	$(CC) $(FLAG) -shared -m$(2) hostadmin.$(1).o -o hostadmin.$(1).so 

hostadmin.$(1).o: hostadmin.c hostadmin.h const.h
	$(CC) $(FLAG) -m$(2) -c -o hostadmin.$(1).o hostadmin.c
endef


all: hostadmin.x86.so hostadmin.amd64.so

$(eval $(call SO,x86,32))
$(eval $(call SO,amd64,64))


clean :
	rm -f hostadmin.*.o hostadmin.*.so

.PHONY: all clean
