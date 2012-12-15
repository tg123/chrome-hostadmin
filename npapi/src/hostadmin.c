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
	return 
		strcmp(name, PROP_OS) == 0 
		|| strcmp(name, PROP_WHERE) == 0 ;
}

bool NP_GetProperty(NPObject *npobj, NPIdentifier propName, NPVariant *result){
	char * name = npnfuncs->utf8fromidentifier(propName);
	if(strcmp(name, PROP_OS) == 0){
		size_t l = strlen(OSNAME);
		char * s = (char *)npnfuncs->memalloc(l + 1);
		memcpy(s, OSNAME, l);
		s[l] = '\0';
		STRINGN_TO_NPVARIANT(s, l, *result);
		return true;
#ifdef XP_WIN
	}else if(strcmp(name, PROP_WHERE) == 0){
		char * buf = (char *)npnfuncs->memalloc(MAX_PATH);
		GetSystemDirectory(buf, MAX_PATH + 1);
		STRINGN_TO_NPVARIANT(buf, strlen(buf) , *result);
		return true;
#endif
	}
	return false;
}

bool NP_HasMethod(NPObject *obj, NPIdentifier methodName){
	char * name = npnfuncs->utf8fromidentifier(methodName);
	//logmsg(name);
	return 
	(strcmp(name, METHOD_TIME) == 0 )
	|| (strcmp(name, METHOD_GET) == 0) 
	|| (strcmp(name, METHOD_SET) == 0)
	;
}

char * ArgToStr(const NPVariant arg) {
	NPString str = NPVARIANT_TO_STRING(arg);
	char * r = (char *)malloc(str.UTF8Length + 1);
	memcpy(r, str.UTF8Characters, str.UTF8Length);
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
			memset(buf, 0, size);
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
		bool succ = false;
		if(f) {
			fputs(content, f);
			succ = ferror(f);
			fclose(f);
		}

		free(filename);
		free(content);

		BOOLEAN_TO_NPVARIANT(succ, *result);
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

const char*
NP_GetMIMEDescription(){
	return MIMETYPE_S;
}

NPError NPP_New(NPMIMEType pluginType, NPP instance, uint16_t mode, int16_t argc, char* argn[], char* argv[], NPSavedData* saved) {
    
    
#ifdef __APPLE_CC__
	NPBool supportsCoreGraphics = false;
	if (npnfuncs->getvalue(instance, NPNVsupportsCoreGraphicsBool, &supportsCoreGraphics) == NPERR_NO_ERROR && supportsCoreGraphics) {
		npnfuncs->setvalue(instance, NPPVpluginDrawingModel, (void*)NPDrawingModelCoreGraphics);
	}

	NPBool supportsCocoaEvents = false;
	if (npnfuncs->getvalue(instance, NPNVsupportsCocoaBool, &supportsCocoaEvents) == NPERR_NO_ERROR && supportsCocoaEvents) {
		npnfuncs->setvalue(instance, NPPVpluginEventModel, (void*)NPEventModelCocoa);
	}
#endif
    
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


void HookbFuncs(NPNetscapeFuncs* bFuncs){
	npnfuncs = bFuncs;
}

void HookpFuncs(NPPluginFuncs* pFuncs){
	pFuncs->version = (NP_VERSION_MAJOR << 8) | NP_VERSION_MINOR;
	pFuncs->size = sizeof(pFuncs);
	pFuncs->newp = NPP_New;
	pFuncs->destroy = NPP_Destroy;
	pFuncs->getvalue = NPP_GetValue;
}



#ifdef XP_UNIX
NP_EXPORT(NPError)
NP_Initialize(NPNetscapeFuncs* bFuncs, NPPluginFuncs* pFuncs){
	HookbFuncs(bFuncs);
	HookpFuncs(pFuncs);
	return NPERR_NO_ERROR;
}

//#elif XP_WIN
#else
NPError OSCALL 
NP_GetEntryPoints(NPPluginFuncs* pFuncs) {
	HookpFuncs(pFuncs);
	return NPERR_NO_ERROR;
}

NPError OSCALL 
NP_Initialize(NPNetscapeFuncs* bFuncs) {
	HookbFuncs(bFuncs);
	return NPERR_NO_ERROR;
}
#endif

#ifdef XP_UNIX
NP_EXPORT(NPError)
//#elif XP_WIN
#else
NPError OSCALL
#endif
NP_Shutdown(){
	return NPERR_NO_ERROR;
}

