// ============================================
// Script Name : curAepFolderOpen
// Version     : v1.02
// 仕様        : 現在開いているプロジェクトファイルの保存先フォルダを開く
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-16
// ============================================

var curScriptName = "curAepFolderOpen";

// **** Main Script ****
if ( app.project != null && app.project.file != null ) {
	app.project.file.parent.execute();
}
