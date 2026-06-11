// ============================================
// Script Name : CSUM_GotoTime
// Version     : v1.7
// 仕様        : 数値と四則演算子(+-*/)でタイムラインを指定時間に移動(アニメ撮影 1コマ目スタート前提)
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-09
// ============================================

(function () {
	var curScriptName = "CSUM_GotoTime";

	if ( !( app.project != null && app.project.activeItem != null && app.project.activeItem instanceof CompItem ) ) { return; }

	var activeComp     = app.project.activeItem;
	var compFrameRate  = activeComp.frameRate;
	var curTimeFrames  = Math.round( ( activeComp.time + activeComp.displayStartTime ) * compFrameRate ) + 1;
	var curTimeSecKoma = ( curTimeFrames > 0 )
		? Math.floor( curTimeFrames / compFrameRate ) + "+" + ( curTimeFrames % compFrameRate )
		: String( curTimeFrames );

	// ダイアログ用ステート
	var Btnon              = "Cancel";;// ダイアログを×で閉じても安全に扱えるよう初期化
	var goToTime           = 0;
	var oneSheetDuration   = "144";
	var gttDlg, absRbtn, relaRbtn, curTimeEdit, oneSheetDurationEdit;

	loadOneSheetDuration( "CSUM Go to Time", "gttDlg" );
	BuildAndShowDialog();

	if ( Btnon == "OK" ) {
		app.beginUndoGroup( curScriptName );
		GetDialogSettings();
		GotoTime( goToTime );
		app.endUndoGroup();
	}

	// **** FUNCTION ******************************************************************************************************************
	//		ヘルプ表示
	function ShowHelpDialog() {
		var CR = String.fromCharCode( 13 );
		var HelpDoc =
			"CSUM_GotoTime Ver.1.7" + CR +
			"Copyright (c) 2007-2026 Takashi Aoki / Over Ray Studio. All rights reserved." + CR +
			"LastUpdate 2026-05-09" + CR +
			"" + CR +
			"CSUM_GotoTimeは、数値と四則演算子「+-*/」を使ってタイムラインを指定した時間に移動させます。" + CR +
			"入力スタイルに２つのモードがあります。" + CR +
			"" + CR +
			"" + CR +
			"●Absolute(絶対値)モード" + CR +
			"" + CR +
			"アニメのタイムシート表記の入力を利用して指定値の時間へ移動します。このモードでは、整数と「+」と「-」のみが使用できます。" + CR +
			"パラメーター「1Sheet」はシート１枚のトータルコマ数です。" + CR +
			"デフォルト値144コマ。" + CR +
			"" + CR +
			"アニメタイムシート表記の入力例 24fpsの場合" + CR +
			"" + CR +
			"	「1+12」	1s12f = 36fに移動します。" + CR +
			"" + CR +
			"	「2-66」	1Sheet=144fの場合、" + CR +
			"			6秒シート2ページ目の66f = 210fに移動します。" + CR +
			"" + CR +
			"	「2-12」	1Sheet=72fの場合、" + CR +
			"			3秒シート2ページ目の12f = 84fに移動します。" + CR +
			"" + CR +
			"" + CR +
			"●Relative(相対値)モード" + CR +
			"" + CR +
			"演算子を使って相対値を入力して指定値の時間へ移動します。" + CR +
			"このモードでは、数値(小数点を含む)と「+-*/」が使用できます。" + CR +
			"" + CR +
			"相対値の入力例" + CR +
			"" + CR +
			"	「+12」、「-24」、「144+」、「2*」" + CR +
			"	頭か尻に演算子を付けると現在時間に対して" + CR +
			"	その値分計算した結果の時間に移動します。" + CR +
			"" + CR +
			"	「252+12」、「120-24+6」" + CR +
			"	などの計算式も利用できます。" + CR +
			"	この場合は現在時間は無視されます。" + CR +
			"" + CR +
			"" + CR +
			"両モードとも通常の数値のみの入力も出来ますが、マイナスフレームへの移動は出来ません。移動可能時間はコンポ尺の範囲内に制限されます。";
		alert( HelpDoc );
	}

	// **** FUNCTION ******************************************************************************************************************
	//		1シートフレーム数読み込み
	function loadOneSheetDuration( scriptName, windowName ) {
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey  = windowName + " One Sheet Duration";
		if ( app.settings.haveSetting( sectionName, sectionKey ) ) {
			oneSheetDuration = app.settings.getSetting( sectionName, sectionKey );
		} else {
			oneSheetDuration = "144";
			app.settings.saveSetting( sectionName, sectionKey, oneSheetDuration );
		}
	}

	// **** FUNCTION ******************************************************************************************************************
	//		1シートフレーム数記憶
	function saveOneSheetDuration( scriptName, windowName, value ) {
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey  = windowName + " One Sheet Duration";
		app.settings.saveSetting( sectionName, sectionKey, String( value ) );
	}

	// **** FUNCTION ******************************************************************************************************************
	//		ウィンドウ位置読み込み
		function loadWindowLocation( windowName, win )
{
		var sectionName = "CSUMCC " + curScriptName;
		var sectionKey = windowName + " Window Location";
		if ( app.settings.haveSetting( sectionName, sectionKey ) )
		{
			var curLocation = app.settings.getSetting( sectionName, sectionKey ).split( "," );
			win.location = [ Number( curLocation[0] ), Number( curLocation[1] ) ];
		}
		else { win.center(); }
}

	// **** FUNCTION ******************************************************************************************************************
	//		ウィンドウ位置記憶
		function saveWindowLocation( windowName, win )
{
		var sectionName = "CSUMCC " + curScriptName;
		var sectionKey = windowName + " Window Location";
		app.settings.saveSetting( sectionName, sectionKey, win.location[0] + "," + win.location[1] );
}

	// **** FUNCTION ******************************************************************************************************************
	//		ダイアログ表示
	function BuildAndShowDialog() {
		gttDlg = new Window( "dialog", "CSUM Go to Time", [ 0, 0, 288, 204 ] );

		var modePnl = gttDlg.add( "panel", [ 16, 16, 272, 60 ], "Mode" );
			absRbtn  = modePnl.add( "radiobutton", [  36, 8, 108, 28 ], "Absolute" ); absRbtn.value = true;
			relaRbtn = modePnl.add( "radiobutton", [ 148, 8, 228, 28 ], "Relative" );

		var timePnl = gttDlg.add( "panel", [ 16, 68, 272, 152 ], "Time" );
			var curTimeCaption1          = timePnl.add( "statictext", [ 16, 15,  80, 35   ], "Go to :" ); curTimeCaption1.justify = "right";
			    curTimeEdit              = timePnl.add( "edittext"  , [ 88, 12.5, 168, 34.5 ], curTimeSecKoma ); curTimeEdit.justify = "center";
			var curTimeCaption2          = timePnl.add( "statictext", [ 176, 15, 182, 35  ], "f" ); curTimeCaption2.justify = "left";

			var oneSheetDurationCaption1 = timePnl.add( "statictext", [ 16, 45,  80, 65   ], "1 Sheet :" ); oneSheetDurationCaption1.justify = "right";
			    oneSheetDurationEdit     = timePnl.add( "edittext"  , [ 88, 42.5, 168, 64.5 ], oneSheetDuration ); oneSheetDurationEdit.justify = "center";
			var oneSheetDurationCaption2 = timePnl.add( "statictext", [ 176, 45, 240, 65  ], "f @ " + compFrameRate + " fps" ); oneSheetDurationCaption2.justify = "left";

		var helpBtn   = gttDlg.add( "button", [  16, 168,  48, 188 ], "?" );
		var cancelBtn = gttDlg.add( "button", [  70, 168, 166, 188 ], "Cancel", { name: "cancel" } );
		var okBtn     = gttDlg.add( "button", [ 176, 168, 272, 188 ], "OK"    , { name: "ok"     } );

		absRbtn  .onClick = function () { curTimeEdit.active = true; curTimeEdit.text = curTimeSecKoma; };
		relaRbtn .onClick = function () { curTimeEdit.active = true; curTimeEdit.text = curTimeFrames; };
		helpBtn  .onClick = function () { Btnon = "Help"  ; ShowHelpDialog(); };
		cancelBtn.onClick = function () { Btnon = "Cancel"; gttDlg.close(); };
		okBtn    .onClick = function () { Btnon = "OK"    ; gttDlg.close(); };
		gttDlg.onShow = function () { curTimeEdit.active = true; };
		gttDlg.onMove = function () { saveWindowLocation( "gttDlg", gttDlg ); };

		loadWindowLocation( "gttDlg", gttDlg );
		gttDlg.show();
	}

	// **** FUNCTION ******************************************************************************************************************
	//		ダイアログ情報取得
	function GetDialogSettings() {
		oneSheetDuration = oneSheetDurationEdit.text;
		var flag = /[^0-9]/.test( oneSheetDuration );
		if ( flag == true || String( oneSheetDuration ) == "NaN" || oneSheetDuration == "" ) { oneSheetDuration = 144; }
		saveOneSheetDuration( "CSUM Go to Time", "gttDlg", oneSheetDuration );

		goToTime = curTimeEdit.text;
		flag = /[^0-9]/.test( goToTime );

		if ( absRbtn.value == true ) {
			// Absolute モード
			if ( flag == true ) {
				// 「+」と「-」が重複して含まれていた場合
				if ( /[\+]/.test( goToTime ) == true && /[\-]/.test( goToTime ) == true ) { goToTime = 1; flag = false; }

				// 「+」が１つだけ含まれていた場合
				if ( flag == true ) {
					var plusSplit = goToTime.split( "+" );
					if ( /[\+]/.test( goToTime ) == true && String( plusSplit[ 2 ] ) == "undefined" ) {
						var Sp = parseFloat( plusSplit[ 0 ], 10 );
						var Fp = parseFloat( plusSplit[ 1 ], 10 );
						goToTime = Sp * compFrameRate + Fp; flag = false;
					}
				}

				// 「-」が１つだけ含まれていた場合
				if ( flag == true ) {
					var minusSplit = goToTime.split( "-" );
					if ( /[\-]/.test( goToTime ) == true && String( minusSplit[ 2 ] ) == "undefined" ) {
						var Sm = parseFloat( minusSplit[ 0 ], 10 );
						var Fm = parseFloat( minusSplit[ 1 ], 10 );
						goToTime = ( Sm - 1 ) * oneSheetDuration + Fm; flag = false;
					}
				}
			} else {
				goToTime = parseFloat( goToTime, 10 ); flag = false;
			}

			// 数値と「+、-」以外の文字列が含まれていた場合
			if ( String( goToTime ) == "NaN" || goToTime == "" ) { goToTime = 1; flag = false; }
			if ( flag == true ) { goToTime = 1; }
		} else {
			// Relative モード
			if ( flag == true ) {
				if ( /[^0-9\.\+\-\*\/]/.test( goToTime ) == true ) {
					// 演算子と数値以外の文字列が含まれていた場合
					goToTime = 1; flag = false;
				} else {
					// 0始まりの数列を含む数式を整理
					var n  = goToTime.length;
					var SP = 0;
					var curFormula = [];
					var curStr;
					for ( var i = 1; i <= n; i++ ) {
						curStr = goToTime.slice( SP, i );
						if ( /[^0-9\.]/.test( curStr ) == true ) {
							curStr = goToTime.slice( SP, i - 1 );
							if ( String( parseFloat( curStr, 10 ) ) == "NaN" ) { curFormula.push( curStr ); }
							else                                               { curFormula.push( parseFloat( curStr, 10 ) ); }
							SP = i - 1;
						}
						if ( i == n ) {
							curStr = goToTime.slice( SP, i );
							if ( String( parseFloat( curStr, 10 ) ) == "NaN" ) { curFormula.push( curStr ); }
							else                                               { curFormula.push( parseFloat( curStr, 10 ) ); }
						}
					}
					var curFormulaStr = curFormula.join( "" );

					// 演算子と数値だけで構成されていた場合
					if ( /^[\+\-\*\/]/.test( goToTime ) == true ) {
						if ( /[\+\-\*\/]$/.test( goToTime ) == true ) {
							// 頭と尻に演算子がある場合
							goToTime = 1;
						} else {
							// 頭にのみ演算子がある場合
							goToTime = eval( curTimeFrames + curFormulaStr );
						}
					} else {
						if ( /[\+\-\*\/]$/.test( goToTime ) == true ) {
							// 尻にのみ演算子がある場合
							goToTime = eval( curFormulaStr + curTimeFrames );
						} else {
							// 頭と尻に演算子がない場合
							goToTime = eval( curFormulaStr );
						}
					}
				}
			} else {
				goToTime = parseFloat( goToTime, 10 ); flag = false;
			}
		}
	}

	// **** FUNCTION ******************************************************************************************************************
	//		タイムライン移動
	function GotoTime( time ) {
		var gtt = ( Math.round( time ) - 1 ) / compFrameRate - activeComp.displayStartTime;
		var maxSec = Math.min( activeComp.duration, 10800 );
		if ( gtt < 0      ) { gtt = 0;      }
		if ( gtt > maxSec ) { gtt = maxSec; }
		activeComp.time = gtt;
	}
})();
