// ============================================
// Script Name : purgeAllCache
// Version     : v1.1
// 仕様        : AEキャッシュ・クリップボード・CSUMCCキャッシュフォルダを一括クリア
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-30
// ============================================

var curScriptName = "PurgeAllCache";

// **** Main Script ****

// After Effects が物理メモリにキャッシュしているすべてのデータをクリア
app.purge(PurgeTarget.ALL_CACHES);

// クリップボードを空にする（Mac: pbcopy / Win: clip）
if ( isWin ) {
	system.callSystem("cmd /c echo.|clip");
} else {
	system.callSystem("echo -n '' | pbcopy");
}

// (Cache)フォルダの中身を空にする
if ( myCSUMCCCacheFolder != null ) {
	var fileList = myCSUMCCCacheFolder.getFiles();
	if ( fileList.length > 0 ) {
		for ( var i = 0; i < fileList.length; i++ ) { fileList[i].remove(); }
	}
}
