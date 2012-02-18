#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <sys/types.h>
#include <sys/stat.h>

#include "hostadmin.h"
#include "const.h"

static void logmsg(const char *msg) {
	FILE *out = fopen("/tmp/x.log", "a");
	if(out) {
		fputs(msg, out);
		fputs("\n", out);
		fclose(out);
	}
}

static NPNetscapeFuncs* npnfuncs;

bool NP_HasProperty(NPObject *npobj, NPIdentifier propName){
	char * name = npnfuncs->utf8fromidentifier(propName);
	return strcmp(name, PROP_OS) == 0;
}

bool NP_GetProperty(NPObject *npobj, NPIdentifier propName, NPVariant *result){
	char * name = npnfuncs->utf8fromidentifier(propName);
	if(strcmp(name, PROP_OS) == 0){
		char * s = (char *)npnfuncs->memalloc(strlen(OSNAME));
		strcpy(s, OSNAME);
		STRINGN_TO_NPVARIANT(s, strlen(s) , *result);
		return true;
	}
	return false;
}

bool NP_HasMethod(NPObject *obj, NPIdentifier methodName){
	char * name = npnfuncs->utf8fromidentifier(methodName);
	//logmsg(name);
	return 
	(strcmp(name, METHOD_TIME) == 0 )
	|| (strcmp(name, METHOD_GET) == 0) 
	|| (strcmp(name, METHOD_SET) == 0);
}

char * ArgToStr(const NPVariant arg) {
	NPString str = NPVARIANT_TO_STRING(arg);
	char * r = (char *)malloc(str.UTF8Length + 1);
	strcpy(r, str.UTF8Characters);
	r[str.UTF8Length] = '\0';
	return r;
}


bool NP_Invoke(NPObject* obj, NPIdentifier methodName, const NPVariant *args, uint32_t argCount, NPVariant *result){
	char * name = npnfuncs->utf8fromidentifier(methodName);

	if(strcmp(name, METHOD_TIME) == 0 && argCount > 0 && 
	NPVARIANT_IS_STRING(args[0])
	){

		char * filename = ArgToStr(args[0]);
		struct stat * buf = (struct stat *)malloc(sizeof(struct stat));

		stat(filename, buf);
		free(filename);

		INT32_TO_NPVARIANT(buf->st_mtime, *result);
		free(buf);

		return true;
	}else 
	if(strcmp(name, METHOD_GET) == 0 && argCount > 0 &&
	NPVARIANT_IS_STRING(args[0])
	){
		char * filename = ArgToStr(args[0]);

		//logmsg(filename);
		FILE * f = fopen(filename, "r");
		if(f) {
			fseek(f, 0 , SEEK_END);
			long int size = ftell(f);

			rewind(f);

			char * buf = (char *)npnfuncs->memalloc(size);
			fread(buf, 1, size, f);
			fclose(f);

			//logmsg(buf);
			

			STRINGN_TO_NPVARIANT(buf, size, *result);

			//npnfuncs->memfree(buf);
		}

		free(filename);
		return true;
	}else 
	if(strcmp(name, METHOD_SET) == 0 && argCount > 1 &&
	NPVARIANT_IS_STRING(args[0]) && NPVARIANT_IS_STRING(args[1])
	){
		char * filename = ArgToStr(args[0]);
		char * content = ArgToStr(args[1]);

		FILE * f = fopen(filename, "w");
		if(f) {
			fputs(content, f);
			fclose(f);
		}

		free(filename);
		return true;
	}
	return false;	
}

static struct NPClass hostadmin_class = {
	NP_CLASS_STRUCT_VERSION,
	NULL,
	NULL,
	NULL,
	NP_HasMethod,
	NP_Invoke,
	NULL,
	NP_HasProperty,
	NP_GetProperty,
	NULL,
	NULL,
	NULL,
	NULL,
};
static NPObject * hostadmin_helper;

NP_EXPORT(char*)
NP_GetPluginVersion(){
	return "1.0.0";
}

NP_EXPORT(const char*)
NP_GetMIMEDescription(){
	return "application/x-hostadmin-helper::HostAdmin";
}

NPError NPP_New(NPMIMEType pluginType, NPP instance, uint16_t mode, int16_t argc, char* argn[], char* argv[], NPSavedData* saved) {
	return NPERR_NO_ERROR;
}
NPError NPP_Destroy(NPP instance, NPSavedData** save) {
	if(!hostadmin_helper) {
		npnfuncs->releaseobject(hostadmin_helper);
		hostadmin_helper = NULL;
	}
	return NPERR_NO_ERROR;
}

NPError NPP_GetValue(NPP instance, NPPVariable variable, void *value) {
	switch(variable) {
		case NPPVpluginScriptableNPObject:
			if(!hostadmin_helper) {
				hostadmin_helper = npnfuncs->createobject(instance, &hostadmin_class);
				npnfuncs->retainobject(hostadmin_helper);
			}
			*(NPObject **)value = hostadmin_helper;
			break;
		case NPPVpluginNeedsXEmbed:
			*((bool *)value) = true;
			break;
		default:
			return NPERR_GENERIC_ERROR;
	}
	return NPERR_NO_ERROR;
}

NP_EXPORT(NPError)
NP_Initialize(NPNetscapeFuncs* bFuncs, NPPluginFuncs* pFuncs){
	npnfuncs = bFuncs;


	pFuncs->version = (NP_VERSION_MAJOR << 8) | NP_VERSION_MINOR;
	pFuncs->size = sizeof(pFuncs);
	pFuncs->newp = NPP_New;
	pFuncs->destroy = NPP_Destroy;
	pFuncs->getvalue = NPP_GetValue;
	return NPERR_NO_ERROR;
}

NP_EXPORT(NPError)
NP_Shutdown(){
	return NPERR_NO_ERROR;
}

