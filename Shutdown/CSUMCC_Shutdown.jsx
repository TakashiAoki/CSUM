// ============================================
// Script Name : CSUMCC_Shutdown
// Version     : v1.1
// 仕様        : AE終了時に実行されるシャットダウンスクリプト
//               Shutdownフォルダに配置して使用
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-31
// ============================================

// **** Main Script ****
// （将来の処理をここに追加）
//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logAeShutdownDate.jsx" );

// **** FUNCTION ****
	function scriptExecute( scriptFilePath )
{
	var scriptFileName = new File( scriptFilePath );
	scriptFileName.open();
	eval(scriptFileName.read());
	scriptFileName.close();
}
