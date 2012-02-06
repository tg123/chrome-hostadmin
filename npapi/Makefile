all : hostadmin.o
	cc -shared hostadmin.o -o hostadmin.so

hostadmin.o: hostadmin.c hostadmin.h
	cc -Wall -fPIC -DXP_UNIX=1 -c -g hostadmin.c

clean :
	rm -f hostadmin.o hostadmin.so
