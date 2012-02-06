#include <stdio.h>
#include <string.h>

#include <sys/types.h>
#include <sys/stat.h>

#include "hostadmin.h"

static void logmsg(const char *msg) {
	FILE *out = fopen("/tmp/x.log", "a");
	if(out) {
		fputs(msg, out);
		fclose(out);
	}
}

static NPNetscapeFuncs* npnfuncs;

const char * HELLO = "hostadmin";

bool NP_HasMethod(NPObject *obj, NPIdentifier methodName){
	return true;
}

bool NP_Invoke(NPObject* obj, NPIdentifier methodName, const NPVariant *args, uint32_t argCount, NPVariant *result){
	logmsg("mv2\n");
	//char *name = npnfuncs->utf8fromidentifier(methodName);
	//logmsg(name);

	//char * h = (char *)npnfuncs->memalloc(strlen(HELLO));
	//h[0] = 'h';
	//h[1] = 0;
	//logmsg("mv3\n");
	//strcpy(h, HELLO);
	//STRINGN_TO_NPVARIANT(h, strlen(HELLO), *result);
	//BOOLEAN_TO_NPVARIANT(true, *result);
	struct stat * buf = (struct stat *)npnfuncs->memalloc(sizeof(struct stat));

	stat("/etc/hosts", buf);
	INT32_TO_NPVARIANT(buf->st_mtime, *result);
	return true;	
}

static struct NPClass hostadmin_class = {
	NP_CLASS_STRUCT_VERSION,
	NULL,
	NULL,
	NULL,
	NP_HasMethod,
	NP_Invoke,
	NULL,
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
			logmsg("v2\n");
			if(!hostadmin_helper) {
				hostadmin_helper = npnfuncs->createobject(instance, &hostadmin_class);
				npnfuncs->retainobject(hostadmin_helper);
			}
			*(NPObject **)value = hostadmin_helper;
			break;
		case NPPVpluginNeedsXEmbed:
			logmsg("v6\n");
			*((bool *)value) = true;
			break;
		default:
			logmsg("v3\n");
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

