// getSelectedLayer.jsx Ver.1.7
// ------------------------------------------------------------
// 選択中コンポジションから以下の情報を取得
// ・アクティブコンポ情報
// ・選択中レイヤーリスト
// ・エフェクト適用可能レイヤーリスト
//
// Copyright (c) 2007-2026 Over Ray Studio
// Author : Takashi Aoki (@voyager_vision)
// Last Update : 2026/01/05
// ------------------------------------------------------------

var curScriptName = "getSelectedLayer";

activeComp = null;
activeCompName = null;
activeCompWidth = null;
activeCompHeight = null;
activeCompDuration = null;
activeCompFrameRate = null;
activeCompStartTime = null;
appDisplayStartFrame = null;
selectLayerList = [];
fxLayerList = [];


// **** Main Script ***************************************************************************************************************

if ( app.project.activeItem != null ) { getSelectLayerList(); }

// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリスト取得
		function getSelectLayerList()
{
		var activeItem = app.project.activeItem;
		if ( activeItem instanceof CompItem )
		{
			activeComp = activeItem;
			activeCompName = activeComp.name;
			activeCompWidth = activeComp.width;
			activeCompHeight = activeComp.height;
			activeCompDuration = activeComp.duration;
			activeCompFrameRate = activeComp.frameRate;
			activeCompStartTime = activeComp.displayStartTime;// コンポジション設定の開始フレーム（内部値は秒。フレーム管理前提）
			appDisplayStartFrame = app.project.displayStartFrame;// プロジェクト設定の開始フレーム
			selectLayerList = activeComp.selectedLayers;
			fxLayerList = getFxLayerList( selectLayerList );
		}	
}

// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリストからエフェクト適用可能レイヤーリストを作成
		function getFxLayerList( selectLayerList )
{
		var resultLayerList = [];
		for( var i = 0; i < selectLayerList.length; i++ )
		{
			var curLayer = selectLayerList[i];
			if ( !( curLayer instanceof CameraLayer ) && !( curLayer instanceof LightLayer ) )
			{
				if ( curLayer instanceof AVLayer && curLayer.width != 0 ){ resultLayerList.push( curLayer ); continue; }// Comp,Footage,Solid(サウンド以外)
				if ( curLayer instanceof ShapeLayer ){ resultLayerList.push( curLayer ); continue; }// Shape
				if ( curLayer instanceof TextLayer ){ resultLayerList.push( curLayer ); continue; }// Text
			}
		}
		return resultLayerList;
}