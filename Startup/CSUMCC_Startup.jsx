// ============================================
// Script Name : CSUMCC_Startup
// Version     : v1.1
// 仕様        : AE起動時に removeDefScriptFiles → loadPreferences → clearCache を実行
//               Startupフォルダに配置して使用
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-31
// ============================================

// **** Main Script ****
// レンダーエンジン起動時は実行されない
if ( Folder.appPackage.name != "aerendercore.app" )
{
	curLocation = Folder.current;
	// Scriptsフォルダの基点はOSで異なる:
	//   Mac: Folder.appPackage=「○○.app」→ 親(versionフォルダ)直下に Scripts
	//   Win: Folder.appPackage=「Support Files」→ その直下に Scripts
	// .parent をMac前提で固定していたため、Win では存在しないパスを指し
	// removeDefScriptFiles/loadPreferences/clearCache が全て空振りしていた（修正）。
	var _aeBase = ( $.os.indexOf("Windows") !== -1 ) ? Folder.appPackage : Folder.appPackage.parent;
	curAEScriptsFolder = new Folder( _aeBase.fsName + "/" + "Scripts" );//ローカルAfterEffectsScriptsフォルダ
	myCSUMCCFolder = new Folder( curAEScriptsFolder.fsName + "/" + "CSUMCC" );//ローカルCSUMCCフォルダ
	adminCSUMCCdataFolder = new Folder( "~/Dropbox/AfterEffects/_CSUMCC_data" );//サーバーCSUMCC_dataフォルダ
	adminCSUMCCWfFolder = new Folder( adminCSUMCCdataFolder.fsName + "/" + "CSUMCC_workFormat" );//サーバーCSUMCC_workFormatフォルダ（loadPreferences.jsx が参照）

	StartupScript();
}

// **** FUNCTION ****
	function StartupScript()
{
	myCSUMCCToolsFolder = new Folder( myCSUMCCFolder.fsName + "/" + "(Tools)" );//ローカル(Tools)フォルダ
	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "removeDefScriptFiles.jsx" );
	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "loadPreferences.jsx" );
	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "clearCache.jsx" );
}

// **** FUNCTION ****
	function scriptExecute( scriptFilePath )
{
	var scriptFileName = new File( scriptFilePath );
	scriptFileName.open();
	eval(scriptFileName.read());
	scriptFileName.close();
}
